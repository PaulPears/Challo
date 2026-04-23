import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Rating, RatingRole } from './rating.entity';
import { SubmitRatingDto } from './dto/submit-rating.dto';
import { DriverProfile } from '../drivers/driver-profile.entity';
import { RiderProfile } from '../users/rider-profile.entity';
import { Ride, RideStatus } from '../rides/ride.entity';

@Injectable()
export class RatingsService {
    private readonly logger = new Logger(RatingsService.name);

    constructor(
        @InjectRepository(Rating)
        private ratingRepository: Repository<Rating>,
        @InjectRepository(DriverProfile)
        private driverProfileRepository: Repository<DriverProfile>,
        @InjectRepository(RiderProfile)
        private riderProfileRepository: Repository<RiderProfile>,
        @InjectRepository(Ride)
        private rideRepository: Repository<Ride>,
        private dataSource: DataSource,
    ) { }

    async submitRating(raterUserId: string, dto: SubmitRatingDto): Promise<Rating> {
        try {
            return await this.dataSource.transaction(async (manager) => {
                const ratingRepo = manager.getRepository(Rating);
                const rideRepo = manager.getRepository(Ride);

                // Validate ride exists and is completed
                const ride = await rideRepo.findOne({ where: { id: dto.ride_id } });
                if (!ride) throw new NotFoundException('Ride not found');
                if (ride.status !== RideStatus.COMPLETED) {
                    throw new BadRequestException(`Can only rate completed rides. Current status: ${ride.status}`);
                }

                // Validate rater is part of this ride
                const isRider = ride.rider_id === raterUserId;
                const isDriver = ride.driver_id === raterUserId;
                if (!isRider && !isDriver) {
                    throw new BadRequestException('You are not part of this ride');
                }

                // Map 'rating' to 'stars' if 'stars' is missing but 'rating' was passed (common frontend mismatch)
                const starCount = dto.stars || (dto as any).rating || 5;

                // Infer rated user and role if missing
                const ratedUserId = dto.rated_user_id || (isDriver ? ride.rider_id : ride.driver_id);
                const ratedUserRole = dto.rated_user_role || (isDriver ? RatingRole.RIDER : RatingRole.DRIVER);

                console.log(`[Ratings] Submitting: Ride=${dto.ride_id}, Rater=${raterUserId}, Rated=${ratedUserId}, Role=${ratedUserRole}, Stars=${starCount}`);

                if (!ratedUserId) {
                    throw new BadRequestException('Could not identify the user to be rated');
                }

                // Validate rater is rating the correct role
                if (isRider && ratedUserRole !== RatingRole.DRIVER) {
                    throw new BadRequestException('Riders can only rate the driver');
                }
                if (isDriver && ratedUserRole !== RatingRole.RIDER) {
                    throw new BadRequestException('Drivers can only rate the rider');
                }

                // Prevent duplicate ratings
                const existing = await ratingRepo.findOne({
                    where: { ride_id: dto.ride_id, rated_by_user_id: raterUserId },
                });
                if (existing) throw new BadRequestException('You have already rated this ride');

                // Save rating
                const rating = ratingRepo.create({
                    ride_id: dto.ride_id,
                    rated_by_user_id: raterUserId,
                    rated_user_id: ratedUserId,
                    rated_user_role: ratedUserRole,
                    stars: starCount,
                    comment: dto.comment,
                    tags: dto.tags,
                });
                const saved = await ratingRepo.save(rating);

                // Update average rating for rated user
                await this.updateAverageRating(manager, rating.rated_user_id, rating.rated_user_role);

                return saved;
            });
        } catch (error) {
            this.logger.error(`Failed to submit rating: ${error.message}`, error.stack);
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(error.message || 'Failed to submit rating');
        }
    }

    private async updateAverageRating(manager: any, userId: string, role: RatingRole) {
        try {
            const ratingRepo = manager.getRepository(Rating);
            const result = await ratingRepo
                .createQueryBuilder('r')
                .select('AVG(r.stars)', 'avg')
                .where('r.rated_user_id = :userId', { userId })
                .getRawOne();

            const rawAvg = result?.avg;
            const newAvg = parseFloat(rawAvg || '5.0');
            const roundedAvg = Math.round(newAvg * 10) / 10;
            
            console.log(`[Ratings] Updating ${role} ${userId}: RawAvg=${rawAvg}, NewAvg=${newAvg}, Rounded=${roundedAvg}`);

            if (role === RatingRole.DRIVER) {
                await manager.getRepository(DriverProfile).update(
                    { user_id: userId },
                    { driver_rating: roundedAvg },
                );
            } else {
                await manager.getRepository(RiderProfile).update(
                    { user_id: userId },
                    { rider_rating: roundedAvg },
                );
            }
        } catch (error) {
            console.error(`[Ratings] Error updating average for ${userId}:`, error);
            throw error; // Re-throw to fail the transaction
        }
    }

    async getRatingsForUser(userId: string, limit = 20): Promise<Rating[]> {
        return this.ratingRepository.find({
            where: { rated_user_id: userId },
            order: { created_at: 'DESC' },
            take: limit,
            relations: ['rated_by'],
        });
    }

    async getRatingsGivenByUser(userId: string, limit = 20): Promise<Rating[]> {
        return this.ratingRepository.find({
            where: { rated_by_user_id: userId },
            order: { created_at: 'DESC' },
            take: limit,
        });
    }

    async getAverageRating(userId: string): Promise<number> {
        const result = await this.ratingRepository
            .createQueryBuilder('r')
            .select('AVG(r.stars)', 'avg')
            .addSelect('COUNT(r.id)', 'count')
            .where('r.rated_user_id = :userId', { userId })
            .getRawOne();
        return parseFloat(result?.avg || '5.0');
    }

    async hasRatedRide(userId: string, rideId: string): Promise<boolean> {
        const existing = await this.ratingRepository.findOne({
            where: { ride_id: rideId, rated_by_user_id: userId },
        });
        return !!existing;
    }
}
