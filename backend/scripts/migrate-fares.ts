import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';

async function migrateFares() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  
  console.log('--- STARTING SCHEMA MIGRATION ---');
  
  try {
    // Add missing columns to fare_settings
    await queryRunner.query(`
      ALTER TABLE fare_settings 
      ADD COLUMN IF NOT EXISTS max_surge_cap DECIMAL(4,2) DEFAULT 2.50,
      ADD COLUMN IF NOT EXISTS weather_surge_active BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS zone_airport_multiplier DECIMAL(4,2) DEFAULT 1.25,
      ADD COLUMN IF NOT EXISTS zone_highway_multiplier DECIMAL(4,2) DEFAULT 0.90;
    `);
    console.log('✅ fare_settings columns added successfully.');

    // Ensure sample data covers these new columns if needed (optional)
    // The defaults handle it for now.

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

migrateFares();
