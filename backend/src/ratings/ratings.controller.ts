import { Controller, Post, Get, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RatingsService } from './ratings.service';
import { SubmitRatingDto } from './dto/submit-rating.dto';

@UseGuards(JwtAuthGuard)
@Controller('ratings')
export class RatingsController {
    constructor(private readonly ratingsService: RatingsService) { }

    @Post()
    async submitRating(@Request() req: any, @Body() dto: SubmitRatingDto) {
        return this.ratingsService.submitRating(req.user.id, dto);
    }

    @Get('my-ratings')
    async getMyRatings(@Request() req: any) {
        return this.ratingsService.getRatingsForUser(req.user.id);
    }

    @Get('driver/:driverId')
    async getDriverRatings(@Param('driverId') driverId: string) {
        return this.ratingsService.getRatingsForUser(driverId, 50);
    }

    @Get('check/:rideId')
    async hasRated(@Request() req: any, @Param('rideId') rideId: string) {
        const rated = await this.ratingsService.hasRatedRide(req.user.id, rideId);
        return { already_rated: rated };
    }
}
