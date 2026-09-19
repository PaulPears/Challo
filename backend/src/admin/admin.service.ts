import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, Like } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { DriverProfile, DriverStatus } from '../drivers/driver-profile.entity';
import { Ride, RideStatus } from '../rides/ride.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { RidePolicyService } from '../rides/ride-policy.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(DriverProfile)
    private driverProfileRepository: Repository<DriverProfile>,
    @InjectRepository(Ride)
    private ridesRepository: Repository<Ride>,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    private ridePolicyService: RidePolicyService,
  ) {}


  async getPendingDrivers() {
    return this.driverProfileRepository.find({
      where: { status: DriverStatus.PENDING_APPROVAL },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async searchDrivers(query: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const qb = this.driverProfileRepository.createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .orderBy('profile.created_at', 'DESC')
      .take(limit)
      .skip(skip);

    if (query) {
      // Check if query is a UUID (for searching by ID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(query)) {
        qb.where('profile.user_id = :id', { id: query });
      } else {
        qb.where('user.name ILIKE :q OR user.phone_number LIKE :q', { q: `%${query}%` });
      }
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async searchRiders(query: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const qb = this.usersRepository.createQueryBuilder('user')
      .where(':role = ANY(user.roles)', { role: UserRole.RIDER })
      .orderBy('user.created_at', 'DESC')
      .take(limit)
      .skip(skip);

    if (query) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(query)) {
        qb.andWhere('user.id = :id', { id: query });
      } else {
        qb.andWhere('(user.name ILIKE :q OR user.phone_number LIKE :q)', { q: `%${query}%` });
      }
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async suspendDriver(userId: string) {
    const profile = await this.driverProfileRepository.findOne({ where: { user_id: userId } });
    if (!profile) throw new NotFoundException('Driver profile not found');
    
    profile.status = DriverStatus.SUSPENDED;
    await this.driverProfileRepository.save(profile);

    // Notify Driver
    await this.notificationsService.adminBroadcast(
      userId,
      'Account Suspended 🛑',
      'Your pilot account has been temporarily suspended by an administrator. Please contact support for details.'
    );

    return { message: 'Driver has been suspended' };
  }

  async activateDriver(userId: string) {
    const profile = await this.driverProfileRepository.findOne({ where: { user_id: userId } });
    if (!profile) throw new NotFoundException('Driver profile not found');
    
    profile.status = DriverStatus.ACTIVE;
    await this.driverProfileRepository.save(profile);

    // Notify Driver
    await this.notificationsService.adminBroadcast(
      userId,
      'Account Reactivated! ✅',
      'Good news! Your pilot account has been reactivated. You can start accepting rides again.'
    );

    return { message: 'Driver has been activated' };
  }

  async approveDriver(userId: string, adminId: string) {
    const profile = await this.driverProfileRepository.findOne({ 
      where: { user_id: userId },
      relations: ['user']
    });

    if (!profile) {
      throw new NotFoundException('Driver profile not found');
    }

    // 1. Update Profile Status
    profile.status = DriverStatus.ACTIVE;
    profile.approved_at = new Date();
    profile.approved_by = adminId;
    await this.driverProfileRepository.save(profile);

    // 2. Add DRIVER role to User if not present
    const user = profile.user;
    if (!user.roles.includes(UserRole.DRIVER)) {
      user.roles.push(UserRole.DRIVER);
      await this.usersRepository.save(user);
    }

    // 3. Notify Driver
    await this.notificationsService.adminBroadcast(
      userId,
      'Welcome Aboard! 🚀',
      'Your pilot profile has been approved! You are now part of the RideAndhra family.'
    );

    return { message: 'Driver approved successfully' };
  }

  async rejectDriver(userId: string) {
    const profile = await this.driverProfileRepository.findOne({ where: { user_id: userId } });
    if (!profile) {
      throw new NotFoundException('Driver profile not found');
    }

    profile.status = DriverStatus.SUSPENDED;
    await this.driverProfileRepository.save(profile);

    // 3. Notify Driver
    await this.notificationsService.adminBroadcast(
      userId,
      'Registration Status',
      'Your pilot registration could not be approved at this time. Please ensure your documents are valid and try again.'
    );

    return { message: 'Driver registration rejected' };
  }

  async getDriverReviews(userId: string) {
    return this.ridesRepository.find({
      where: { 
        driver_id: userId, 
        status: RideStatus.COMPLETED,
        rider_rating: Not(IsNull()) 
      },
      relations: ['rider'],
      select: {
        id: true,
        rider_rating: true,
        rider_review: true,
        created_at: true,
        rider: {
          name: true,
          phone_number: true,
        }
      },
      order: { created_at: 'DESC' },
      take: 20 // Scalability: limit to last 20 reviews
    });
  }

  async getStats() {
    const [totalUsers, totalDrivers, activeRides, pendingDrivers] = await Promise.all([
      this.usersRepository.count(),
      this.driverProfileRepository.count({ where: { status: DriverStatus.ACTIVE } }),
      this.ridesRepository.count({ where: { status: RideStatus.IN_PROGRESS } }),
      this.driverProfileRepository.count({ where: { status: DriverStatus.PENDING_APPROVAL } }),
    ]);

    return {
      totalUsers,
      totalDrivers,
      activeRides,
      pendingDrivers,
    };
  }

  async makeAdmin(phoneNumber: string) {
    const user = await this.usersRepository.findOne({ where: { phone_number: phoneNumber } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.roles.includes(UserRole.ADMIN)) {
      user.roles.push(UserRole.ADMIN);
      await this.usersRepository.save(user);
    }

    return { message: `User ${phoneNumber} is now an Admin` };
  }

  async getFinancialReports(page: number = 1, limit: number = 10) {
    // 1. Rides Aggregation
    const { totalRideRevenue } = await this.ridesRepository
      .createQueryBuilder('ride')
      .select('SUM(ride.final_fare)', 'totalRideRevenue')
      .where('ride.status = :status', { status: RideStatus.COMPLETED })
      .getRawOne();
      
    // 2. Subscriptions Aggregation (Subscriptions removed platform-wide)
    const parsedRideRevenue = parseFloat(totalRideRevenue) || 0;
    const rideTaxAmount = parsedRideRevenue * 0.05; // 5% ride tax

    // 3. Paginated Rides List
    const skip = (page - 1) * limit;
    const [rides, totalRides] = await this.ridesRepository.findAndCount({
      where: { status: RideStatus.COMPLETED },
      relations: ['rider', 'driver'],
      order: { completed_at: 'DESC' },
      take: limit,
      skip: skip,
    });

    const formattedRides = rides.map(r => ({
      id: r.id,
      completed_at: r.completed_at,
      rider_name: r.rider?.name || 'Unknown',
      driver_name: r.driver?.name || 'Unknown',
      final_fare: Number(r.final_fare),
      tax_amount: Number(r.final_fare) * 0.05,
      vehicle_type: r.vehicle_type
    }));

    return {
      overview: {
        totalRideRevenue: parsedRideRevenue,
        rideTaxTotal: rideTaxAmount,
        totalSubscriptionRevenue: 0,
        subscriptionTaxTotal: 0,
        totalSubscriptionsSold: 0
      },
      recentRides: {
        items: formattedRides,
        meta: {
          total: totalRides,
          page,
          limit,
          totalPages: Math.ceil(totalRides / limit)
        }
      }
    };
  }

  async grantManualSubscription(driverId: string, days: number) {
    return { success: true, message: 'Subscriptions are disabled; driver already has full access.' };
  }

  async getSpecialAccessDrivers() {
    return this.driverProfileRepository.find({
      where: { is_manual_access: true },
      relations: ['user'],
    });
  }

  async getGracePeriodDrivers() {
    const drivers = await this.driverProfileRepository.find({
      relations: ['user'],
    });
    
    return drivers.filter(profile => this.ridePolicyService.isGracePeriod(profile));
  }
}



