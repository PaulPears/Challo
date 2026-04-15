import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan } from 'typeorm';
import { Incentive, IncentiveType, IncentiveStatus } from './incentive.entity';

export interface IncentiveCheckResult {
    newlyCompleted: Incentive[];
}

@Injectable()
export class IncentivesService {
    private readonly logger = new Logger(IncentivesService.name);

    // Constants: Milestone definitions
    private readonly DRIVER_MILESTONES = [
        { rides: 10, bonus: 50, coins: 0, title: '10 Rides Bonus 🎉' },
        { rides: 50, bonus: 200, coins: 0, title: '50 Rides Superstar ⭐' },
        { rides: 100, bonus: 500, coins: 0, title: '100 Rides Legend 🏆' },
        { rides: 200, bonus: 1000, coins: 0, title: '200 Rides Elite 💎' },
    ];

    private readonly RIDER_MILESTONES = [
        { rides: 5, bonus: 0, coins: 50, title: 'First 5 Rides! 🚗' },
        { rides: 20, bonus: 0, coins: 200, title: '20 Rides Rider 🌟' },
        { rides: 50, bonus: 0, coins: 500, title: '50 Rides Champion 🏆' },
    ];

    constructor(
        @InjectRepository(Incentive)
        private incentiveRepository: Repository<Incentive>,
        private dataSource: DataSource,
    ) { }

    /**
     * Called after every completed ride to update driver incentive progress.
     */
    async onRideCompleted(driverUserId: string, riderUserId: string, totalRidesDriver: number, totalRidesRider: number): Promise<IncentiveCheckResult> {
        const newlyCompleted: Incentive[] = [];

        // Check driver milestones
        const completedDriver = await this.checkMilestones(
            driverUserId, 'driver', totalRidesDriver, this.DRIVER_MILESTONES,
        );
        newlyCompleted.push(...completedDriver);

        // Check rider milestones
        const completedRider = await this.checkMilestones(
            riderUserId, 'rider', totalRidesRider, this.RIDER_MILESTONES,
        );
        newlyCompleted.push(...completedRider);

        return { newlyCompleted };
    }

    private async checkMilestones(
        userId: string,
        role: 'driver' | 'rider',
        totalRides: number,
        milestones: typeof this.DRIVER_MILESTONES,
    ): Promise<Incentive[]> {
        const completed: Incentive[] = [];

        for (const milestone of milestones) {
            if (totalRides < milestone.rides) continue;

            // Check if this milestone was already given
            const existing = await this.incentiveRepository.findOne({
                where: {
                    user_id: userId,
                    type: role === 'driver' ? IncentiveType.DRIVER_TRIP_MILESTONE : IncentiveType.RIDER_TRIP_MILESTONE,
                    target_progress: milestone.rides,
                },
            });
            if (existing) continue;

            // Create the incentive record
            const incentive = this.incentiveRepository.create({
                user_id: userId,
                type: role === 'driver' ? IncentiveType.DRIVER_TRIP_MILESTONE : IncentiveType.RIDER_TRIP_MILESTONE,
                title: milestone.title,
                description: `Congratulations! You completed ${milestone.rides} rides.${milestone.bonus > 0 ? ` ₹${milestone.bonus} bonus credited.` : ` ${milestone.coins} Super Coins credited.`}`,
                reward_amount: milestone.bonus,
                reward_coins: milestone.coins,
                current_progress: totalRides,
                target_progress: milestone.rides,
                status: IncentiveStatus.CLAIMED,
                claimed_at: new Date(),
            });
            const saved = await this.incentiveRepository.save(incentive);
            completed.push(saved);
            this.logger.log(`Milestone achieved: ${milestone.title} for user ${userId}`);
        }

        return completed;
    }

    async getMyIncentives(userId: string): Promise<Incentive[]> {
        return this.incentiveRepository.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
        });
    }

    async getActiveIncentives(userId: string): Promise<Incentive[]> {
        return this.incentiveRepository.find({
            where: { user_id: userId, status: IncentiveStatus.ACTIVE },
            order: { created_at: 'DESC' },
        });
    }

    /**
     * Returns next unclaimed milestone for a driver to display progress in-app.
     */
    async getNextDriverMilestone(userId: string, currentRides: number): Promise<any> {
        const next = this.DRIVER_MILESTONES.find((m) => m.rides > currentRides);
        if (!next) return { message: 'You have unlocked all milestones! 🏆' };
        return {
            current_rides: currentRides,
            target_rides: next.rides,
            bonus: next.bonus,
            title: next.title,
            progress_pct: Math.round((currentRides / next.rides) * 100),
        };
    }

    async getNextRiderMilestone(userId: string, currentRides: number): Promise<any> {
        const next = this.RIDER_MILESTONES.find((m) => m.rides > currentRides);
        if (!next) return { message: 'You are a RideAndhra Champion! 🏆' };
        return {
            current_rides: currentRides,
            target_rides: next.rides,
            reward_coins: next.coins,
            title: next.title,
            progress_pct: Math.round((currentRides / next.rides) * 100),
        };
    }
}
