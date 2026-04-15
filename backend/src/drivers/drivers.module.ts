import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from './driver.entity';
import { DriverDocument } from './driver-document.entity';
import { DriverProfile } from './driver-profile.entity';
import { User } from '../users/user.entity';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';

import { StorageModule } from '../common/storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Driver, DriverProfile, DriverDocument, User]),
    StorageModule,
  ],
  controllers: [DriversController],
  providers: [DriversService],
  exports: [TypeOrmModule, DriversService],
})
export class DriversModule {}