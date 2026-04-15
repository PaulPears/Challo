import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Driver } from '../drivers/driver.entity';

@Entity('favorite_drivers')
@Unique(['rider_id', 'driver_id'])
export class FavoriteDriver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  rider_id: string;

  @Column({ type: 'integer' })
  driver_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'rider_id' })
  rider: User;

  @ManyToOne(() => Driver)
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  @CreateDateColumn()
  created_at: Date;
}
