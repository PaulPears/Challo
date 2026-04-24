import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TrafficService {
  private readonly logger = new Logger(TrafficService.name);
  private readonly apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json';

  async getTrafficMultiplier(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<{ multiplier: number; reason: string }> {
    if (!this.apiKey) {
      this.logger.warn('Google Maps API Key not set for traffic estimation.');
      return { multiplier: 1.0, reason: 'Standard' };
    }

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          origins: `${originLat},${originLng}`,
          destinations: `${destLat},${destLng}`,
          departure_time: 'now',
          traffic_model: 'best_guess',
          key: this.apiKey,
        },
      });

      const element = response.data.rows[0].elements[0];
      if (element.status !== 'OK') return { multiplier: 1.0, reason: 'Standard' };

      const typicalDuration = element.duration.value; // in seconds
      const trafficDuration = element.duration_in_traffic ? element.duration_in_traffic.value : typicalDuration;

      const congestionRatio = trafficDuration / typicalDuration;
      
      this.logger.debug(`Traffic congestion ratio: ${congestionRatio.toFixed(2)}`);

      if (congestionRatio > 1.5) {
        return { multiplier: 1.3, reason: 'Extreme Traffic' };
      } else if (congestionRatio > 1.25) {
        return { multiplier: 1.15, reason: 'Heavy Traffic' };
      } else if (congestionRatio < 0.9) {
        return { multiplier: 0.9, reason: 'Clear Roads' }; // Discount for non-traffic zones!
      }

      return { multiplier: 1.0, reason: 'Normal Traffic' };
    } catch (error) {
      this.logger.error(`Failed to fetch traffic data: ${error.message}`);
      return { multiplier: 1.0, reason: 'Standard' };
    }
  }
}
