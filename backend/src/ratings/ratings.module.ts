import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rating } from './rating.entity';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { DriverProfile } from '../drivers/driver-profile.entity';
import { RiderProfile } from '../users/rider-profile.entity';
import { Ride } from '../rides/ride.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Rating, DriverProfile, RiderProfile, Ride])],
    controllers: [RatingsController],
    providers: [RatingsService],
    exports: [RatingsService],
})
export class RatingsModule { }
