import { Controller, Get, Post, UseGuards, Request, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyNotifications(@Request() req, @Query('limit') limit?: string) {
    const userId = req.user.id;
    const parsedLimit = limit ? Math.min(parseInt(limit, 10), 100) : 30;
    const notifications = await this.notificationsService.getNotificationsForUser(userId, parsedLimit);
    return notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data,
      is_read: n.is_read,
      created_at: n.created_at.toISOString(),
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Post('mark-read')
  async markAllRead(@Request() req) {
    await this.notificationsService.markAllRead(req.user.id);
    return { success: true };
  }
}
