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
  async sendRideUpdate(rideId: string, status: string, ride: any) {
    this.notificationsGateway.sendRideUpdate(rideId, status, ride);

    try {
      // 1. Get Rider ID from ride object
      const riderId = ride.rider_id || ride.riderId;
      if (!riderId) return;

      // 2. Fetch Rider's push token
      const user = await this.userRepository.findOne({ 
        where: { id: riderId }, 
        select: { id: true, rider_push_token: true } 
      });

      if (user && user.rider_push_token && Expo.isExpoPushToken(user.rider_push_token)) {
        let title = 'Ride Update';
        let body = `Your ride status is now ${status.replace('_', ' ').toLowerCase()}.`;

        // Customize messages based on status
        switch (status.toUpperCase()) {
          case 'ACCEPTED':
            title = 'Driver Found! 🚗';
            body = `${ride.driver?.name || 'A driver'} is on the way to pick you up.`;
            break;
          case 'ARRIVED':
            title = 'Driver Arrived 📍';
            body = 'Your driver is waiting at the pickup location.';
            break;
          case 'STARTED':
            title = 'Trip Started 🚀';
            body = 'Your trip has officially begun. Have a safe journey!';
            break;
          case 'COMPLETED':
            title = 'Ride Completed ✅';
            body = `You've arrived! Final fare: ₹${Number(ride.rider_payable || ride.final_fare || 0).toFixed(2)}`;
            break;
          case 'CANCELLED':
            title = 'Ride Cancelled ❌';
            body = 'Your ride request has been cancelled.';
            break;
        }

        await this.sendPushBatch(
          [user.rider_push_token], 
          title, 
          body, 
          { rideId, status, type: 'RIDE_UPDATE', target: 'rider' },
          'ride-updates'
        );
      }
    } catch (error) {
      console.error('[Push] Failed to send ride update notification:', error);
    }
  }

  sendDriverLocation(driverUserId: string, location: { latitude: number; longitude: number }, rideId?: string) {
    this.notificationsGateway.sendDriverLocation(driverUserId, location, rideId);
  }

  async sendNewRideToDriver(driverUserId: string, ride: any) {
    this.notificationsGateway.sendNewRideToDriver(driverUserId, ride);
    
    const title = 'New Ride Request';
    const body = `Pickup: ${ride.pickupLocation || ride.pickup_address || 'Unknown'} — ₹${ride.estimated_fare || ride.fare || '?'}`;
    
    // 1. Persist In-App Notification
    await this.saveNotification(driverUserId, NotificationType.RIDE_REQUEST, title, body, ride);

    // 2. Send Push Notification immediately
    const user = await this.userRepository.findOne({ where: { id: driverUserId }, select: { driver_push_token: true } });
    if (user && user.driver_push_token && Expo.isExpoPushToken(user.driver_push_token)) {
      await this.sendPushBatch(
        [user.driver_push_token], 
        title, 
        body, 
        { rideId: ride.id, type: NotificationType.RIDE_REQUEST, target: 'driver' },
        'ride-alerts-v3' // New channel ID for sound/priority
      );
    }
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
        users = await this.userRepository.find({ select: { id: true, rider_push_token: true, driver_push_token: true } });
      } else if (target === 'riders') {
        users = await this.userRepository.createQueryBuilder('user')
          .where('"user"."roles"::text[] @> ARRAY[:role]::text[]', { role: UserRole.RIDER })
          .select(['user.id', 'user.rider_push_token'])
          .getMany();
      } else if (target === 'drivers') {
        users = await this.userRepository.createQueryBuilder('user')
          .where('"user"."roles"::text[] @> ARRAY[:role]::text[]', { role: UserRole.DRIVER })
          .select(['user.id', 'user.driver_push_token'])
          .getMany();
      } else {
        // Single user ID
        const user = await this.userRepository.findOne({
          where: { id: target },
          select: { id: true, rider_push_token: true, driver_push_token: true }
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
      const tokens = users.flatMap(u => {
        const t = [];
        if (target === 'drivers' || target === 'all') {
          // @ts-ignore
          if (u.driver_push_token) t.push(u.driver_push_token);
        }
        if (target === 'riders' || target === 'all') {
          // @ts-ignore
          if (u.rider_push_token) t.push(u.rider_push_token);
        }
        // If specific user target, include both
        if (target !== 'drivers' && target !== 'riders' && target !== 'all') {
          // @ts-ignore
          if (u.rider_push_token) t.push(u.rider_push_token);
          // @ts-ignore
          if (u.driver_push_token) t.push(u.driver_push_token);
        }
        return t;
      }).filter(t => Expo.isExpoPushToken(t));

      if (tokens.length > 0) {
        const enhancedData = { ...data, target: target === 'drivers' ? 'driver' : target === 'riders' ? 'rider' : 'all' };
        await this.sendPushBatch(tokens, title, body, enhancedData);
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
    // getRawMany is safer for GROUP BY queries in Postgres to avoid ID column errors
    return this.notificationRepository.createQueryBuilder('n')
      .select('n.title', 'title')
      .addSelect('n.message', 'message')
      .addSelect('MAX(n.created_at)', 'created_at')
      .addSelect('n.type', 'type')
      .where('n.type = :type', { type: NotificationType.SYSTEM })
      .groupBy('n.title, n.message, n.type')
      .orderBy('MAX(n.created_at)', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  private async sendPushBatch(tokens: string[], title: string, body: string, data?: any, channelId: string = 'ride-updates') {
    // Use custom alert sound for ride requests, default for everything else
    const isRideRequest = channelId === 'ride-alerts-v3';
    const messages: ExpoPushMessage[] = tokens.map(token => ({
      to: token,
      sound: isRideRequest ? 'ride_alert.mp3' : 'default',
      title,
      body,
      data: data || {},
      channelId,
      priority: 'high',
      // Android-specific: ensure notification appears even on locked screen
      ...(isRideRequest ? {
        ttl: 30,            // Expire after 30s if not delivered (stale ride requests)
        expiration: Math.floor(Date.now() / 1000) + 30,
      } : {}),
    }));

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const results = await this.expo.sendPushNotificationsAsync(chunk);
        results.forEach((result, i) => {
          if (result.status === 'error') {
            console.error(`[Push] Error sending to ${tokens[i]}: ${result.message}`);
          }
        });
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

  async markRead(id: string, userId: string): Promise<void> {
    await this.notificationRepository.update({ id, user_id: userId }, { is_read: true });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({ where: { user_id: userId, is_read: false } });
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

