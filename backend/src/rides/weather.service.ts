import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly apiKey = process.env.OPENWEATHER_API_KEY;
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5/weather';

  async isBadWeather(lat: number, lng: number): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn('OPENWEATHER_API_KEY is not set. Weather surge will not be automated.');
      return false;
    }

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          lat,
          lon: lng,
          appid: this.apiKey,
          units: 'metric',
        },
      });

      const weather = response.data.weather[0].main.toLowerCase();
      const condition = response.data.weather[0].description.toLowerCase();
      
      this.logger.debug(`Weather at (${lat}, ${lng}): ${weather} (${condition})`);

      // List of conditions that trigger a surge
      const badConditions = ['rain', 'thunderstorm', 'drizzle', 'snow', 'extreme'];
      
      if (badConditions.some(c => weather.includes(c) || condition.includes(c))) {
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to fetch weather: ${error.message}`);
      return false;
    }
  }
}
