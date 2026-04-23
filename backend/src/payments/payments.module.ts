import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { RazorpayController } from './razorpay.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './payment.entity';
import { Wallet } from './wallet.entity';
import { WalletTransaction } from './wallet-transaction.entity';
import { Settlement } from './settlement.entity';
import { DriverBankDetail } from './bank-detail.entity';
import { WithdrawalRequest } from './withdrawal-request.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { MigrationService } from './migration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Wallet, WalletTransaction, Settlement, DriverBankDetail, WithdrawalRequest]),
    SubscriptionsModule,
  ],
  controllers: [PaymentsController, RazorpayController],
  providers: [PaymentsService, MigrationService],
  exports: [PaymentsService],
})
export class PaymentsModule { }
