import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TrafficService {
  private readonly logger = new Logger(TrafficService.name);
  private readonly apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json';

  // In-memory cache for traffic calculations (TTL: 3 minutes)
  private readonly trafficCache = new Map<string, { multiplier: number; reason: string; expiresAt: number }>();

  async getTrafficMultiplier(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<{ multiplier: number; reason: string }> {
    // Generate cache key rounded to ~1km grid
    const cacheKey = `${originLat.toFixed(2)},${originLng.toFixed(2)}->${destLat.toFixed(2)},${destLng.toFixed(2)}`;
    const cached = this.trafficCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return { multiplier: cached.multiplier, reason: cached.reason };
    }

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
        timeout: 5000,
      });

      const element = response.data.rows[0].elements[0];
      if (element.status !== 'OK') return { multiplier: 1.0, reason: 'Standard' };

      const typicalDuration = element.duration.value; // in seconds
      const trafficDuration = element.duration_in_traffic ? element.duration_in_traffic.value : typicalDuration;

      const congestionRatio = trafficDuration / typicalDuration;
      
      this.logger.debug(`Traffic congestion ratio: ${congestionRatio.toFixed(2)}`);

      let result = { multiplier: 1.0, reason: 'Normal Traffic' };
      if (congestionRatio > 1.5) {
        result = { multiplier: 1.3, reason: 'Extreme Traffic' };
      } else if (congestionRatio > 1.25) {
        result = { multiplier: 1.15, reason: 'Heavy Traffic' };
      } else if (congestionRatio < 0.9) {
        result = { multiplier: 0.9, reason: 'Clear Roads' }; // Discount for non-traffic zones!
      }

      this.trafficCache.set(cacheKey, { ...result, expiresAt: Date.now() + 3 * 60 * 1000 });
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch traffic data: ${error.message}`);
      return { multiplier: 1.0, reason: 'Standard' };
    }
  }
}
