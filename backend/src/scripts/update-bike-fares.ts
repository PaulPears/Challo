import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { FareSetting } from '../rides/fare-setting.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleType } from '../rides/ride.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const repo = app.get<Repository<FareSetting>>(getRepositoryToken(FareSetting));

  console.log('--- Current Fare Settings ---');
  const allSettings = await repo.find();
  allSettings.forEach(s => {
    console.log(`${s.vehicle_type}: Base=₹${s.base_fare}, PerKm=₹${s.per_km_rate}, Min=₹${s.minimum_fare}`);
  });

  const bikeTypes = [VehicleType.BIKE, 'bike_lite', 'luxury_bike'] as any[];

  for (const type of bikeTypes) {
    const setting = await repo.findOne({ where: { vehicle_type: type } });
    if (setting) {
      console.log(`\nUpdating ${type}...`);
      setting.base_fare = type === 'luxury_bike' ? 35 : 25;
      setting.per_km_rate = type === 'luxury_bike' ? 10 : 8;
      setting.minimum_fare = type === 'luxury_bike' ? 45 : 35;
      await repo.save(setting);
      console.log(`Updated ${type}: Base=₹${setting.base_fare}, PerKm=₹${setting.per_km_rate}, Min=₹${setting.minimum_fare}`);
    }
  }

  await app.close();
}

bootstrap();
