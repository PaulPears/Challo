import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { FareSetting } from './fare-setting.entity';
import { FareTier } from './fare-tier.entity';
import { SurgeEvent } from './surge-event.entity';
import { PeakHourSurge } from './peak-hour-surge.entity';
import { Ride, RideStatus, VehicleType } from './ride.entity';
import { WeatherService } from './weather.service';
import { TrafficService } from './traffic.service';

export interface FareBreakdown {
  vehicleType: VehicleType;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  surgeReason: string;
  subtotal: number;
  gst: number;
  totalFare: number;
  breakdown: string;
  superKmApplied?: number;
  superKmDiscount?: number;
  riderPayable?: number;
  companyPayable?: number;
}

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(FareSetting)
    private fareSettingsRepository: Repository<FareSetting>,
    @InjectRepository(SurgeEvent)
    private surgeEventRepository: Repository<SurgeEvent>,
    @InjectRepository(PeakHourSurge)
    private peakHourSurgeRepository: Repository<PeakHourSurge>,
    @InjectRepository(Ride)
    private ridesRepository: Repository<Ride>,
    private weatherService: WeatherService,
    private trafficService: TrafficService,
  ) {}

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async getFareEstimate(
    distance: number,
    duration: number,
    vehicleType: VehicleType,
    lat?: number,
    lng?: number,
    destLat?: number,
    destLng?: number,
    superKmBalance?: number,
  ): Promise<FareBreakdown> {
    const distanceInKm = distance / 1000;
    const durationInMinutes = duration / 60;

    const fareSetting = await this.fareSettingsRepository.findOne({
      where: { vehicle_type: vehicleType, is_active: true },
      relations: ['tiers'],
    });

    if (!fareSetting) {
      throw new NotFoundException(`Fare settings for vehicle type ${vehicleType} not found.`);
    }

    const baseFare = parseFloat(fareSetting.base_fare as any);
    const perMinuteRate = parseFloat(fareSetting.per_minute_rate as any);
    const minimumFare = parseFloat(fareSetting.minimum_fare as any);
    const basePerKmRate = parseFloat(fareSetting.per_km_rate as any);

    let distanceCost = 0;
    let remainingDistance = distanceInKm;

    if (fareSetting.tiers && fareSetting.tiers.length > 0) {
      const sortedTiers = fareSetting.tiers.sort(
        (a, b) => parseFloat(a.km_from as any) - parseFloat(b.km_from as any),
      );
      for (const tier of sortedTiers) {
        if (remainingDistance <= 0) break;
        const tierStartKm = parseFloat(tier.km_from as any);
        const tierEndKm = parseFloat(tier.km_to as any);
        const tierPerKmRate = parseFloat(tier.per_km_rate as any);
        const distanceInTierRange = tierEndKm - tierStartKm;
        const distanceToBillInTier = Math.min(remainingDistance, distanceInTierRange);
        if (distanceToBillInTier > 0) {
          distanceCost += distanceToBillInTier * tierPerKmRate;
          remainingDistance -= distanceToBillInTier;
        }
      }
    }

    if (remainingDistance > 0) {
      distanceCost += remainingDistance * basePerKmRate;
    }

    const timeCost = durationInMinutes * perMinuteRate;
    const initialCalculatedFare = baseFare + distanceCost + timeCost;

    // --- Dynamic Pricing Factors ---
    let surgeMultiplier = 1.0;
    let surgeReason = 'Standard Pricing';

    const now = new Date();
    const currentTimeString = now.toTimeString().substring(0, 8); // e.g. "18:30:00"
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // 1. Evaluate Peak Hour Surges
    const activePeakHours = await this.peakHourSurgeRepository.find({
      where: { is_active: true },
    });

    for (const peak of activePeakHours) {
      if (!peak.appliesToVehicleType(vehicleType)) continue;

      // Check day of week
      if (peak.days_of_week && peak.days_of_week.length > 0) {
        if (!peak.days_of_week.includes(currentDayOfWeek)) continue;
      }

      // Check time window (handles midnight crossover)
      let timeMatches = false;
      if (peak.start_time <= peak.end_time) {
        // Normal range (e.g., 09:00 to 17:00)
        timeMatches = currentTimeString >= peak.start_time && currentTimeString <= peak.end_time;
      } else {
        // Crossover range (e.g., 22:00 to 05:00)
        timeMatches = currentTimeString >= peak.start_time || currentTimeString <= peak.end_time;
      }

      if (timeMatches) {
        // Check location if provided
        let inRange = true;
        if (peak.latitude && peak.longitude && peak.radius_km && lat && lng) {
          const dist = this.calculateDistance(lat, lng, Number(peak.latitude), Number(peak.longitude));
          if (dist > Number(peak.radius_km)) inRange = false;
        }

        if (inRange) {
          const peakMultiplier = parseFloat(peak.multiplier as any);
          if (peakMultiplier > surgeMultiplier) {
            surgeMultiplier = peakMultiplier;
            surgeReason = peak.name;
          }
        }
      }
    }

    // 2. Evaluate Surge Events (One-off events like Festivals)
    const activeEvents = await this.surgeEventRepository.find({
      where: {
        is_active: true,
        start_date: LessThanOrEqual(now),
        end_date: MoreThanOrEqual(now),
      },
    });

    for (const event of activeEvents) {
      if (!event.appliesToVehicleType(vehicleType)) continue;

      let inRange = true;
      if (event.latitude && event.longitude && event.radius_km && lat && lng) {
        const dist = this.calculateDistance(lat, lng, Number(event.latitude), Number(event.longitude));
        if (dist > Number(event.radius_km)) inRange = false;
      }

      if (inRange) {
        const eventMultiplier = parseFloat(event.multiplier as any);
        if (eventMultiplier > surgeMultiplier) {
          surgeMultiplier = eventMultiplier;
          surgeReason = event.name;
        }
      }
    }

    // 3. Demand-Supply Surge (Simple Query)
    const pendingRidesCount = await this.ridesRepository.count({
      where: { status: RideStatus.PENDING, created_at: MoreThanOrEqual(new Date(Date.now() - 15 * 60 * 1000)) },
    });

    // Dummy threshold for surge based on pending rides
    if (pendingRidesCount > 10) {
      const demandMultiplier = 1 + (pendingRidesCount / 50);
      if (demandMultiplier > surgeMultiplier) {
        surgeMultiplier = Math.min(demandMultiplier, 2.5);
        surgeReason = 'High Demand in Area';
      }
    }

    // 4. Weather Surcharge (Automated)
    if (lat && lng) {
      const isBadWeather = await this.weatherService.isBadWeather(lat, lng);
      if (isBadWeather) {
        surgeMultiplier *= 1.15;
        surgeReason += ' + Weather Surcharge';
      } else if (fareSetting.weather_surge_active) {
        // Fallback to manual flag if API isn't used or doesn't detect it
        surgeMultiplier *= 1.15;
        surgeReason += ' + Weather Surcharge (Manual)';
      }
    }

    // 5. Traffic Surcharge / Discount (Automated)
    if (lat && lng && destLat && destLng) {
      const traffic = await this.trafficService.getTrafficMultiplier(lat, lng, destLat, destLng);
      if (traffic.multiplier !== 1.0) {
        surgeMultiplier *= traffic.multiplier;
        surgeReason += ` + ${traffic.reason}`;
      }
    }

    // Cap the surge
    surgeMultiplier = Math.min(surgeMultiplier, parseFloat(fareSetting.max_surge_cap as any));

    let finalFare = initialCalculatedFare * surgeMultiplier;
    finalFare = Math.max(finalFare, minimumFare);

    // GST Calculation (5%)
    const gstValue = finalFare * 0.05;
    const totalWithGst = finalFare + gstValue;

    const estimate: FareBreakdown = {
      vehicleType,
      baseFare: parseFloat(baseFare.toFixed(2)),
      distanceFare: parseFloat(distanceCost.toFixed(2)),
      timeFare: parseFloat(timeCost.toFixed(2)),
      surgeMultiplier: parseFloat(surgeMultiplier.toFixed(2)),
      surgeReason,
      subtotal: parseFloat(finalFare.toFixed(2)),
      gst: parseFloat(gstValue.toFixed(2)),
      totalFare: parseFloat(totalWithGst.toFixed(2)),
      breakdown: `Base ₹${baseFare.toFixed(2)} + Dist ₹${distanceCost.toFixed(2)} + Time ₹${timeCost.toFixed(2)}${surgeMultiplier > 1 ? ` × Surge ${surgeMultiplier.toFixed(1)}` : ''}`,
      superKmApplied: 0,
      superKmDiscount: 0,
      riderPayable: parseFloat(totalWithGst.toFixed(2)),
      companyPayable: 0,
    };

    if (superKmBalance && superKmBalance > 0) {
      const balance = Number(superKmBalance);
      const appliedKm = Math.min(distanceInKm, balance);
      // In the super kilometer system, the discount is strictly (Sk * ckm)
      // We use basePerKmRate as the 'ckm' reference
      const discount = appliedKm * basePerKmRate;
      
      estimate.superKmApplied = parseFloat(appliedKm.toFixed(2));
      estimate.superKmDiscount = parseFloat(discount.toFixed(2));
      
      // Force mathematical consistency: Total = Rider + Company
      estimate.companyPayable = estimate.superKmDiscount;
      estimate.riderPayable = parseFloat(Math.max(0, totalWithGst - estimate.companyPayable).toFixed(2));
      
      // The total must be the exact sum of the portions to avoid 0.01 discrepancies
      estimate.totalFare = parseFloat((estimate.riderPayable + estimate.companyPayable).toFixed(2));
    }


    return estimate;
  }
}
