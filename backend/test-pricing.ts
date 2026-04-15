import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PricingService } from './src/rides/pricing.service';
import { VehicleType } from './src/rides/ride.entity';

async function testPricing() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const pricingService = app.get(PricingService);

  const distances = [1, 3, 5, 10, 20]; // km
  const type = VehicleType.PARCEL;

  console.log(`--- PRICING TEST FOR ${type} ---`);
  for (const dist of distances) {
    try {
      const estimate = await pricingService.getFareEstimate(dist * 1000, dist * 2 * 60, type); // duration = 2 min/km
      console.log(`Distance: ${dist} km -> Total: ₹${estimate.totalFare} (Subtotal: ${estimate.subtotal}, GST: ${estimate.gst})`);
      console.log(` Breakdown: ${estimate.breakdown}`);
    } catch (e) {
      console.error(`Error for ${dist}km:`, e.message);
    }
  }

  await app.close();
}
testPricing();
