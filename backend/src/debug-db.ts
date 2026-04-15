import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function checkDb() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  
  const columns = await runner.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'driver_profiles'
  `);
  console.log('--- DRIVER_PROFILES COLUMNS ---');
  console.log(JSON.stringify(columns, null, 2));
  
  const sample = await runner.query(`SELECT * FROM driver_profiles LIMIT 1`);
  console.log('--- SAMPLE DRIVER ---');
  console.log(JSON.stringify(sample, null, 2));

  await runner.release();
  await app.close();
}
checkDb();
