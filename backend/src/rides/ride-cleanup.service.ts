import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Ride, RideStatus } from './ride.entity';
import { NotificationsService } from '../notifications/notifications.service';

const SIX_MINUTES_MS = 6 * 60 * 1000;

@Injectable()
export class RideCleanupService {
  private readonly logger = new Logger(RideCleanupService.name);

  constructor(
    @InjectRepository(Ride)
    private readonly ridesRepository: Repository<Ride>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Runs every minute and auto-cancels any pending ride that has been
   * waiting for more than 6 minutes with no driver acceptance.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async cancelStaleRides(): Promise<void> {
    const cutoff = new Date(Date.now() - SIX_MINUTES_MS);

    const staleRides = await this.ridesRepository.find({
      where: {
        status: RideStatus.PENDING,
        created_at: LessThan(cutoff),
      },
      select: ['id', 'rider_id'],
    });

    if (staleRides.length === 0) {
      return; // Nothing to do
    }

    this.logger.warn(
      `[RideCleanup] Auto-cancelling ${staleRides.length} stale pending ride(s)`,
    );

    const staleIds = staleRides.map((r) => r.id);

    // Bulk update to cancelled
    await this.ridesRepository
      .createQueryBuilder()
      .update(Ride)
      .set({
        status: RideStatus.CANCELLED,
        cancellation_reason: 'Auto-cancelled: No driver found within 6 minutes',
      })
      .whereInIds(staleIds)
      .execute();

    // Notify riders via socket so their UI updates immediately
    for (const ride of staleRides) {
      try {
        this.notificationsService.sendRideUpdate(ride.id, RideStatus.CANCELLED, ride as Ride);
      } catch (e) {
        this.logger.error(`[RideCleanup] Failed to notify rider for ride ${ride.id}`, e);
      }
    }

    this.logger.log(`[RideCleanup] Successfully cancelled ${staleIds.length} stale ride(s)`);
  }

  /**
   * Called once at startup to immediately clean up any pre-existing stale rides
   * from before this service was deployed.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('[RideCleanup] Running startup cleanup for legacy stale rides...');
    await this.cancelStaleRides();
  }
}
