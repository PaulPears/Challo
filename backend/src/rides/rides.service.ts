import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not, In, MoreThan, LessThan } from 'typeorm';

import { Ride, RideStatus, VehicleType } from './ride.entity';
import { CreateRideDto } from './dto/create-ride.dto';
import { FareSetting } from './fare-setting.entity';
import { RideRejection } from './ride-rejection.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { PaymentsService } from '../payments/payments.service';
import { RiderProfile } from '../users/rider-profile.entity';
import { DriverProfile } from '../drivers/driver-profile.entity';
import { PricingService } from './pricing.service';
import { MatchingService } from './matching.service';
import { IncentivesService } from '../incentives/incentives.service';
import { RidePolicyService } from './ride-policy.service';

@Injectable()
export class RidesService {
  constructor(
    @InjectRepository(Ride)
    private ridesRepository: Repository<Ride>,
    @InjectRepository(FareSetting)
    private fareSettingsRepository: Repository<FareSetting>,
    @InjectRepository(RideRejection)
    private rideRejectionRepository: Repository<RideRejection>,
    @InjectRepository(DriverProfile)
    private driverProfileRepository: Repository<DriverProfile>,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
    private paymentsService: PaymentsService,
    private pricingService: PricingService,
    private matchingService: MatchingService,
    private incentivesService: IncentivesService,
    private ridePolicyService: RidePolicyService,
    private dataSource: DataSource,
  ) { }

  async calculateFare(
    distance: number,
    duration: number,
    vehicleType: VehicleType,
  ): Promise<{ fare: number }> {
    const estimate = await this.pricingService.getFareEstimate(distance, duration, vehicleType);
    return { fare: estimate.totalFare };
  }

  async getMyRides(userId: string): Promise<Ride[]> {
    return this.ridesRepository.find({
      where: [{ rider_id: userId }, { driver_id: userId }],
      relations: ['driver', 'rider'],
      order: { created_at: 'DESC' },
    });
  }

  async getDriverHistory(driverId: string): Promise<Ride[]> {
    return this.ridesRepository.find({
      where: { driver_id: driverId },
      relations: ['rider'],
      order: { created_at: 'DESC' },
    });
  }

  async getRideById(rideId: string): Promise<Ride | null> {
    return this.ridesRepository.findOne({
      where: { id: rideId },
      relations: ['driver', 'rider'],
    });
  }

  /** Returns the rider's current active ride (accepted or in_progress) for session recovery */
  async getActiveRideForRider(riderId: string): Promise<Ride | null> {
    return this.ridesRepository.findOne({
      where: [
        { rider_id: riderId, status: RideStatus.ACCEPTED },
        { rider_id: riderId, status: RideStatus.IN_PROGRESS },
      ],
      relations: ['driver'],
      order: { updated_at: 'DESC' },
    });
  }

