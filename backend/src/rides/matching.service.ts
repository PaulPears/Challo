import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DriverProfile, DriverStatus } from '../drivers/driver-profile.entity';
import { VehicleType, Ride, RideStatus } from './ride.entity';

export interface NearbyDriver {
    user_id: string;
    driver_rating: number;
    total_rides: number;
    vehicle_type: VehicleType;
    vehicle_model: string;
    vehicle_plate_number: string;
    vehicle_color: string;
    current_latitude: number;
    current_longitude: number;
    distance_km: number;
}

@Injectable()
export class MatchingService {
    private readonly logger = new Logger(MatchingService.name);

    constructor(
        @InjectRepository(DriverProfile)
        private driverProfileRepository: Repository<DriverProfile>,
        private dataSource: DataSource,
    ) { }

    /**
     * Find nearby online drivers within a radius, sorted by distance.
     * Uses Haversine formula over lat/lng columns (works without PostGIS extension).
     * @param latitude - Pickup latitude
     * @param longitude - Pickup longitude
     * @param vehicleType - Required vehicle type
     * @param radiusKm - Search radius in km (default: 10km)
     * @param limit - Max number of drivers to return
     */
    async findNearbyDrivers(
        latitude: number,
        longitude: number,
        vehicleType?: VehicleType,
        radiusKm: number = 10,
        limit: number = 20,
    ): Promise<NearbyDriver[]> {
        try {
            const qb = this.dataSource
                .createQueryBuilder()
                .select([
                    'dp.user_id AS user_id',
                    'dp.driver_rating AS driver_rating',
                    'dp.total_rides AS total_rides',
                    'dp.vehicle_type AS vehicle_type',
                    'dp.vehicle_model AS vehicle_model',
                    'dp.vehicle_plate_number AS vehicle_plate_number',
                    'dp.vehicle_color AS vehicle_color',
                    'dp.current_latitude AS current_latitude',
                    'dp.current_longitude AS current_longitude',
                    // Haversine distance formula in km
                    `(
            6371 * acos(
              cos(radians(:lat)) * cos(radians(dp.current_latitude)) *
              cos(radians(dp.current_longitude) - radians(:lng)) +
              sin(radians(:lat)) * sin(radians(dp.current_latitude))
            )
          ) AS distance_km`,
                ])
                .from(DriverProfile, 'dp')
                .where('dp.is_online = true')
                .andWhere('dp.status = :status', { status: DriverStatus.ACTIVE })
                .andWhere('dp.current_latitude IS NOT NULL')
                .andWhere(`(
            6371 * acos(
              cos(radians(:lat)) * cos(radians(dp.current_latitude)) *
              cos(radians(dp.current_longitude) - radians(:lng)) +
              sin(radians(:lat)) * sin(radians(dp.current_latitude))
            )
          ) <= :radius`)
                .andWhere((qb) => {
                    const subQuery = qb
                        .subQuery()
                        .select('ride.driver_id')
                        .from(Ride, 'ride')
                        .where('ride.status IN (:...activeStatuses)')
                        .andWhere('ride.driver_id IS NOT NULL')
                        .getQuery();
                    return 'dp.user_id NOT IN ' + subQuery;
                })
                .setParameters({ 
                    lat: latitude, 
                    lng: longitude, 
                    radius: radiusKm,
                    activeStatuses: [RideStatus.ACCEPTED, RideStatus.IN_PROGRESS]
                })
                .orderBy('distance_km', 'ASC')
                .limit(limit);

            if (vehicleType) {
                qb.andWhere('dp.vehicle_type = :vehicleType', { vehicleType });
            }

            const raw = await qb.getRawMany();
            return raw.map((r) => ({
                user_id: r.user_id,
                driver_rating: parseFloat(r.driver_rating),
                total_rides: parseInt(r.total_rides),
                vehicle_type: r.vehicle_type,
                vehicle_model: r.vehicle_model,
                vehicle_plate_number: r.vehicle_plate_number,
                vehicle_color: r.vehicle_color,
                current_latitude: parseFloat(r.current_latitude),
                current_longitude: parseFloat(r.current_longitude),
                distance_km: parseFloat(r.distance_km),
            }));
        } catch (error) {
            this.logger.error('Error finding nearby drivers', error);
            return [];
        }
    }

    /**
     * Get user_ids of online drivers within radius, useful for targeted notifications.
     */
    async getNearbyDriverUserIds(
        latitude: number,
        longitude: number,
        vehicleType?: VehicleType,
        radiusKm: number = 10,
    ): Promise<string[]> {
        const drivers = await this.findNearbyDrivers(latitude, longitude, vehicleType, radiusKm, 50);
        return drivers.map((d) => d.user_id);
    }

    /**
     * Score drivers for smart assignment (by proximity + rating).
     * Returns top driver user_id.
     */
    async getBestMatchDriver(
        latitude: number,
        longitude: number,
        vehicleType?: VehicleType,
    ): Promise<string | null> {
        const drivers = await this.findNearbyDrivers(latitude, longitude, vehicleType, 10, 10);
        if (drivers.length === 0) return null;

        // Score = 80% proximity weight + 20% rating weight
        const maxDist = Math.max(...drivers.map((d) => d.distance_km), 1);
        const scored = drivers.map((d) => ({
            user_id: d.user_id,
            score: (1 - d.distance_km / maxDist) * 0.8 + (d.driver_rating / 5) * 0.2,
        }));

        scored.sort((a, b) => b.score - a.score);
        return scored[0].user_id;
    }
}
