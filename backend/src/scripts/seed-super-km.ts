
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { RiderProfile } from '../users/rider-profile.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const riderRepo = app.get<Repository<RiderProfile>>(getRepositoryToken(RiderProfile));
  
  const users = await userRepo.find({
    select: ['id', 'name', 'phone_number'],
    take: 5,
  });
  
  console.log('USERS_JSON_START');
  console.log(JSON.stringify(users));
  console.log('USERS_JSON_END');

  // Also seed one user with super km if they have a rider profile
  if (users.length > 0) {
      const firstUser = users[0];
      await riderRepo.save({
          user_id: firstUser.id,
          super_km_balance: 50.00
      });
      console.log(`CREDITED ${firstUser.name} (${firstUser.id}) WITH 50 Super KM`);
  }
  
  await app.close();
}

bootstrap();
