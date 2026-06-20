import {
  Controller,
  Get,
  UseGuards,
  Req,
  Param,
  Post,
  Body,
  Patch,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { MatchingService } from './matching.service';
import { RidesService } from './rides.service';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { Request } from 'express';
import { Ride, VehicleType, RideStatus } from './ride.entity';
import { CreateRideDto } from './dto/create-ride.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    phoneNumber: string;
    roles: UserRole[];
    [key: string]: any;
  };
}

@Controller('rides')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RidesController {
  constructor(
    private readonly ridesService: RidesService,
    private readonly pricingService: PricingService,
    private readonly matchingService: MatchingService,
  ) { }

  @Post('fare-estimate')
  async getFareEstimate(@Body() body: { distance: number; duration: number; lat?: number; lng?: number; destLat?: number; destLng?: number; superKmBalance?: number }) {
    const estimates = await Promise.all(Object.values(VehicleType).map(async (type) => {
      try {
        return await this.pricingService.getFareEstimate(body.distance, body.duration, type, body.lat, body.lng, body.destLat, body.destLng, body.superKmBalance);
      } catch (e) {
        return null;
      }
    }));
    return estimates.filter((e) => e !== null);
  }

  @Get('fare') // Keep old endpoint for backward compatibility but use new service
  getFare(@Body() body: { distance: number; duration: number; vehicleType: string; superKmBalance?: number }) {
    const vehicleType = body.vehicleType.replace('-', '_').toLowerCase() as VehicleType;
    return this.pricingService.getFareEstimate(body.distance, body.duration, vehicleType, undefined, undefined, body.superKmBalance);
  }

  @Get('nearby-drivers')
  getNearbyDrivers(@Query('lat') lat: number, @Query('lng') lng: number, @Query('radius') radius?: number) {
    return this.matchingService.findNearbyDrivers(Number(lat), Number(lng), undefined, radius ? Number(radius) : 2);
  }

  @Get('high-booking-zones')
  getHighBookingZones(
    @Query('district') district?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    return this.ridesService.getHighBookingZones(
      district,
      lat ? Number(lat) : undefined,
      lng ? Number(lng) : undefined,
    );
  }

  @Get('pending')
  @Roles(UserRole.DRIVER)
  getPendingRides(@Req() req: AuthenticatedRequest) {
    // Pass driver ID so rejected rides are filtered from their feed
    return this.ridesService.getPendingRides(req.user.id);
  }

  @Get('current')
  @Roles(UserRole.DRIVER)
  getCurrentRide(@Req() req: AuthenticatedRequest) {
    return this.ridesService.getCurrentRide(req.user.id);
  }

  @Get('my-rides')
  getMyRides(@Req() req: AuthenticatedRequest) {
    return this.ridesService.getMyRides(req.user.id);
  }

  @Get('my-active-ride')
  @Roles(UserRole.RIDER)
  getMyActiveRide(@Req() req: AuthenticatedRequest) {
    return this.ridesService.getActiveRideForRider(req.user.id);
  }

  @Get('driver-history')
  @Roles(UserRole.DRIVER)
  getDriverHistory(@Req() req: AuthenticatedRequest) {
    return this.ridesService.getDriverHistory(req.user.id);
  }

  @Post()
  @Roles(UserRole.RIDER)
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() createRideDto: CreateRideDto, @Req() req: AuthenticatedRequest) {
    return this.ridesService.createRide({ ...createRideDto, rider_id: req.user.id });
  }

  @Patch(':id/accept')
  @Roles(UserRole.DRIVER)
  acceptRide(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.ridesService.acceptRide(id, req.user.id);
  }

  @Patch(':id/reject')
  @Roles(UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  rejectRide(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.ridesService.rejectRide(id, req.user.id);
  }

  @Patch(':id/cancel')
  cancelRide(@Param('id') id: string) {
    return this.ridesService.cancelRide(id);
  }

  @Patch(':id/start')
  @Roles(UserRole.DRIVER)
  startRide(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Body() body: { pin: string }) {
    return this.ridesService.startRide(id, req.user.id, body.pin);
  }

  @Patch(':id/complete')
  @Roles(UserRole.DRIVER)
  completeRide(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.ridesService.completeRide(id, req.user.id);
  }

  @Get(':id')
  getRideById(@Param('id') id: string) {
    return this.ridesService.getRideById(id);
  }
}
