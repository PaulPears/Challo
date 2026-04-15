import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('send')
  async sendNotification(
    @Body() body: { target: string; title: string; body: string; data?: any }
  ) {
    return this.notificationsService.adminBroadcast(
      body.target,
      body.title,
      body.body,
      body.data
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('history')
  async getHistory() {
    return this.notificationsService.getBroadcastHistory();
  }
}

