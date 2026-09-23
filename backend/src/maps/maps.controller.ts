import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { MapsService } from './maps.service';

@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Get('autocomplete')
  async autocomplete(
    @Query('input') input: string,
    @Query('location') location?: string,
    @Query('radius') radius?: number,
  ) {
    if (!input || input.trim().length === 0) {
      return { predictions: [] };
    }
    try {
      return await this.mapsService.autocomplete(input, location, radius);
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || error.message || 'Error fetching autocomplete',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reverse-geocode')
  async reverseGeocode(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      throw new HttpException('Invalid latitude or longitude', HttpStatus.BAD_REQUEST);
    }
    try {
      return await this.mapsService.reverseGeocode(latNum, lngNum);
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || error.message || 'Error fetching reverse geocode',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('geocode')
  async geocode(@Query('address') address: string) {
    if (!address) {
      throw new HttpException('Address is required', HttpStatus.BAD_REQUEST);
    }
    try {
      return await this.mapsService.geocode(address);
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || error.message || 'Error fetching geocode',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('directions')
  async directions(
    @Query('origin') origin: string,
    @Query('destination') destination: string,
    @Query('mode') mode: string = 'driving',
  ) {
    if (!origin || !destination) {
      throw new HttpException('Origin and destination are required', HttpStatus.BAD_REQUEST);
    }
    try {
      return await this.mapsService.getDirections(origin, destination, mode);
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || error.message || 'Error fetching directions',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('distance-matrix')
  async distanceMatrix(
    @Query('origins') origins: string,
    @Query('destinations') destinations: string,
    @Query('mode') mode: string = 'driving',
  ) {
    if (!origins || !destinations) {
      throw new HttpException('Origins and destinations are required', HttpStatus.BAD_REQUEST);
    }
    try {
      return await this.mapsService.getDistanceMatrix(origins, destinations, mode);
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || error.message || 'Error fetching distance matrix',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
