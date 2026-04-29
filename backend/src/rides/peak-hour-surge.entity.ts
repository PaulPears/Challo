import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VehicleType } from './ride.entity';

@Entity('peak_hour_surges')
export class PeakHourSurge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string; // e.g., "Morning Peak", "Evening Rush Hour"

  @Column({ type: 'time' })
  start_time: string; // e.g., "06:00:00"

  @Column({ type: 'time' })
  end_time: string; // e.g., "09:59:00"

  // Days of the week 0-6 (0 = Sunday). If null, applies every day.
  @Column({ type: 'jsonb', nullable: true })
  days_of_week: number[] | null;

  @Column('decimal', { precision: 5, scale: 3, default: 1.2 })
  multiplier: number;

  @Column({ type: 'text', nullable: true })
  vehicle_types: string | null;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  latitude: number | null;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  longitude: number | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  radius_km: number | null;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  /** Helper: checks if a given vehicle type is covered by this event */
  appliesToVehicleType(vehicleType: VehicleType): boolean {
    if (!this.vehicle_types) return true; // applies to all
    return this.vehicle_types
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .includes(vehicleType.toLowerCase());
  }
}
