import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController, ProfileController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { RiderProfile } from './rider-profile.entity';
import { DriverProfile } from '../drivers/driver-profile.entity';
import { FavoriteDriver } from './favorite-driver.entity';
import { Wallet } from '../payments/wallet.entity';
import { Ride } from '../rides/ride.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, RiderProfile, DriverProfile, FavoriteDriver, Wallet, Ride]), NotificationsModule],
  controllers: [UsersController, ProfileController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
