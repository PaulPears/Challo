
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RidesService } from '../rides/rides.service';
import { RideStatus } from '../rides/ride.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ridesService = app.get(RidesService);
  
  const driverId = '82703816-6c13-4c54-942b-92736417d91e'; // Praveen kumar (driver)
  
  console.log('Searching for ALL pending rides...');
  const allPending = await ridesService.getPendingRides();
  console.log(`Found ${allPending.length} total pending rides.`);
  
  const pendingRides = await ridesService.getPendingRides(driverId);
  
  if (pendingRides.length === 0) {
    console.log('No pending rides found for this driver.');
  } else {
    const ride = pendingRides[0];
    console.log(`Accepting ride ${ride.id} for driver ${driverId}...`);
    await ridesService.acceptRide(ride.id, driverId);
    console.log('RIDE_ACCEPTED_SUCCESSFULLY');
  }
  
  await app.close();
}

bootstrap();
