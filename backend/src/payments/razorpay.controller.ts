import { Controller, Get, Post, Req, BadRequestException, Body, InternalServerErrorException, Headers } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import * as crypto from 'crypto';

@Controller('payments')
export class RazorpayController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly subscriptionsService: SubscriptionsService,
    ) { }

    @Get('config')
    async getConfig() {
        return {
            razorpay_key: process.env.RAZORPAY_KEY_ID,
            currency: 'INR',
        };
    }

    @Post('webhook')
    async handleWebhook(@Req() req: any, @Headers('x-razorpay-signature') signature: string) {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        
        if (!secret || secret === 'your_secret_here') {
            console.warn('⚠️ Razorpay Webhook Secret NOT CONFIGURED or dummy value used.');
            // During development we might want to skip verification if secret isn't set, 
            // but for "proper" implementation we must enforce it.
            // For now, I will log but allow if NODE_ENV is development.
            if (process.env.NODE_ENV !== 'development') {
                throw new InternalServerErrorException('Webhook secret not configured');
            }
        }

        // Signature verification using rawBody
        const rawBody = req.rawBody.toString();
        const expectedSignature = crypto
            .createHmac('sha256', secret || '')
            .update(rawBody)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('❌ Razorpay Webhook Signature Verification Failed');
            throw new BadRequestException('Invalid signature');
        }

        const event = JSON.parse(rawBody);
        const eventName = event.event;
        const payload = event.payload;

        console.log(`[Razorpay Webhook] Received event: ${eventName}`);

        try {
            switch (eventName) {
                case 'order.paid':
                    // This is usually for Subscriptions or automated dues
                    if (payload.order?.entity?.notes?.planId) {
                        await this.subscriptionsService.processWebhookEvent(payload.order.entity);
                    }
                    break;
                
                case 'payment.captured':
                    // This is for individual payments (Settlements)
                    // Note: Check if it's a settlement order or subscription order
                    const notes = payload.payment.entity.notes || {};
                    if (payload.payment.entity.order_id) {
                         // Some logic to route based on order_id prefix or notes
                         await this.paymentsService.processWebhookEvent(payload.payment.entity);
                    }
                    break;

                default:
                    console.log(`[Razorpay Webhook] Unhandled event type: ${eventName}`);
            }
        } catch (error) {
            console.error(`[Razorpay Webhook] Error processing ${eventName}:`, error);
            // We return 200 to Razorpay to stop retries, but log the error
        }

        return { status: 'received' };
    }
}