  async createRide(
    createRideDto: CreateRideDto & { rider_id: string },
  ): Promise<Ride> {
    return this.dataSource.transaction(async (manager) => {
      let finalEstimatedFare = createRideDto.fare;
      let superKmApplied = 0;
      let superKmDiscount = 0;
      let riderPayable = finalEstimatedFare;
      let companyPayable = 0;

      if (createRideDto.apply_super_coins && createRideDto.apply_super_coins > 0) {
        await this.usersService.deductSuperCoins(createRideDto.rider_id, createRideDto.apply_super_coins, manager);
        finalEstimatedFare = Math.max(0, finalEstimatedFare - createRideDto.apply_super_coins);
        riderPayable = finalEstimatedFare;
      }

      if (createRideDto.apply_super_km) {
        const riderProfile = await manager.getRepository(RiderProfile).findOne({ where: { user_id: createRideDto.rider_id } });
        if (riderProfile && Number(riderProfile.super_km_balance) > 0) {
          const estimate = await this.pricingService.getFareEstimate(
            createRideDto.distance * 1000, 
            createRideDto.duration * 60, 
            createRideDto.vehicle_type as any,
            createRideDto.pickup_latitude,
            createRideDto.pickup_longitude,
            createRideDto.dropoff_latitude,
            createRideDto.dropoff_longitude,
            Number(riderProfile.super_km_balance)
          );

          if (estimate.superKmApplied && estimate.superKmApplied > 0) {
            superKmApplied = estimate.superKmApplied;
            superKmDiscount = estimate.superKmDiscount || 0;
            riderPayable = estimate.riderPayable || finalEstimatedFare;
            companyPayable = estimate.companyPayable || 0;

            await this.usersService.deductSuperKm(createRideDto.rider_id, superKmApplied, manager);
            // DO NOT override finalEstimatedFare with riderPayable here. 
            // finalEstimatedFare (Tab) should remain the full amount before discount.
          }
        }
      }

      const rideToCreate: Partial<Ride> = {
        ...createRideDto,
        vehicle_type: createRideDto.vehicle_type?.toLowerCase() as VehicleType,
        estimated_distance_km: createRideDto.distance,
        estimated_duration_min: createRideDto.duration,
        estimated_fare: Number(riderPayable) + Number(companyPayable), // Enforce Tab = Taf + Discount
        rider_payable: riderPayable,
        company_payable: companyPayable,
        super_km_applied: superKmApplied,
        super_km_discount: superKmDiscount,
        status: RideStatus.PENDING,
        otp: Math.floor(1000 + Math.random() * 9000).toString(), // Generate 4-digit PIN
      };

      const rideRepo = manager.getRepository(Ride);
      const ride = rideRepo.create(rideToCreate);
      const newRide = await rideRepo.save(ride);

      const favorites = await this.usersService.getFavoriteDrivers(newRide.rider_id);
      console.log(`[Matching] Found ${favorites.length} favorite drivers for rider ${newRide.rider_id}`);
      if (favorites.length > 0) {
        for (const fav of favorites) {
          if (fav.driver && fav.driver.user_id) {
            // Fetch driver profile to check vehicle type
            const driverProfileByUserId = await manager.getRepository(DriverProfile).findOne({ where: { user_id: fav.driver.user_id } });
            
            if (driverProfileByUserId && driverProfileByUserId.vehicle_type === newRide.vehicle_type) {
              // Also check if they are busy
              const activeRideForFav = await manager.getRepository(Ride).findOne({
                where: [
                  { driver_id: fav.driver.user_id, status: RideStatus.ACCEPTED },
                  { driver_id: fav.driver.user_id, status: RideStatus.IN_PROGRESS },
                ]
              });

              if (activeRideForFav) {
                console.log(`[Matching] Skipping favorite driver: ${fav.driver.user_id} (Currently Busy)`);
                continue;
              }

              console.log(`[Matching] Notifying favorite driver: ${fav.driver.user_id} (Vehicle Match: ${driverProfileByUserId.vehicle_type})`);
              this.notificationsService.sendNewRideToDriver(fav.driver.user_id, newRide);
            } else {
              console.log(`[Matching] Skipping favorite driver: ${fav.driver.user_id} (Vehicle Mismatch: ${driverProfileByUserId?.vehicle_type} vs Ride: ${newRide.vehicle_type})`);
            }
          }
        }
      }

      console.log(`[Matching] Searching for drivers within 5km of (${newRide.pickup_latitude}, ${newRide.pickup_longitude})`);
      const nearbyDriverIds = await this.matchingService.getNearbyDriverUserIds(
        newRide.pickup_latitude,
        newRide.pickup_longitude,
        newRide.vehicle_type,
        5, // 5km radius
      );
      console.log(`[Matching] Found ${nearbyDriverIds.length} nearby drivers: ${nearbyDriverIds.join(', ') || 'None'}`);

      nearbyDriverIds.forEach(driverId => {
        // Only notify if not already notified as a favorite
        if (!favorites.some(f => f.driver?.user_id === driverId)) {
          console.log(`[Matching] Notifying nearby driver: ${driverId}`);
          this.notificationsService.sendNewRideToDriver(driverId, newRide);
        }
      });

      this.notificationsService.sendRideUpdate(newRide.id, RideStatus.PENDING, newRide);
      return newRide;
    });
  }

  async updateRideStatus(rideId: string, status: RideStatus): Promise<Ride | null> {
    const ride = await this.getRideById(rideId);
    if (!ride) throw new NotFoundException(`Ride ${rideId} not found`);
    ride.status = status;
    const updatedRide = await this.ridesRepository.save(ride);
    this.notificationsService.sendRideUpdate(rideId, status, updatedRide);
    return updatedRide;
  }

