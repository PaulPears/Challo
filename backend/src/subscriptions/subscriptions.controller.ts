import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('plans')
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-order')
  async createOrder(@Request() req, @Body('planId') planId: string) {
    return this.subscriptionsService.createOrder(planId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  async verify(@Request() req, @Body() body: any) {
    return this.subscriptionsService.verifyPayment(body.planId, req.user.id, body);
  }
}
