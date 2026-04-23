import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('subscription_sales')
export class SubscriptionSale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  driver_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @Column({ type: 'varchar', length: 50 })
  plan_id: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount_paid: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  tax_amount: number; // e.g. 18% of amount_paid

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ type: 'varchar', length: 30, default: 'paid' })
  sale_type: string; // 'paid', 'complimentary', 'grace'

  @Column({ type: 'timestamp', nullable: true })
  valid_until: Date;

  @Column({ type: 'varchar', nullable: true })
  payment_id: string;

  @Column({ type: 'varchar', nullable: true })
  order_id: string;

  @CreateDateColumn()
  created_at: Date;
}