  async acceptRide(rideId: string, driverId: string): Promise<Ride | null> {
    const activeRide = await this.getCurrentRide(driverId);
    if (activeRide) {
      throw new ConflictException('You are already on another ride. Complete it before accepting a new one.');
    }

    const ride = await this.getRideById(rideId);
    if (!ride) throw new NotFoundException(`Ride ${rideId} not found`);
    
    const driver = await this.dataSource.getRepository(DriverProfile).findOne({ where: { user_id: driverId } });
    if (!driver) throw new NotFoundException('Driver profile not found');
    
    // Enforce Ride Laws
    this.ridePolicyService.validate(ride, driver, 'accept');

    ride.driver_id = driverId;
    ride.status = RideStatus.ACCEPTED;
    ride.accepted_at = new Date();

    const updatedRide = await this.ridesRepository.save(ride);
    this.notificationsService.sendRideUpdate(rideId, RideStatus.ACCEPTED, updatedRide);
    return updatedRide;
  }

  async startRide(rideId: string, driverId: string, pin: string): Promise<Ride | null> {
    const ride = await this.getRideById(rideId);
    const driver = await this.dataSource.getRepository(DriverProfile).findOne({ where: { user_id: driverId } });

    if (!driver) throw new NotFoundException('Driver profile not found');

    // Enforce Ride Laws (Continuity Law allows start even if expired)
    this.ridePolicyService.validate(ride, driver, 'start');

    if (ride!.otp !== pin) {
      const { BadRequestException } = require('@nestjs/common');
      throw new BadRequestException('Invalid PIN. Please ask the rider for the correct PIN.');
    }

    ride!.status = RideStatus.IN_PROGRESS;
    ride!.started_at = new Date();

    const updatedRide = await this.ridesRepository.save(ride!);
    this.notificationsService.sendRideUpdate(rideId, RideStatus.IN_PROGRESS, updatedRide);
    return updatedRide;
  }

  async rejectRide(rideId: string, driverId: string): Promise<{ message: string }> {
    try {
      console.log(`[RidesService] Driver ${driverId} rejecting ride ${rideId}`);
      const ride = await this.getRideById(rideId);
      if (!ride) throw new NotFoundException(`Ride ${rideId} not found`);

      // Check if already rejected to be idempotent
      const existing = await this.rideRejectionRepository.findOne({
        where: { ride_id: rideId, driver_id: driverId },
      });

      if (existing) {
        console.log(`[RidesService] Ride ${rideId} already rejected by driver ${driverId}`);
        return { message: 'Ride already rejected' };
      }

      const rejection = this.rideRejectionRepository.create({ 
        ride_id: rideId, 
        driver_id: driverId 
      });
      
      await this.rideRejectionRepository.save(rejection);
      console.log(`[RidesService] Ride ${rideId} successfully rejected by driver ${driverId}`);
      return { message: 'Ride rejected successfully' };
    } catch (error) {
      console.error(`[RidesService] Error rejecting ride ${rideId}:`, error);
      throw error;
    }
  }

  async cancelRide(rideId: string): Promise<Ride | null> {
    return this.updateRideStatus(rideId, RideStatus.CANCELLED);
  }

