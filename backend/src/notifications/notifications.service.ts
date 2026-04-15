import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotificationsGateway } from './notifications.gateway';
import { Notification, NotificationType } from './notification.entity';
import { User, UserRole } from '../users/user.entity';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
  private expo: Expo;

  constructor(
    private readonly notificationsGateway: NotificationsGateway,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.expo = new Expo();
  }

  // --- Socket.IO Notifications ---
  sendRideUpdate(rideId: string, status: string, ride: any) {
    this.notificationsGateway.sendRideUpdate(rideId, status, ride);
  }

  sendDriverLocation(driverUserId: string, location: { latitude: number; longitude: number }, rideId?: string) {
    this.notificationsGateway.sendDriverLocation(driverUserId, location, rideId);
  }

  sendNewRideToDriver(driverUserId: string, ride: any) {
    this.notificationsGateway.sendNewRideToDriver(driverUserId, ride);
    this.saveNotification(driverUserId, NotificationType.RIDE_REQUEST, 'New Ride Request', `Pickup: ${ride.pickupLocation || 'Unknown'} — ₹${ride.estimated_fare || ride.fare || '?'}`, ride);
  }

  sendNewRideToAll(ride: any) {
    this.notificationsGateway.sendNewRideToAll(ride);
  }

  // --- Push & Bulk Notifications ---

  async adminBroadcast(target: 'all' | 'riders' | 'drivers' | string, title: string, body: string, data?: any) {
    try {
      // 1. Determine Target Users
      let users: User[] = [];
      if (target === 'all') {
        users = await this.userRepository.find({ select: { id: true, push_token: true } });
      } else if (target === 'riders') {
        // Correctly handle Postgres array overlap/contains
        users = await this.userRepository.createQueryBuilder('user')
          .where('user.roles @\u003e ARRAY[:role]::text[]', { role: UserRole.RIDER })
          .select(['user.id', 'user.push_token'])
          .getMany();
      } else if (target === 'drivers') {
        users = await this.userRepository.createQueryBuilder('user')
          .where('user.roles @\u003e ARRAY[:role]::text[]', { role: UserRole.DRIVER })
          .select(['user.id', 'user.push_token'])
          .getMany();
      } else {
        // Single user ID
        const user = await this.userRepository.findOne({
          where: { id: target },
          select: { id: true, push_token: true }
        });
        if (user) users = [user];
      }

      if (users.length === 0) {
        return { success: false, message: `No target users found for target: ${target}` };
      }

      // 2. Persist In-App Notifications (Bulk)
      const notificationData = users.map(u => ({
        user_id: u.id,
        type: NotificationType.SYSTEM,
        title,
        message: body,
        data: data || {},
      }));

      // Chunk DB insertions for performance
      const dbChunks = this.chunkArray(notificationData, 500);
      for (const chunk of dbChunks) {
        await this.notificationRepository.createQueryBuilder()
          .insert()
          .into(Notification)
          .values(chunk)
          .execute();
      }

      // 3. Send Push Notifications (Expo)
      const tokens = users.map(u => u.push_token).filter(t => Expo.isExpoPushToken(t));
      if (tokens.length > 0) {
        await this.sendPushBatch(tokens, title, body, data);
      }

      // 4. Send via Socket as well (Broadcast)
      if (target === 'all') {
        this.notificationsGateway.broadcastToAll('system_notification', { title, message: body, data });
      }

      return { success: true, count: users.length };
    } catch (error) {
      console.error('Fatal error during admin broadcast:', error);
      return { success: false, message: 'Internal server error during notification dispatch' };
    }
  }

  async getBroadcastHistory(limit = 20) {
    // Return distinct notifications by title and message to show unique "broadcasts"
    // Using QueryBuilder for a specific GROUP BY / DISTINCT
    return this.notificationRepository.createQueryBuilder('n')
      .select(['n.title', 'n.message', 'n.created_at', 'n.type'])
      .where('n.type = :type', { type: NotificationType.SYSTEM })
      .orderBy('n.created_at', 'DESC')
      .groupBy('n.title, n.message, n.created_at, n.type')
      .take(limit)
      .getMany();
  }

  private async sendPushBatch(tokens: string[], title: string, body: string, data?: any) {
    const messages: ExpoPushMessage[] = tokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: data || {},
      channelId: 'default', // Explicitly specify channel for Android sound
    }));

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await this.expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error('Error sending Expo push chunk:', error);
      }
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // --- Helpers ---

  async getNotificationsForUser(userId: string, limit = 30): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationRepository.update({ user_id: userId, is_read: false }, { is_read: true });
  }

  private async saveNotification(userId: string, type: NotificationType, title: string, message: string, data?: any): Promise<void> {
    try {
      const notification = this.notificationRepository.create({ user_id: userId, type, title, message, data });
      await this.notificationRepository.save(notification);
    } catch (err) {
      console.error('Failed to persist notification:', err);
    }
  }
}

