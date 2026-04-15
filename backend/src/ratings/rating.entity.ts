import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum RatingRole {
    RIDER = 'rider',
    DRIVER = 'driver',
}

@Entity('ratings')
export class Rating {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    ride_id: string;

    @Column({ type: 'uuid' })
    rated_by_user_id: string;

    @Column({ type: 'uuid' })
    rated_user_id: string;

    @Column({ type: 'enum', enum: RatingRole, enumName: 'rating_role_enum' })
    rated_user_role: RatingRole; // Who was rated: 'driver' or 'rider'

    @Column({ type: 'decimal', precision: 2, scale: 1 })
    stars: number; // 1.0 to 5.0

    @Column({ type: 'text', nullable: true })
    comment: string;

    @Column({ type: 'text', array: true, nullable: true })
    tags: string[]; // e.g. ['Clean car', 'Safe driving', 'On time']

    @ManyToOne(() => User)
    @JoinColumn({ name: 'rated_by_user_id' })
    rated_by: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'rated_user_id' })
    rated_user: User;

    @CreateDateColumn()
    created_at: Date;
}
