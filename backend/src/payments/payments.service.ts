import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from './wallet.entity';
import { WalletTransaction, TransactionType } from './wallet-transaction.entity';
import { Settlement, SettlementStatus } from './settlement.entity';
import { DriverBankDetail } from './bank-detail.entity';
import { WithdrawalRequest, WithdrawalStatus } from './withdrawal-request.entity';
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
        @InjectRepository(DriverBankDetail)
        private bankDetailRepository: Repository<DriverBankDetail>,
        @InjectRepository(WithdrawalRequest)
        private withdrawalRequestRepository: Repository<WithdrawalRequest>,
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
                    super_km_balance: 0,
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

    async getTodaysEarnings(driverUserId: string): Promise<number> {
        try {
            // Get start of today
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            const result = await this.dataSource.query(
                `SELECT 
                    (SELECT COALESCE(SUM(final_fare), 0) FROM rides WHERE driver_id = $1 AND status = 'completed' AND created_at >= $2) +
                    (SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions wt JOIN wallets w ON wt.wallet_id = w.id 
                     WHERE w.user_id = $1 AND wt.transaction_type = 'super_km_compensation' AND wt.created_at >= $2)
                 as total`,
                [driverUserId, startOfToday]
            );

            return result[0]?.total ? Number(result[0].total) : 0;
        } catch (error) {
            console.error('Error fetching todays earnings:', error);
            return 0; // fallback to 0 safely
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

    async applyServiceCharge(driverUserId: string, feeAmount: number, rideId: string, manager?: any): Promise<void> {
        try {
            const walletRepo = manager ? manager.getRepository(Wallet) : this.walletRepository;
            const transactionRepo = manager ? manager.getRepository(WalletTransaction) : this.walletTransactionRepository;

            const wallet = await this.getWalletByUserId(driverUserId);
            // Only collecting 5% service tax as per user instructions. No 18% GST on top.
            const totalFeeWithTax = Number(feeAmount);

            await walletRepo.increment({ id: wallet.id }, 'pending_platform_fees', totalFeeWithTax);
            const updatedWallet = await walletRepo.findOne({ where: { id: wallet.id } });

            const transaction = transactionRepo.create({
                wallet_id: wallet.id,
                amount: totalFeeWithTax,
                transaction_type: TransactionType.FEE_DEDUCTION,
                reference_type: 'ride',
                reference_id: rideId,
                description: `Service Charge (5%) for cash ride`,
                balance_after: updatedWallet ? updatedWallet.balance : 0,
            });
            await transactionRepo.save(transaction);
        } catch (error) {
            console.error('Error applying service tax:', error);
            // Non-fatal: log but don't throw so ride completion still succeeds
        }
    }

    async creditCompanyCompensation(driverUserId: string, amount: number, rideId: string, manager?: any): Promise<void> {
        try {
            const walletRepo = manager ? manager.getRepository(Wallet) : this.walletRepository;
            const transactionRepo = manager ? manager.getRepository(WalletTransaction) : this.walletTransactionRepository;

            const wallet = await this.getWalletByUserId(driverUserId);
            const creditAmount = Number(amount);

            // Increment the DEDICATED Super KM Rewards bucket
            await walletRepo.increment({ id: wallet.id }, 'super_km_balance', creditAmount);
            const updatedWallet = await walletRepo.findOne({ where: { id: wallet.id } });

            const transaction = transactionRepo.create({
                wallet_id: wallet.id,
                amount: creditAmount,
                transaction_type: TransactionType.SUPER_KM_COMPENSATION,
                reference_type: 'ride',
                reference_id: rideId,
                description: `Platform Coverage Reward for ride #${rideId.slice(0, 8).toUpperCase()}`,
                balance_after: updatedWallet ? updatedWallet.super_km_balance : 0,
            });
            await transactionRepo.save(transaction);
            
            console.log(`[Payments] Credited ₹${creditAmount} Super KM compensation to driver ${driverUserId}`);
        } catch (error) {
            console.error('Error crediting compensation:', error);
            // Non-fatal
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
                receipt: `stl_${wallet.id.slice(-8)}_${Date.now().toString(36)}`,
            };

            console.log('[Payments] Creating Razorpay order with options:', options);
            console.log('[Payments] Using Razorpay key_id:', process.env.RAZORPAY_KEY_ID?.slice(0, 12) + '...');

            const order = await this.razorpayClient.orders.create(options);
            console.log('[Payments] Razorpay order created:', order.id);

            // Persist settlement record as PENDING for history tracking
            const settlement = this.settlementRepository.create({
                driver_id: driverUserId,
                amount,
                razorpay_order_id: order.id,
                status: SettlementStatus.PENDING,
            });
            await this.settlementRepository.save(settlement);

            return {
                ...order,
                key: process.env.RAZORPAY_KEY_ID
            };
        } catch (error: any) {
            if (error instanceof BadRequestException) throw error;

            // Razorpay SDK wraps the actual API error inside error.error
            const razorpayError = error?.error ?? error;
            console.error('[Payments] Razorpay order creation FAILED:');
            console.error('  Status code :', error?.statusCode ?? 'N/A');
            console.error('  Error code  :', razorpayError?.code ?? 'N/A');
            console.error('  Description :', razorpayError?.description ?? razorpayError?.message ?? 'N/A');
            console.error('  Field       :', razorpayError?.field ?? 'N/A');
            console.error('  Raw error   :', JSON.stringify(razorpayError, null, 2));

            const description = razorpayError?.description || razorpayError?.message || 'Failed to generate payment order. Please try again.';
            throw new InternalServerErrorException(`Razorpay: ${description}`);
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

    async processWebhookEvent(paymentEntity: any): Promise<void> {
        const orderId = paymentEntity.order_id;
        const paymentId = paymentEntity.id;
        const amount = paymentEntity.amount / 100; // Convert paise to INR

        const settlement = await this.settlementRepository.findOne({ 
            where: { razorpay_order_id: orderId },
            relations: ['driver']
        });

        if (!settlement) {
            console.warn(`[Payments Webhook] Settlement not found for order ${orderId}`);
            return;
        }

        if (settlement.status === SettlementStatus.SUCCESS) {
            console.log(`[Payments Webhook] Settlement ${orderId} already processed (SUCCESS)`);
            return;
        }

        console.log(`[Payments Webhook] Fulfilling settlement for driver ${settlement.driver_id}, amount ${amount}`);

        await this.dataSource.transaction(async manager => {
            const walletRepo = manager.getRepository(Wallet);
            const transactionRepo = manager.getRepository(WalletTransaction);
            const settlementRepo = manager.getRepository(Settlement);

            const wallet = await walletRepo.findOne({ where: { user_id: settlement.driver_id } });
            if (!wallet) return;

            const settleAmount = Math.min(Number(amount), Number(wallet.pending_platform_fees));
            if (settleAmount <= 0) return;

            await walletRepo.decrement({ id: wallet.id }, 'pending_platform_fees', settleAmount);
            const updatedWallet = await walletRepo.findOne({ where: { id: wallet.id } });

            const transaction = transactionRepo.create({
                wallet_id: wallet.id,
                amount: settleAmount,
                transaction_type: TransactionType.FEE_SETTLEMENT,
                reference_type: 'settlement',
                reference_id: paymentId,
                description: `Dues settled via Razorpay Webhook (ID: ${paymentId})`,
                balance_after: updatedWallet ? updatedWallet.balance : 0,
            });
            await transactionRepo.save(transaction);

            settlement.status = SettlementStatus.SUCCESS;
            settlement.razorpay_payment_id = paymentId;
            await settlementRepo.save(settlement);
        });
    }

    async getBankDetails(userId: string): Promise<DriverBankDetail | null> {
        return this.bankDetailRepository.findOne({ where: { user_id: userId } });
    }

    async updateBankDetails(userId: string, bankData: Partial<DriverBankDetail>): Promise<DriverBankDetail> {
        let bankDetail = await this.bankDetailRepository.findOne({ where: { user_id: userId } });
        if (bankDetail) {
            Object.assign(bankDetail, bankData);
        } else {
            bankDetail = this.bankDetailRepository.create({ ...bankData, user_id: userId });
        }
        return this.bankDetailRepository.save(bankDetail);
    }

    async requestWithdrawal(userId: string, amount: number): Promise<WithdrawalRequest> {
        if (amount < 100) {
            throw new BadRequestException('Minimum withdrawal amount is ₹100');
        }

        const wallet = await this.getWalletByUserId(userId);
        const rewardBalance = Number(wallet.super_km_balance);
        const mainBalance = Number(wallet.balance);
        const totalWithdrawable = mainBalance + rewardBalance;

        if (totalWithdrawable < amount) {
            throw new BadRequestException('Insufficient balance for withdrawal');
        }

        const bankDetail = await this.getBankDetails(userId);
        if (!bankDetail) {
            throw new BadRequestException('Please set up your bank details before withdrawing');
        }

        return await this.dataSource.transaction(async manager => {
            const walletRepo = manager.getRepository(Wallet);
            const transactionRepo = manager.getRepository(WalletTransaction);
            const withdrawalRepo = manager.getRepository(WithdrawalRequest);

            // Deduct from balances (Priority: reward_balance then main balance)
            let remainingToDeduct = amount;
            let finalRewardBalance = rewardBalance;
            let finalMainBalance = mainBalance;

            if (rewardBalance > 0) {
                const deductFromReward = Math.min(rewardBalance, remainingToDeduct);
                finalRewardBalance -= deductFromReward;
                remainingToDeduct -= deductFromReward;
                await walletRepo.decrement({ id: wallet.id }, 'super_km_balance', deductFromReward);
            }

            if (remainingToDeduct > 0) {
                finalMainBalance -= remainingToDeduct;
                await walletRepo.decrement({ id: wallet.id }, 'balance', remainingToDeduct);
            }

            // Create Withdrawal Request
            const withdrawal = withdrawalRepo.create({
                driver_id: userId,
                amount,
                status: WithdrawalStatus.PENDING,
                bank_snapshot: {
                    bank_name: bankDetail.bank_name,
                    account_number: bankDetail.account_number,
                    ifsc_code: bankDetail.ifsc_code,
                    account_holder_name: bankDetail.account_holder_name,
                }
            });
            const savedWithdrawal = await withdrawalRepo.save(withdrawal);

            // Create Transaction entry
            const transaction = transactionRepo.create({
                wallet_id: wallet.id,
                amount: amount,
                transaction_type: TransactionType.WITHDRAWAL,
                reference_type: 'withdrawal',
                reference_id: savedWithdrawal.id,
                description: `Withdrawal request for ₹${amount} (Pending)`,
                balance_after: finalMainBalance, // We use main balance as the primary balance indicator
            });
            await transactionRepo.save(transaction);

            return savedWithdrawal;
        });
    }

    async getWithdrawalHistory(userId: string, limit: number = 20): Promise<WithdrawalRequest[]> {
        return this.withdrawalRequestRepository.find({
            where: { driver_id: userId },
            order: { created_at: 'DESC' },
            take: limit,
        });
    }
}

