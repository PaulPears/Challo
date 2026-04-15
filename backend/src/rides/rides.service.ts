import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not, In } from 'typeorm';
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

  async createRide(
    createRideDto: CreateRideDto & { rider_id: string },
  ): Promise<Ride> {
    return this.dataSource.transaction(async (manager) => {
      let finalEstimatedFare = createRideDto.fare;

      if (createRideDto.apply_super_coins && createRideDto.apply_super_coins > 0) {
        await this.usersService.deductSuperCoins(createRideDto.rider_id, createRideDto.apply_super_coins, manager);
        finalEstimatedFare = Math.max(0, finalEstimatedFare - createRideDto.apply_super_coins);
      }

      const rideToCreate: Partial<Ride> = {
        ...createRideDto,
        vehicle_type: createRideDto.vehicle_type?.toLowerCase() as VehicleType,
        estimated_distance_km: createRideDto.distance,
        estimated_duration_min: createRideDto.duration,
        estimated_fare: finalEstimatedFare,
        status: RideStatus.PENDING,
      };

      const rideRepo = manager.getRepository(Ride);
      const ride = rideRepo.create(rideToCreate);
      const newRide = await rideRepo.save(ride);

      const favorites = await this.usersService.getFavoriteDrivers(newRide.rider_id);
      if (favorites.length > 0) {
        favorites.forEach(fav => {
          if (fav.driver && fav.driver.user_id) {
            this.notificationsService.sendNewRideToDriver(fav.driver.user_id, newRide);
          }
        });
      }

      // Smart Matching: Notify nearby drivers if no favorites or in parallel
      const nearbyDriverIds = await this.matchingService.getNearbyDriverUserIds(
        newRide.pickup_latitude,
        newRide.pickup_longitude,
        newRide.vehicle_type,
        5, // 5km radius
      );

      nearbyDriverIds.forEach(driverId => {
        // Only notify if not already notified as a favorite
        if (!favorites.some(f => f.driver?.user_id === driverId)) {
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
    const ride = await this.getRideById(rideId);
    const driver = await this.dataSource.getRepository(DriverProfile).findOne({ where: { user_id: driverId } });
    
    if (!driver) throw new NotFoundException('Driver profile not found');
    
    // Enforce Ride Laws
    this.ridePolicyService.validate(ride, driver, 'accept');

    ride!.driver_id = driverId;
    ride!.status = RideStatus.ACCEPTED;
    ride!.accepted_at = new Date();

    const updatedRide = await this.ridesRepository.save(ride!);
    this.notificationsService.sendRideUpdate(rideId, RideStatus.ACCEPTED, updatedRide);
    return updatedRide;
  }

  async startRide(rideId: string, driverId: string): Promise<Ride | null> {
    const ride = await this.getRideById(rideId);
    const driver = await this.dataSource.getRepository(DriverProfile).findOne({ where: { user_id: driverId } });

    if (!driver) throw new NotFoundException('Driver profile not found');

    // Enforce Ride Laws (Continuity Law allows start even if expired)
    this.ridePolicyService.validate(ride, driver, 'start');

    ride!.status = RideStatus.IN_PROGRESS;
    ride!.started_at = new Date();

    const updatedRide = await this.ridesRepository.save(ride!);
    this.notificationsService.sendRideUpdate(rideId, RideStatus.IN_PROGRESS, updatedRide);
    return updatedRide;
  }

  async rejectRide(rideId: string, driverId: string): Promise<{ message: string }> {
    const ride = await this.getRideById(rideId);
    if (!ride) throw new NotFoundException(`Ride ${rideId} not found`);

    // Check if already rejected to be idempotent
    const existing = await this.rideRejectionRepository.findOne({
      where: { ride_id: rideId, driver_id: driverId },
    });
    if (existing) {
      return { message: 'Ride already rejected' };
    }

    const rejection = this.rideRejectionRepository.create({ ride_id: rideId, driver_id: driverId });
    await this.rideRejectionRepository.save(rejection);
    return { message: 'Ride rejected successfully' };
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
      ride.final_fare = ride.estimated_fare;

      const updatedRide = await rideRepo.save(ride);

      if (updatedRide.final_fare > 0) {
        const superCoinsEarned = updatedRide.final_fare * 0.05;
        await this.usersService.awardSuperCoins(updatedRide.rider_id, superCoinsEarned, manager);

        if (updatedRide.driver_id) {
          const platformFee = updatedRide.final_fare * 0.05;
          await this.paymentsService.applyPlatformFee(updatedRide.driver_id, platformFee, rideId, manager);

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

  async getHighBookingZones(): Promise<string[]> {
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

  async getPendingRides(driverId?: string): Promise<Ride[]> {
    // If driverId is provided, filter out rides the driver has already rejected
    if (driverId) {
      const rejections = await this.rideRejectionRepository.find({
        where: { driver_id: driverId },
        select: ['ride_id'],
      });
      const rejectedRideIds = rejections.map(r => r.ride_id);

      if (rejectedRideIds.length > 0) {
        return this.ridesRepository.find({
          where: {
            status: RideStatus.PENDING,
            id: Not(In(rejectedRideIds)),
          },
          order: { created_at: 'DESC' },
        });
      }
    }

    return this.ridesRepository.find({
      where: { status: RideStatus.PENDING },
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
