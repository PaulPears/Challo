import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminNotificationsController } from './admin-notifications.controller';
import { AdminService } from './admin.service';
import { User } from '../users/user.entity';
import { DriverProfile } from '../drivers/driver-profile.entity';
import { Ride } from '../rides/ride.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { RidesModule } from '../rides/rides.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, DriverProfile, Ride]),
    NotificationsModule,
    RidesModule,
  ],
  controllers: [AdminController, AdminNotificationsController],
  providers: [AdminService],
})
export class AdminModule {}