  async completeRide(rideId: string, driverId: string): Promise<Ride | null> {
    return this.dataSource.transaction(async (manager) => {
      const rideRepo = manager.getRepository(Ride);
      const ride = await rideRepo.findOne({ where: { id: rideId } });
      const driver = await manager.getRepository(DriverProfile).findOne({ where: { user_id: driverId } });

      if (!ride) throw new NotFoundException(`Ride ${rideId} not found`);
      if (!driver) throw new NotFoundException('Driver profile not found');

      if (ride.status === RideStatus.COMPLETED) {
        return ride; // Idempotent
      }

      // Enforce Ride Laws (Continuity Law allows completion even if expired)
      this.ridePolicyService.validate(ride, driver, 'complete');

      ride.status = RideStatus.COMPLETED;
      ride.completed_at = new Date();
      ride.actual_distance_km = ride.estimated_distance_km;
      ride.actual_duration_min = ride.estimated_duration_min;
      // Force mathematical reconciliation: total_fare MUST equal the sum of portions
      const rPayable = Number(ride.rider_payable || 0);
      const cPayable = Number(ride.company_payable || 0);
      ride.final_fare = rPayable + cPayable;
      
      // Calculate GST using Gross Formula (5% of Total) as per verify-super-km.ts
      ride.gst_amount = parseFloat((ride.final_fare * 0.05).toFixed(2));
      ride.platform_fee = 0; // 0% Platform Fee
      ride.driver_earnings = parseFloat((ride.final_fare - ride.gst_amount).toFixed(2));

      const updatedRide = await rideRepo.save(ride);

      if (updatedRide.final_fare > 0) {
        // Super Coins: 3% of fare
        const superCoinsEarned = updatedRide.final_fare * 0.03;
        await this.usersService.awardSuperCoins(updatedRide.rider_id, superCoinsEarned, manager);

        // Super KM: 5% of distance
        if (updatedRide.actual_distance_km > 0) {
          const superKmEarned = updatedRide.actual_distance_km * 0.05;
          await this.usersService.awardSuperKm(updatedRide.rider_id, superKmEarned, manager);
        }

        if (updatedRide.driver_id) {
          const serviceCharge = updatedRide.final_fare * 0.05;
          await this.paymentsService.applyServiceCharge(updatedRide.driver_id, serviceCharge, rideId, manager);

          // Credit Super KM Compensation to Wallet
          if (Number(updatedRide.company_payable) > 0) {
            await this.paymentsService.creditCompanyCompensation(updatedRide.driver_id, Number(updatedRide.company_payable), rideId, manager);
          }

          // Trigger Incentives
          const rider = await manager.getRepository(RiderProfile).findOne({ where: { user_id: updatedRide.rider_id } });
          const driver = await manager.getRepository(DriverProfile).findOne({ where: { user_id: updatedRide.driver_id } });

          if (rider && driver) {
            await this.incentivesService.onRideCompleted(
              updatedRide.driver_id,
              updatedRide.rider_id,
              driver.total_rides,
              rider.total_rides,
            );
          }
        }
      }

      this.notificationsService.sendRideUpdate(rideId, RideStatus.COMPLETED, updatedRide);
      return updatedRide;
    });
  }

