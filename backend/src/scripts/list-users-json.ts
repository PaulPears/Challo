
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../users/user.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  
  const users = await userRepo.find({
    select: ['id', 'name', 'phone_number', 'roles'],
    take: 10,
  });
  
  console.log('--- USERS JSON ---');
  console.log(JSON.stringify(users));
  
  await app.close();
}

bootstrap();
