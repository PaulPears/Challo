
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RidesService } from '../rides/rides.service';
import { RideStatus } from '../rides/ride.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ridesService = app.get(RidesService);
  
  const driverId = '82703816-6c13-4c54-942b-92736417d91e'; // Praveen kumar (driver)
  
  console.log('Searching for your current active ride...');
  const activeRide = await ridesService.getCurrentRide(driverId);
  
  if (!activeRide) {
    console.log('No active ride found for this driver.');
  } else {
    console.log(`Starting/Completing ride ${activeRide.id} for driver ${driverId}...`);
    
    // 1. If it was accepted, we need to START it first (backend logic requires this)
    if (activeRide.status === RideStatus.ACCEPTED) {
        console.log('Stepping to IN_PROGRESS (OTP: ' + activeRide.otp + ')');
        await ridesService.startRide(activeRide.id, driverId, activeRide.otp);
    }
    
    // 2. Complete it
    await ridesService.completeRide(activeRide.id, driverId);
    console.log('RIDE_COMPLETED_SUCCESSFULLY');
  }
  
  await app.close();
}

bootstrap();
