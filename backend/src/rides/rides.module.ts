import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';
import { Ride } from './ride.entity';
import { RideRoute } from './ride-route.entity';
import { FareSetting } from './fare-setting.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { FareTier } from './fare-tier.entity';
import { UsersModule } from '../users/users.module';
import { PaymentsModule } from '../payments/payments.module';
import { RideRejection } from './ride-rejection.entity';
import { SurgeEvent } from './surge-event.entity';
import { PeakHourSurge } from './peak-hour-surge.entity';
import { PricingService } from './pricing.service';
import { MatchingService } from './matching.service';
import { RidePolicyService } from './ride-policy.service';
import { RideCleanupService } from './ride-cleanup.service';
import { WeatherService } from './weather.service';
import { TrafficService } from './traffic.service';
import { DriverProfile } from '../drivers/driver-profile.entity';
import { IncentivesModule } from '../incentives/incentives.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ride, RideRoute, FareSetting, FareTier, RideRejection, SurgeEvent, PeakHourSurge, DriverProfile]),
    NotificationsModule,
    UsersModule,
    PaymentsModule,
    IncentivesModule,
  ],
  controllers: [RidesController],
  providers: [RidesService, PricingService, MatchingService, RidePolicyService, RideCleanupService, WeatherService, TrafficService],
  exports: [RidesService, PricingService, MatchingService, RidePolicyService, WeatherService, TrafficService],
})
export class RidesModule { }
