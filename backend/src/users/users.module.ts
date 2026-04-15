import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController, ProfileController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { RiderProfile } from './rider-profile.entity';
import { DriverProfile } from '../drivers/driver-profile.entity';
import { FavoriteDriver } from './favorite-driver.entity';
import { Wallet } from '../payments/wallet.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, RiderProfile, DriverProfile, FavoriteDriver, Wallet]), NotificationsModule],
  controllers: [UsersController, ProfileController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
