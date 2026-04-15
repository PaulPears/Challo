import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { FareSetting } from './fare-setting.entity';
import { FareTier } from './fare-tier.entity';
import { SurgeEvent } from './surge-event.entity';
import { Ride, RideStatus, VehicleType } from './ride.entity';

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
}

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(FareSetting)
    private fareSettingsRepository: Repository<FareSetting>,
    @InjectRepository(SurgeEvent)
    private surgeEventRepository: Repository<SurgeEvent>,
    @InjectRepository(Ride)
    private ridesRepository: Repository<Ride>,
  ) {}

  async getFareEstimate(
    distance: number,
    duration: number,
    vehicleType: VehicleType,
    lat?: number,
    lng?: number,
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

    // 1. Time of Day Multiplier
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 18 && hour <= 21) {
      surgeMultiplier = 1.4;
      surgeReason = 'Evening Rush Hour';
    } else if (hour >= 6 && hour <= 9) {
      surgeMultiplier = 1.3;
      surgeReason = 'Morning Peak';
    } else if (hour >= 22 || hour <= 5) {
      surgeMultiplier = 1.2;
      surgeReason = 'Night Surcharge';
    }

    // 2. Event Surge
    const activeEvent = await this.surgeEventRepository.findOne({
      where: {
        is_active: true,
        start_date: LessThanOrEqual(now),
        end_date: MoreThanOrEqual(now),
      },
    });

    if (activeEvent && activeEvent.multiplier > surgeMultiplier) {
      surgeMultiplier = parseFloat(activeEvent.multiplier as any);
      surgeReason = activeEvent.name;
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

    // 4. Weather Surcharge
    if (fareSetting.weather_surge_active) {
      surgeMultiplier *= 1.15;
      surgeReason += ' + Weather Surcharge';
    }

    // Cap the surge
    surgeMultiplier = Math.min(surgeMultiplier, parseFloat(fareSetting.max_surge_cap as any));

    let finalFare = initialCalculatedFare * surgeMultiplier;
    finalFare = Math.max(finalFare, minimumFare);

    // GST Calculation (5%)
    const gstValue = finalFare * 0.05;
    const totalWithGst = finalFare + gstValue;

    return {
      vehicleType,
      baseFare: parseFloat(baseFare.toFixed(2)),
      distanceFare: parseFloat(distanceCost.toFixed(2)),
      timeFare: parseFloat(timeCost.toFixed(2)),
      surgeMultiplier: parseFloat(surgeMultiplier.toFixed(2)),
      surgeReason,
      subtotal: parseFloat(finalFare.toFixed(2)),
      gst: parseFloat(gstValue.toFixed(2)),
      totalFare: parseFloat(totalWithGst.toFixed(2)),
      breakdown: `Base ₹${baseFare.toFixed(2)} + Dist ₹${distanceCost.toFixed(2)} + Time ₹${timeCost.toFixed(2)}${surgeMultiplier > 1 ? ` × Surge ${surgeMultiplier.toFixed(1)}` : ''}`
    };
  }
}
