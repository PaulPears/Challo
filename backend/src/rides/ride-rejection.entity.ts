import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Ride } from './ride.entity';
import { User } from '../users/user.entity';

@Entity('ride_rejections')
export class RideRejection {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    ride_id: string;

    @ManyToOne(() => Ride)
    @JoinColumn({ name: 'ride_id' })
    ride: Ride;

    @Column({ type: 'uuid' })
    driver_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'driver_id' })
    driver: User;

    @CreateDateColumn()
    rejected_at: Date;
}
