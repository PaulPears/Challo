import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionSale } from './subscription-sale.entity';
import { DriverProfile } from '../drivers/driver-profile.entity';

import { SubscriptionPlan } from './subscription-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionSale, DriverProfile, SubscriptionPlan])],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
 export class SubscriptionsModule {}
