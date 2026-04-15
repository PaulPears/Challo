import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from './wallet.entity';
import { WalletTransaction, TransactionType } from './wallet-transaction.entity';
import { Settlement, SettlementStatus } from './settlement.entity';
import * as crypto from 'crypto';
const Razorpay = require('razorpay');

@Injectable()
export class PaymentsService {
    private razorpayClient: any;

    constructor(
        @InjectRepository(Wallet)
        private walletRepository: Repository<Wallet>,
        @InjectRepository(WalletTransaction)
        private walletTransactionRepository: Repository<WalletTransaction>,
        @InjectRepository(Settlement)
        private settlementRepository: Repository<Settlement>,
        private dataSource: DataSource,
    ) {
        this.razorpayClient = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummyKey123',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummySecret123',
        });
    }

    async getWalletByUserId(userId: string): Promise<Wallet> {
        try {
            let wallet = await this.walletRepository.findOne({ where: { user_id: userId } });
            if (!wallet) {
                wallet = this.walletRepository.create({
                    user_id: userId,
                    balance: 0,
                    currency: 'INR',
                    is_active: true,
                });
                wallet = await this.walletRepository.save(wallet);
            }
            return wallet;
        } catch (error) {
            console.error('Error in getWalletByUserId:', error);
            throw new InternalServerErrorException('Could not fetch wallet');
        }
    }

    async getWalletTransactions(userId: string, limit: number = 20): Promise<WalletTransaction[]> {
        try {
            const wallet = await this.getWalletByUserId(userId);
            return this.walletTransactionRepository.find({
                where: { wallet_id: wallet.id },
                order: { created_at: 'DESC' },
                take: limit,
            });
        } catch (error) {
            console.error('Error in getWalletTransactions:', error);
            throw new InternalServerErrorException('Could not fetch transactions');
        }
    }

    async applyPlatformFee(driverUserId: string, feeAmount: number, rideId: string, manager?: any): Promise<void> {
        try {
            const walletRepo = manager ? manager.getRepository(Wallet) : this.walletRepository;
            const transactionRepo = manager ? manager.getRepository(WalletTransaction) : this.walletTransactionRepository;

            const wallet = await this.getWalletByUserId(driverUserId);
            const gstAmount = Number(feeAmount) * 0.18; // 18% GST on platform fee
            const totalFeeWithTax = Number(feeAmount) + gstAmount;

            await walletRepo.increment({ id: wallet.id }, 'pending_platform_fees', totalFeeWithTax);
            const updatedWallet = await walletRepo.findOne({ where: { id: wallet.id } });

            const transaction = transactionRepo.create({
                wallet_id: wallet.id,
                amount: totalFeeWithTax,
                transaction_type: TransactionType.FEE_DEDUCTION,
                reference_type: 'ride',
                reference_id: rideId,
                description: `Platform fee (₹${Number(feeAmount).toFixed(2)}) + GST 18% (₹${gstAmount.toFixed(2)}) for cash ride`,
                balance_after: updatedWallet ? updatedWallet.balance : 0,
            });
            await transactionRepo.save(transaction);
        } catch (error) {
            console.error('Error applying platform fee:', error);
            // Non-fatal: log but don't throw so ride completion still succeeds
        }
    }

    async createSettlementOrder(driverUserId: string, amount: number): Promise<any> {
        const wallet = await this.getWalletByUserId(driverUserId);
        if (Number(wallet.pending_platform_fees) < Number(amount)) {
            throw new BadRequestException('Settle amount exceeds pending fees');
        }
        if (amount <= 0) {
            throw new BadRequestException('Settlement amount must be greater than 0');
        }

        try {
            const options = {
                amount: Math.round(amount * 100),
                currency: 'INR',
                receipt: `settle_${wallet.id}_${Date.now()}`,
            };
            const order = await this.razorpayClient.orders.create(options);

            // Persist settlement record as PENDING for history tracking
            const settlement = this.settlementRepository.create({
                driver_id: driverUserId,
                amount,
                razorpay_order_id: order.id,
                status: SettlementStatus.PENDING,
            });
            await this.settlementRepository.save(settlement);

            return order;
        } catch (error: any) {
            if (error instanceof BadRequestException) throw error;
            console.error('Razorpay Error:', error);
            throw new InternalServerErrorException('Failed to generate payment order. Please try again.');
        }
    }

    async verifySettlement(driverUserId: string, paymentId: string, orderId: string, signature: string, amount: number): Promise<void> {
        const secret = process.env.RAZORPAY_KEY_SECRET || 'dummySecret123';
        const generated_signature = crypto.createHmac('sha256', secret)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        const settlement = await this.settlementRepository.findOne({ where: { razorpay_order_id: orderId, driver_id: driverUserId } });

        if (generated_signature !== signature) {
            // Mark settlement as FAILED so it shows up in history
            if (settlement) {
                settlement.status = SettlementStatus.FAILED;
                await this.settlementRepository.save(settlement);
            }
            throw new BadRequestException('Invalid payment signature. Please contact support.');
        }

        await this.dataSource.transaction(async manager => {
            const walletRepo = manager.getRepository(Wallet);
            const transactionRepo = manager.getRepository(WalletTransaction);
            const settlementRepo = manager.getRepository(Settlement);

            const wallet = await walletRepo.findOne({ where: { user_id: driverUserId } });
            if (!wallet) throw new BadRequestException('Wallet not found');

            const settleAmount = Math.min(Number(amount), Number(wallet.pending_platform_fees));
            if (settleAmount <= 0) throw new BadRequestException('No pending dues to settle');

            await walletRepo.decrement({ id: wallet.id }, 'pending_platform_fees', settleAmount);
            const updatedWallet = await walletRepo.findOne({ where: { id: wallet.id } });

            const transaction = transactionRepo.create({
                wallet_id: wallet.id,
                amount: settleAmount,
                transaction_type: TransactionType.FEE_SETTLEMENT,
                reference_type: 'settlement',
                reference_id: paymentId,
                description: `Dues settled via Razorpay (ID: ${paymentId})`,
                balance_after: updatedWallet ? updatedWallet.balance : 0,
            });
            await transactionRepo.save(transaction);

            // Update settlement record to SUCCESS
            if (settlement) {
                settlement.status = SettlementStatus.SUCCESS;
                settlement.razorpay_payment_id = paymentId;
                await settlementRepo.save(settlement);
            }
        });
    }

    async getSettlementHistory(driverUserId: string, limit: number = 50): Promise<Settlement[]> {
        try {
            return this.settlementRepository.find({
                where: { driver_id: driverUserId },
                order: { created_at: 'DESC' },
                take: limit,
            });
        } catch (error) {
            console.error('Error fetching settlement history:', error);
            throw new InternalServerErrorException('Could not fetch settlement history');
        }
    }
}