  async getHighBookingZones(district?: string): Promise<string[]> {
    try {
      // Find the most frequent pickup points in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const queryBuilder = this.ridesRepository
        .createQueryBuilder('ride')
        .select('ride.pickup_address', 'address')
        .addSelect('COUNT(ride.id)', 'count')
        .where('ride.created_at >= :date', { date: sevenDaysAgo });

      if (district) {
        // Clean district name (remove "District", "Region" etc if geocoder includes them)
        const cleanDistrict = district.replace(/(District|Region|Subdivision|Mandal|Municipality)/gi, '').trim();
        queryBuilder.andWhere('ride.pickup_address ILIKE :district', { district: `%${cleanDistrict}%` });
      }

      const raw = await queryBuilder
        .groupBy('ride.pickup_address')
        .orderBy('count', 'DESC')
        .limit(8)
        .getRawMany();

      if (raw.length === 0) {
        // Localized fallback for major regions if district provided
        if (district) {
          const lowerDistrict = district.toLowerCase();
          if (lowerDistrict.includes('visakhapatnam')) {
            return ['MVP Colony', 'Gajuwaka', 'Jagadamba Junction', 'Siripuram', 'Rushikonda', 'Madhurawada'];
          }
          if (lowerDistrict.includes('vijayawada')) {
            return ['Benz Circle', 'MG Road', 'Gollapudi', 'Patamata', 'Gunadala', 'Kanuru'];
          }
          if (lowerDistrict.includes('anantapur')) {
            return ['Clock Tower', 'Sangameswar Circle', 'Sai Nagar', 'Rudrampeta', 'Kamalanagar'];
          }
          if (lowerDistrict.includes('guntur')) {
            return ['Amaravati Road', 'Lodge Centre', 'Brodipet', 'Arundelpet'];
          }
          if (lowerDistrict.includes('nellore')) {
            return ['Magunta Layout', 'Pogathota', 'Vedayapalem', 'Dargamitta'];
          }
          if (lowerDistrict.includes('kurnool')) {
            return ['C-Camp', 'Rajiv Gandhi Junction', 'Kurnool City', 'Narasimha Reddy Nagar'];
          }
          if (lowerDistrict.includes('tirupati')) {
            return ['Alipiri', 'RTC Bus Stand', 'Railway Station', 'Kapila Theertham'];
          }
        }

        // If a district was provided but we have no specific fallbacks for it, 
        // return empty instead of showing unrelated districts.
        if (district) {
          return [];
        }

        // Generic fallback for new regions or low activity (only if no district provided)
        return [
          'Visakhapatnam - MVP Colony',
          'Visakhapatnam - Gajuwaka',
          'Vijayawada - Benz Circle',
          'Vijayawada - MG Road',
          'Guntur - Amaravati Road',
          'Nellore - Magunta Layout',
          'Kurnool - C-Camp',
          'Tirupati - Alipiri',
        ];
      }

      // Filter and clean addresses - returning unique localities
      const cleanZones = raw.map((r) => {
        const parts = r.address.split(',');
        if (parts.length > 2) {
          // For "12-626, Sangameswar Circle, Sai Nagar, Anantapur", parts are [0: "12-626", 1: "Sangameswar Circle", 2: "Sai Nagar", 3: "Anantapur"]
          // We want to combine landmarks and areas but exclude the district/city name.
          let landmark = parts[1]?.trim() || '';
          let area = parts[2]?.trim() || '';
          
          if (district) {
            const dLower = district.toLowerCase();
            // If any part is just the district, clear it
            if (landmark.toLowerCase().includes(dLower) && landmark.length < district.length + 5) landmark = '';
            if (area.toLowerCase().includes(dLower) && area.length < district.length + 5) area = '';
          }

          if (landmark && area) return `${landmark}, ${area}`;
          return landmark || area || parts[0].trim();
        }
        
        // Fallback for simpler address strings
        let clean = r.address.split('-').pop().trim();
        if (district && clean.toLowerCase().includes(district.toLowerCase())) {
          const parts = r.address.split(new RegExp(district, 'i'));
          if (parts.length > 1 && parts[0].trim()) {
            return parts[0].split(',').pop().trim();
          }
        }
        return clean;
      });

      // deduplicate in case multiple addresses map to same landmark
      return [...new Set(cleanZones)].slice(0, 8);
    } catch (error) {
      console.error('Error fetching high booking zones:', error);
      return [
        'Anantapur - Clock Tower',
        'Anantapur - Sangameswar Circle',
        'Visakhapatnam - MVP Colony',
        'Vijayawada - Benz Circle',
      ];
    }
  }

  async getPendingRides(driverId?: string): Promise<Ride[]> {
    // Only show rides created within the last 6 hours
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    let vehicleTypeFilter: VehicleType | undefined;
    let rejectedRideIds: string[] = [];

    if (driverId) {
      // 1. Fetch driver's vehicle type to filter requests
      const driver = await this.driverProfileRepository.findOne({ 
        where: { user_id: driverId },
        select: ['vehicle_type'] 
      });
      vehicleTypeFilter = driver?.vehicle_type;
      
      if (!driver) {
        console.warn(`[Rides] Driver profile not found for ${driverId} while fetching pending rides`);
      }

      // 2. Fetch rejections
      const rejections = await this.rideRejectionRepository.find({
        where: { driver_id: driverId },
        select: ['ride_id'],
      });
      rejectedRideIds = rejections.map(r => r.ride_id);
    }

    const whereClause: any = {
      status: RideStatus.PENDING,
      created_at: MoreThan(sixHoursAgo),
    };

    if (vehicleTypeFilter) {
      whereClause.vehicle_type = vehicleTypeFilter;
    }

    if (rejectedRideIds.length > 0) {
      whereClause.id = Not(In(rejectedRideIds));
    }

    return this.ridesRepository.find({
      where: whereClause,
      order: { created_at: 'DESC' },
    });
  }

  async getCurrentRide(driverId: string): Promise<Ride | null> {
    return this.ridesRepository.findOne({
      where: [
        { driver_id: driverId, status: RideStatus.ACCEPTED },
        { driver_id: driverId, status: RideStatus.IN_PROGRESS },
      ],
      relations: ['rider'],
      order: { updated_at: 'DESC' },
    });
  }
}
