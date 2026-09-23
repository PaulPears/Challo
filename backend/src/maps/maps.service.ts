import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MapsService {
  private readonly logger = new Logger(MapsService.name);

  private readonly clientId = process.env.OLA_MAPS_CLIENT_ID || '62a94778-18eb-4d86-bd0f-38c0530e8498';
  private readonly clientSecret = process.env.OLA_MAPS_CLIENT_SECRET || '643e5601fd314e27bf1d1b81150214a9';
  private readonly apiKey = process.env.OLA_MAPS_API_KEY || '6IW2TPoUXEP4gvTf1R3qxhrx5FxdqE1yRTEpwPYj';

  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;

  /**
   * Retrieves or refreshes OAuth2 Bearer token from Ola Maps
   */
  async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.cachedToken;
    }

    try {
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'openid',
      });

      const response = await axios.post('https://api.olamaps.io/auth/v1/token', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      });

      if (response.data && response.data.access_token) {
        const token: string = response.data.access_token;
        this.cachedToken = token;
        return token;
      }
      throw new Error('No access_token returned by Ola Maps auth');
    } catch (err: any) {
      this.logger.error(`Ola Maps auth error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Places Autocomplete for Indian addresses and landmarks
   */
  async autocomplete(input: string, location?: string, radius?: number) {
    const token = await this.getAccessToken();
    const params: any = { input };
    if (location) params.location = location;
    if (radius) params.radius = radius;

    const res = await axios.get('https://api.olamaps.io/places/v1/autocomplete', {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 6000,
    });

    return res.data;
  }

  /**
   * Reverse Geocoding: Coordinates -> Street Address
   */
  async reverseGeocode(lat: number, lng: number) {
    const token = await this.getAccessToken();
    const res = await axios.get('https://api.olamaps.io/places/v1/reverse-geocode', {
      params: {
        latlng: `${lat},${lng}`,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 6000,
    });

    return res.data;
  }

  /**
   * Geocoding: Text address -> Coordinates
   */
  async geocode(address: string) {
    const token = await this.getAccessToken();
    const res = await axios.get('https://api.olamaps.io/places/v1/geocode', {
      params: { address },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 6000,
    });

    return res.data;
  }

  /**
   * Directions & Turn-by-Turn Route calculation
   */
  async getDirections(origin: string, destination: string, mode: string = 'driving') {
    const token = await this.getAccessToken();
    const res = await axios.post(
      `https://api.olamaps.io/routing/v1/directions?origin=${origin}&destination=${destination}&mode=${mode}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 8000,
      },
    );

    return res.data;
  }

  /**
   * Distance and duration calculation between points
   */
  async getDistanceMatrix(origins: string, destinations: string, mode: string = 'driving') {
    const token = await this.getAccessToken();
    const res = await axios.get('https://api.olamaps.io/routing/v1/distanceMatrix', {
      params: {
        origins,
        destinations,
        mode,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 8000,
    });

    return res.data;
  }
}
