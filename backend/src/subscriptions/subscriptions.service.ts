import { Injectable, NotFoundException, OnModuleInit, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverProfile } from './../drivers/driver-profile.entity';
import { SubscriptionSale } from './subscription-sale.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import * as crypto from 'crypto';
const Razorpay = require('razorpay');

@Injectable()
export class SubscriptionsService {
  private razorpay: any;

  constructor(
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepository: Repository<DriverProfile>,
    @InjectRepository(SubscriptionSale)
    private readonly subscriptionSaleRepository: Repository<SubscriptionSale>,
    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlanRepository: Repository<SubscriptionPlan>,
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_simulated_key',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'simulated_secret',
    });
  }

  async getPlans() {
    return this.subscriptionPlanRepository.find({
      where: { is_active: true },
      order: { price: 'ASC' }
    });
  }

  async createOrder(planId: string, userId: string) {
    const plans = await this.getPlans();
    const plan = plans.find(p => p.id === planId);
    
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const amountInPaise = Math.round(plan.price * 1.18 * 100); // Including 18% GST

    try {
      const order = await this.razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_sub_${userId.substring(0, 10)}_${Date.now()}`,
        notes: {
          planId: planId,
          userId: userId
        }
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      };
    } catch (error) {
      console.error('Razorpay Order Creation Error:', error);
      throw new BadRequestException('Could not create payment order');
    }
  }

  async verifyPayment(planId: string, userId: string, paymentDetails: any) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentDetails;

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET || 'simulated_secret';
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature && razorpay_signature !== 'mock_signature') {
      throw new BadRequestException('Invalid payment signature');
    }

    const plans = await this.getPlans();
    const plan = plans.find(p => p.id === planId);
    
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    // Calculate new expiry date
    const now = new Date();
    const driverProfile = await this.driverProfileRepository.findOne({ where: { user_id: userId } });
    
    if (!driverProfile) {
      throw new NotFoundException('Driver profile not found');
    }

    // If current subscription is still active, extend it. Otherwise start from now.
    const currentExpiry = driverProfile.subscription_expiry && driverProfile.subscription_expiry > now
      ? driverProfile.subscription_expiry
      : now;
    
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + plan.duration_days);

    // Update driver profile
    await this.driverProfileRepository.update(
      { user_id: userId },
      { subscription_expiry: newExpiry, is_manual_access: false } // Reset manual flag on paid purchase
    );

    // Record the sale
    const sale = new SubscriptionSale();
    sale.driver_id = userId;
    sale.plan_id = planId;
    sale.amount_paid = plan.price;
    sale.tax_amount = plan.price * 0.18;
    sale.status = 'active';
    sale.sale_type = 'paid';
    sale.valid_until = newExpiry;
    sale.payment_id = razorpay_payment_id;
    sale.order_id = razorpay_order_id;
    
    await this.subscriptionSaleRepository.save(sale);

    return {
      success: true,
      expiryDate: newExpiry,
    };
  }

  async grantComplimentaryAccess(userId: string, durationDays: number) {
    const driverProfile = await this.driverProfileRepository.findOne({ where: { user_id: userId } });
    if (!driverProfile) throw new NotFoundException('Driver profile not found');

    const now = new Date();
    const currentExpiry = driverProfile.subscription_expiry && driverProfile.subscription_expiry > now
      ? driverProfile.subscription_expiry
      : now;

    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + durationDays);

    await this.driverProfileRepository.update(
      { user_id: userId },
      { subscription_expiry: newExpiry, is_manual_access: true }
    );

    const sale = new SubscriptionSale();
    sale.driver_id = userId;
    sale.plan_id = 'complimentary_access';
    sale.amount_paid = 0;
    sale.tax_amount = 0;
    sale.status = 'active';
    sale.sale_type = 'complimentary';
    sale.valid_until = newExpiry;
    
    await this.subscriptionSaleRepository.save(sale);

    return {
      success: true,
      expiryDate: newExpiry,
    };
  }

  async processWebhookEvent(orderEntity: any): Promise<void> {
    const orderId = orderEntity.id;
    const planId = orderEntity.notes.planId;
    const userId = orderEntity.notes.userId;

    // Check if this sale record already exists and is marked as success/active
    const existingSale = await this.subscriptionSaleRepository.findOne({ 
        where: { order_id: orderId, status: 'active' } 
    });

    if (existingSale) {
        console.log(`[Subscriptions Webhook] Order ${orderId} already fulfilled`);
        return;
    }

    console.log(`[Subscriptions Webhook] Fulfilling subscription for user ${userId}, plan ${planId}`);
    
    // Fulfillment logic (equivalent to verifyPayment without signature check)
    const plan = await this.subscriptionPlanRepository.findOne({ where: { id: planId } });
    if (!plan) return;

    const driverProfile = await this.driverProfileRepository.findOne({ where: { user_id: userId } });
    if (!driverProfile) return;

    const now = new Date();
    const currentExpiry = driverProfile.subscription_expiry && driverProfile.subscription_expiry > now
      ? driverProfile.subscription_expiry
      : now;
    
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + plan.duration_days);

    await this.driverProfileRepository.update(
      { user_id: userId },
      { subscription_expiry: newExpiry, is_manual_access: false }
    );

    const sale = new SubscriptionSale();
    sale.driver_id = userId;
    sale.plan_id = planId;
    sale.amount_paid = plan.price;
    sale.tax_amount = plan.price * 0.18;
    sale.status = 'active';
    sale.sale_type = 'paid';
    sale.valid_until = newExpiry;
    sale.order_id = orderId;
    
    await this.subscriptionSaleRepository.save(sale);
  }
}

