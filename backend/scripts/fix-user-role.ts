import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';

async function fixUserRoleWithRepository() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const userRepository = app.get(require('./src/users/users.module').UsersService).usersRepository;
    
    // Find the user
    let user = await userRepository.findOne({ where: { phone_number: '8374950475' } });
    if (user) {
      user.roles = ['rider', 'driver']; // TypeORM will serialize it automatically
      await userRepository.save(user);
      console.log('✅ Successfully updated user via TypeORM repository!');
    } else {
      console.log('❌ User not found.');
    }

    // Checking the parcel pricing
    const pricingService = app.get(require('./src/rides/pricing.service').PricingService);
    const test1 = await pricingService.getFareEstimate(1000, 120, 'parcel');
    const test10 = await pricingService.getFareEstimate(10000, 1200, 'parcel');
    
    console.log('\n--- PRICING TEST FOR PARCEL ---');
    console.log(`1km: ₹${test1.totalFare} (Breakdown: ${test1.breakdown})`);
    console.log(`10km: ₹${test10.totalFare} (Breakdown: ${test10.breakdown})`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await app.close();
  }
}

fixUserRoleWithRepository();
