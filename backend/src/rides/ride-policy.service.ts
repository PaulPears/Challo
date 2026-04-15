import { Injectable, ForbiddenException, ConflictException } from '@nestjs/common';
import { Ride, RideStatus } from './ride.entity';
import { DriverProfile } from '../drivers/driver-profile.entity';

export enum RideLawViolation {
  NO_SUBSCRIPTION = 'DRIVER_SUBSCRIPTION_EXPIRED',
  WRONG_DRIVER = 'ACTION_RESTRICTED_TO_ASSIGNED_DRIVER',
  INVALID_TRANSITION = 'INVALID_RIDE_STATE_TRANSITION',
  ALREADY_BUSY = 'DRIVER_ALREADY_ON_ANOTHER_RIDE',
  DRIVER_OFFLINE = 'DRIVER_MUST_BE_ONLINE',
}

@Injectable()
export class RidePolicyService {
  private readonly GRACE_PERIOD_HOURS = 12;

  /**
   * Validates if a driver can perform an action on a ride.
   * Centralizes all "Ride Laws" of the platform.
   */
  validate(ride: Ride | null, driver: DriverProfile, action: 'accept' | 'start' | 'complete' | 'cancel'): void {
    const now = new Date();

    // 1. Online Check (Basic Law)
    if (!driver.is_online && action === 'accept') {
      throw new ForbiddenException(RideLawViolation.DRIVER_OFFLINE);
    }

    // 2. State Specific Laws
    switch (action) {
      case 'accept':
        this.validateAcceptance(ride, driver, now);
        break;
      case 'start':
        this.validateStart(ride, driver);
        break;
      case 'complete':
        this.validateCompletion(ride, driver);
        break;
      case 'cancel':
        this.validateCancellation(ride, driver);
        break;
    }
  }

  private validateAcceptance(ride: Ride | null, driver: DriverProfile, now: Date) {
    if (!ride || ride.status !== RideStatus.PENDING) {
      throw new ConflictException(RideLawViolation.INVALID_TRANSITION);
    }

    // --- Subscription & Grace Period Law ---
    const expiry = driver.subscription_expiry;
    const graceExpiry = expiry ? new Date(expiry.getTime() + this.GRACE_PERIOD_HOURS * 60 * 60 * 1000) : null;

    const isWithinGrace = graceExpiry && now <= graceExpiry;
    
    // Admin manual access takes precedence or acts as a normal subscription
    if (!expiry || (now > expiry && !isWithinGrace)) {
        throw new ForbiddenException(RideLawViolation.NO_SUBSCRIPTION);
    }
  }

  private validateStart(ride: Ride | null, driver: DriverProfile) {
    if (!ride) throw new ConflictException('Ride not found');
    
    // Ownership Law
    if (ride.driver_id !== driver.user_id) {
      throw new ForbiddenException(RideLawViolation.WRONG_DRIVER);
    }

    // Sequence Law
    if (ride.status !== RideStatus.ACCEPTED) {
      throw new ConflictException(RideLawViolation.INVALID_TRANSITION);
    }

    // Continuity Law: Subscription is NOT checked here. 
    // If you accepted it while valid (or in grace), you can start it.
  }

  private validateCompletion(ride: Ride | null, driver: DriverProfile) {
    if (!ride) throw new ConflictException('Ride not found');

    // Ownership Law
    if (ride.driver_id !== driver.user_id) {
      throw new ForbiddenException(RideLawViolation.WRONG_DRIVER);
    }

    // Sequence Law
    if (ride.status !== RideStatus.IN_PROGRESS) {
      throw new ConflictException(RideLawViolation.INVALID_TRANSITION);
    }

    // Continuity Law: Subscription is NOT checked here.
  }

  private validateCancellation(ride: Ride | null, driver: DriverProfile) {
    if (!ride) throw new ConflictException('Ride not found');

    // Basic logic: Can't cancel what's already done
    if (ride.status === RideStatus.COMPLETED || ride.status === RideStatus.CANCELLED) {
      throw new ConflictException(RideLawViolation.INVALID_TRANSITION);
    }
  }

  /**
   * Check if a driver is currently in grace period
   */
  isGracePeriod(driver: DriverProfile): boolean {
    const now = new Date();
    const expiry = driver.subscription_expiry;
    if (!expiry) return false;
    
    const graceExpiry = new Date(expiry.getTime() + this.GRACE_PERIOD_HOURS * 60 * 60 * 1000);
    return now > expiry && now <= graceExpiry;
  }
}
