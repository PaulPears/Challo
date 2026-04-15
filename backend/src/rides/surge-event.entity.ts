import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VehicleType } from './ride.entity';

/**
 * SurgeEvent stores admin-configured time windows where a
 * surge multiplier is automatically applied — e.g. festivals,
 * public holidays, major events.
 */
@Entity('surge_events')
export class SurgeEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string; // e.g. "Dussehra 2024", "IPL Final Night"

  @Column({ type: 'timestamptz' })
  start_date: Date;

  @Column({ type: 'timestamptz' })
  end_date: Date;

  @Column('decimal', { precision: 5, scale: 3, default: 1.2 })
  multiplier: number;

  /**
   * Null/empty = applies to all vehicle types.
   * Otherwise, comma-separated list: 'auto,cab'
   */
  @Column({ type: 'text', nullable: true })
  vehicle_types: string | null;

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
