
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  
  const users = await userRepo.find({
    select: ['id', 'name', 'phone_number', 'roles'],
    take: 10,
  });
  
  console.log('--- TEST USERS ---');
  console.table(users);
  
  await app.close();
}

bootstrap();
