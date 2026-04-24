import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { RiderProfile } from './rider-profile.entity';
import { DriverProfile } from './../drivers/driver-profile.entity';
import { FavoriteDriver } from './favorite-driver.entity';
import { Wallet } from './../payments/wallet.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Ride, RideStatus } from '../rides/ride.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(RiderProfile)
    private riderProfileRepository: Repository<RiderProfile>,
    @InjectRepository(DriverProfile)
    private driverProfileRepository: Repository<DriverProfile>,
    @InjectRepository(FavoriteDriver)
    private favoriteDriverRepository: Repository<FavoriteDriver>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Ride)
    private ridesRepository: Repository<Ride>,
    private notificationsService: NotificationsService,
  ) { }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const riderProfile = await this.riderProfileRepository.findOne({ where: { user_id: userId } });
    const driverProfile = await this.driverProfileRepository.findOne({ where: { user_id: userId } });

    const userProfileData = {
      id: user.id,
      name: user.name || 'User',
      phoneNumber: user.phone_number,
      roles: user.roles,
      rating: driverProfile ? Number(driverProfile.driver_rating) : (riderProfile ? Number(riderProfile.rider_rating) : 5.0),
      super_coins_balance: riderProfile ? Number(riderProfile.super_coins_balance || 0) : 0,
      super_km_balance: riderProfile ? Number(riderProfile.super_km_balance || 0) : 0,
      trips: driverProfile ? driverProfile.total_rides : (riderProfile ? riderProfile.total_rides : 0),
      memberSince: user.created_at.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      vehicleModel: driverProfile?.vehicle_model || 'N/A',
      vehiclePlateNumber: driverProfile?.vehicle_plate_number || 'N/A',
      vehicleColor: driverProfile?.vehicle_color || 'N/A',
      avatar: user.profile_image || null,
      is_verified: driverProfile?.status === 'active',
      driver_id: driverProfile ? user.id : null,
      driver_status: driverProfile?.status || null,
      isOnline: driverProfile?.is_online || false,
      subscriptionExpiry: driverProfile?.subscription_expiry || null,
      currentAddress: driverProfile?.current_address || 'Not available',
      location: driverProfile ? {
        latitude: Number(driverProfile.current_latitude),
        longitude: Number(driverProfile.current_longitude),
      } : null,
    };

    return {
      ...userProfileData,
      profile: userProfileData
    };
  }

  async findOneByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { phone_number: phoneNumber },
    });
  }

  async findOneByPhoneNumberWithPassword(phoneNumber: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { phone_number: phoneNumber },
      select: ['id', 'phone_number', 'roles', 'name', 'password'],
    });
  }

  async setUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await this.usersRepository.update(userId, { password: hashedPassword });
  }

  async updateRoles(userId: string, roles: UserRole[]): Promise<void> {
    await this.usersRepository.update(userId, { roles });
    
    // Ensure rider profile exists if rider role is added
    if (roles.includes(UserRole.RIDER)) {
      const profile = await this.riderProfileRepository.findOne({ where: { user_id: userId } });
      if (!profile) {
        await this.createRiderProfile(userId);
      }
    }
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    const savedUser = await this.usersRepository.save(user);

    // Create rider profile for new user
    if (savedUser.roles.includes(UserRole.RIDER)) {
      await this.createRiderProfile(savedUser.id);
    }

    return savedUser;
  }

  async update(id: string, name: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }
    user.name = name;
    return this.usersRepository.save(user);
  }

  async createRiderProfile(userId: string): Promise<RiderProfile> {
    const riderProfile = this.riderProfileRepository.create({
      user_id: userId,
      rider_rating: 5.0,
      total_rides: 0,
    });
    return this.riderProfileRepository.save(riderProfile);
  }

  async getUserRating(userId: string): Promise<number> {
    const riderProfile = await this.riderProfileRepository.findOne({
      where: { user_id: userId },
    });

    if (!riderProfile) {
      // Create profile if it doesn't exist and return default rating
      await this.createRiderProfile(userId);
      return 5.0;
    }

    return Number(riderProfile.rider_rating);
  }


  async awardSuperCoins(userId: string, amount: number, manager?: any): Promise<void> {
    const repo = manager ? manager.getRepository(RiderProfile) : this.riderProfileRepository;

    // Instead of fineOne/save which can race, use mathematically atomic increment
    await repo.increment({ user_id: userId }, 'super_coins_balance', Math.floor(amount));
  }

  async deductSuperCoins(userId: string, amount: number, manager?: any): Promise<void> {
    const repo = manager ? manager.getRepository(RiderProfile) : this.riderProfileRepository;

    const profile = await repo.findOne({ where: { user_id: userId } });
    if (!profile || (profile.super_coins_balance || 0) < amount) {
      throw new BadRequestException('Insufficient super coins or profile missing');
    }

    await repo.decrement({ user_id: userId }, 'super_coins_balance', Math.floor(amount));
  }

  async awardSuperKm(userId: string, amount: number, manager?: any): Promise<void> {
    const repo = manager ? manager.getRepository(RiderProfile) : this.riderProfileRepository;
    await repo.increment({ user_id: userId }, 'super_km_balance', amount);
  }

  async deductSuperKm(userId: string, amount: number, manager?: any): Promise<void> {
    const repo = manager ? manager.getRepository(RiderProfile) : this.riderProfileRepository;
    const profile = await repo.findOne({ where: { user_id: userId } });
    if (!profile || Number(profile.super_km_balance || 0) < amount) {
      throw new BadRequestException('Insufficient Super KM balance');
    }
    await repo.decrement({ user_id: userId }, 'super_km_balance', amount);
  }

  async addFavoriteDriver(riderId: string, driverId: number): Promise<FavoriteDriver> {
    const existing = await this.favoriteDriverRepository.findOne({ where: { rider_id: riderId, driver_id: driverId } });
    if (existing) return existing;
    const favorite = this.favoriteDriverRepository.create({ rider_id: riderId, driver_id: driverId });
    return this.favoriteDriverRepository.save(favorite);
  }

  async getFavoriteDrivers(riderId: string): Promise<FavoriteDriver[]> {
    return this.favoriteDriverRepository.find({ where: { rider_id: riderId }, relations: ['driver'] });
  }

  async removeFavoriteDriver(riderId: string, driverId: number): Promise<void> {
    await this.favoriteDriverRepository.delete({ rider_id: riderId, driver_id: driverId });
  }

  async updatePushToken(userId: string, token: string, role?: string): Promise<void> {
    const updateData: any = {};
    if (role === 'driver') {
      updateData.driver_push_token = token;
    } else {
      updateData.rider_push_token = token; // Default to rider if not specified
    }
    await this.usersRepository.update(userId, updateData);
  }

  async updateDriverStatus(userId: string, statusData: { online: boolean; location?: { latitude: number; longitude: number } }): Promise<void> {
    if (!statusData.online) {
      // Check if driver has any active rides
      const activeRide = await this.ridesRepository.findOne({
        where: [
          { driver_id: userId, status: RideStatus.ACCEPTED },
          { driver_id: userId, status: RideStatus.IN_PROGRESS },
        ],
      });

      if (activeRide) {
        throw new BadRequestException('You cannot go offline while you have an active ride. Complete it first.');
      }
    }

    if (statusData.online) {
      const wallet = await this.walletRepository.findOne({ where: { user_id: userId } });
      if (wallet && Number(wallet.pending_platform_fees) >= 100) {
        throw new BadRequestException(`Blocked: Outstanding Service tax (GST) dues of ₹${wallet.pending_platform_fees}. Please settle dues to go online.`);
      }
    }

    const updateData: any = { is_online: statusData.online };

    if (statusData.location) {
      updateData.current_latitude = statusData.location.latitude;
      updateData.current_longitude = statusData.location.longitude;
    }

    await this.driverProfileRepository.update({ user_id: userId }, updateData);

    if (statusData.location) {
      this.notificationsService.sendDriverLocation(userId, statusData.location);
    }
  }
}
