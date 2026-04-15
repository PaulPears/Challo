import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum SettlementStatus {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED'
}

@Entity('settlements')
export class Settlement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    driver_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'driver_id' })
    driver: User;

    @Column('decimal', { precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'varchar', nullable: true })
    razorpay_order_id: string;

    @Column({ type: 'varchar', nullable: true })
    razorpay_payment_id: string;

    @Column({ type: 'enum', enum: SettlementStatus, default: SettlementStatus.PENDING })
    status: SettlementStatus;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
