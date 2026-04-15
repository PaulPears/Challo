import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum IncentiveType {
    DRIVER_TRIP_MILESTONE = 'driver_trip_milestone',
    RIDER_TRIP_MILESTONE = 'rider_trip_milestone',
    DRIVER_PEAK_HOURS = 'driver_peak_hours',
    REFERRAL_BONUS = 'referral_bonus',
}

export enum IncentiveStatus {
    ACTIVE = 'active',
    CLAIMED = 'claimed',
    EXPIRED = 'expired',
}

@Entity('incentives')
export class Incentive {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @Column({ type: 'enum', enum: IncentiveType, enumName: 'incentive_type_enum' })
    type: IncentiveType;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    // Reward in rupees (for cash bonus) or super coins
    @Column('decimal', { precision: 8, scale: 2, default: 0 })
    reward_amount: number;

    @Column('integer', { default: 0 })
    reward_coins: number;

    // Milestone tracking: current vs target
    @Column('integer', { default: 0 })
    current_progress: number;

    @Column('integer', { default: 0 })
    target_progress: number;

    @Column({ type: 'enum', enum: IncentiveStatus, enumName: 'incentive_status_enum', default: IncentiveStatus.ACTIVE })
    status: IncentiveStatus;

    @Column({ type: 'timestamp', nullable: true })
    expires_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    claimed_at: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
