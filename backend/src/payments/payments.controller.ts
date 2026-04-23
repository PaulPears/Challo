import { Controller, Get, Post, Body, UseGuards, Request, BadRequestException, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @UseGuards(JwtAuthGuard)
    @Get('wallet')
    async getWallet(@Request() req) {
        const userId = req.user.id;
        const [wallet, todaysEarnings] = await Promise.all([
            this.paymentsService.getWalletByUserId(userId),
            this.paymentsService.getTodaysEarnings(userId),
        ]);
        return {
            balance: Number(wallet.balance),
            reward_balance: Number(wallet.super_km_balance),
            todaysEarnings: todaysEarnings,
            pending_gst: Number(wallet.pending_platform_fees),
            currency: wallet.currency,
            is_active: wallet.is_active,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get('wallet/transactions')
    async getWalletTransactions(@Request() req, @Query('limit') limit?: string) {
        const userId = req.user.id;
        const parsedLimit = limit ? Math.min(parseInt(limit, 10), 100) : 20;
        const transactions = await this.paymentsService.getWalletTransactions(userId, parsedLimit);
        return transactions.map(t => ({
            id: t.id,
            type: t.transaction_type,
            amount: Number(t.amount),
            description: t.description || 'Transaction',
            date: t.created_at.toISOString(),
            balance_after: Number(t.balance_after),
        }));
    }

    @UseGuards(JwtAuthGuard)
    @Get('settlements')
    async getSettlementHistory(@Request() req, @Query('limit') limit?: string) {
        const userId = req.user.id;
        const parsedLimit = limit ? Math.min(parseInt(limit, 10), 100) : 50;
        const settlements = await this.paymentsService.getSettlementHistory(userId, parsedLimit);
        return settlements.map(s => ({
            id: s.id,
            amount: Number(s.amount),
            status: s.status,
            razorpay_order_id: s.razorpay_order_id,
            razorpay_payment_id: s.razorpay_payment_id || null,
            created_at: s.created_at.toISOString(),
            updated_at: s.updated_at.toISOString(),
        }));
    }

    @UseGuards(JwtAuthGuard)
    @Post('create-settlement-order')
    async createSettlementOrder(@Request() req, @Body('amount') amount: number) {
        if (!amount || amount <= 0) {
            throw new BadRequestException('Invalid amount');
        }
        const userId = req.user.id;
        const order = await this.paymentsService.createSettlementOrder(userId, amount);
        return order;
    }

    @UseGuards(JwtAuthGuard)
    @Post('verify-settlement')
    async verifySettlement(
        @Request() req,
        @Body('razorpay_payment_id') paymentId: string,
        @Body('razorpay_order_id') orderId: string,
        @Body('razorpay_signature') signature: string,
        @Body('amount') amount: number
    ) {
        if (!paymentId || !orderId || !signature || !amount) {
            throw new BadRequestException('Missing payment details');
        }
        const userId = req.user.id;
        await this.paymentsService.verifySettlement(userId, paymentId, orderId, signature, amount);
        return { message: 'Dues securely settled', success: true };
    }

    @UseGuards(JwtAuthGuard)
    @Get('bank-details')
    async getBankDetails(@Request() req) {
        return this.paymentsService.getBankDetails(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('bank-details')
    async updateBankDetails(@Request() req, @Body() bankData: any) {
        return this.paymentsService.updateBankDetails(req.user.id, bankData);
    }

    @UseGuards(JwtAuthGuard)
    @Post('withdraw')
    async requestWithdrawal(@Request() req, @Body('amount') amount: number) {
        if (!amount || amount <= 0) {
            throw new BadRequestException('Invalid withdrawal amount');
        }
        return this.paymentsService.requestWithdrawal(req.user.id, amount);
    }

    @UseGuards(JwtAuthGuard)
    @Get('withdrawals')
    async getWithdrawalHistory(@Request() req, @Query('limit') limit?: string) {
        const parsedLimit = limit ? Math.min(parseInt(limit, 10), 100) : 20;
        const withdrawals = await this.paymentsService.getWithdrawalHistory(req.user.id, parsedLimit);
        return withdrawals.map(w => ({
            id: w.id,
            amount: Number(w.amount),
            status: w.status,
            bank_snapshot: w.bank_snapshot,
            created_at: w.created_at.toISOString(),
            processed_at: w.processed_at ? w.processed_at.toISOString() : null,
        }));
    }
}

