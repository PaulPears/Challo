import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverProfile } from './../drivers/driver-profile.entity';
import { SubscriptionSale } from './subscription-sale.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepository: Repository<DriverProfile>,
    @InjectRepository(SubscriptionSale)
    private readonly subscriptionSaleRepository: Repository<SubscriptionSale>,
  ) {}

  getPlans() {
    return [
      {
        id: 'daily_express',
        name: 'Daily Express',
        price: 49,
        duration_days: 1,
        description: 'Perfect for a trial run. Zero commission on all rides.',
        features: ['24-hour access', 'Unlimited rides', 'Priority support'],
      },
      {
        id: 'weekly_pro',
        name: 'Weekly Pro',
        price: 249,
        duration_days: 7,
        description: 'Best for regular drivers. Maximize your weekly earnings.',
        features: ['7-day access', 'Unlimited rides', 'Exclusive high-demand zones', '24/7 support'],
      },
      {
        id: 'monthly_elite',
        name: 'Monthly Elite',
        price: 899,
        duration_days: 30,
        description: 'Maximum savings for full-time professionals.',
        features: ['30-day access', 'Unlimited rides', 'Early access to new features', 'VIP support', 'Monthly stats report'],
      },
    ];
  }

  async createOrder(planId: string, userId: string) {
    const plans = this.getPlans();
    const plan = plans.find(p => p.id === planId);
    
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    // In a real implementation, you would call Razorpay here to create an order
    // For now, we simulate the interaction by returning a mock order ID
    const amountInPaise = Math.round(plan.price * 1.18 * 100); // Including 18% GST

    return {
      orderId: `order_${Math.random().toString(36).substring(7)}`,
      amount: amountInPaise,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_simulated_key',
    };
  }

  async verifyPayment(planId: string, userId: string, paymentDetails: any) {
    const plans = this.getPlans();
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
    const sale = this.subscriptionSaleRepository.create({
      driver_id: userId,
      plan_id: planId,
      amount_paid: plan.price,
      tax_amount: plan.price * 0.18,
      status: 'active',
      sale_type: 'paid',
      valid_until: newExpiry,
    });
    
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

    const sale = this.subscriptionSaleRepository.create({
      driver_id: userId,
      plan_id: 'complimentary_access',
      amount_paid: 0,
      tax_amount: 0,
      status: 'active',
      sale_type: 'complimentary',
      valid_until: newExpiry,
    });
    await this.subscriptionSaleRepository.save(sale);

    return {
      success: true,
      expiryDate: newExpiry,
    };
  }
}

