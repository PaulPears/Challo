import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function checkFares() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  
  const fareSettings = await runner.query(`SELECT * FROM fare_settings`);
  console.log('--- FARE_SETTINGS ---');
  console.log(JSON.stringify(fareSettings, null, 2));
  
  const fareTiers = await runner.query(`SELECT * FROM fare_tiers`);
  console.log('--- FARE_TIERS ---');
  console.log(JSON.stringify(fareTiers, null, 2));

  await runner.release();
  await app.close();
}
checkFares();
