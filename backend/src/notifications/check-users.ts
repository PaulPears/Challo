import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../users/user.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const userRepository = dataSource.getRepository(User);
  
  console.log('--- User Roles Check ---');
  try {
    const users = await userRepository.find({ select: { id: true, name: true, roles: true, rider_push_token: true, driver_push_token: true } });
    console.log('Total users:', users.length);
    users.forEach(u => {
      console.log(`User: ${u.name || 'N/A'}, Roles: ${JSON.stringify(u.roles)}, Rider Token: ${u.rider_push_token ? 'Exists' : 'Missing'}, Driver Token: ${u.driver_push_token ? 'Exists' : 'Missing'}`);
    });

    // Test specific filters
    const riders = await userRepository.createQueryBuilder('user')
      .where('"user"."roles"::text[] @> ARRAY[:role]::text[]', { role: UserRole.RIDER })
      .getMany();
    console.log('Riders found via QueryBuilder:', riders.length);

    const drivers = await userRepository.createQueryBuilder('user')
      .where('"user"."roles"::text[] @> ARRAY[:role]::text[]', { role: UserRole.DRIVER })
      .getMany();
    console.log('Drivers found via QueryBuilder:', drivers.length);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await app.close();
  }
}

bootstrap();
