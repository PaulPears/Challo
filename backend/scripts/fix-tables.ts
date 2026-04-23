import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';

async function fixTables() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  
  console.log('--- FIXING MISSING TABLES ---');
  
  try {
    // 1. Surge Events Table
    await runner.query(`
      CREATE TABLE IF NOT EXISTS surge_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        start_date TIMESTAMPTZ NOT NULL,
        end_date TIMESTAMPTZ NOT NULL,
        multiplier DECIMAL(5,3) DEFAULT 1.200,
        vehicle_types TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ surge_events table ensured.');

    // 2. Ride Ratings Table (if missing)
    await runner.query(`
      CREATE TABLE IF NOT EXISTS ride_ratings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ride_id UUID,
        rater_user_id UUID,
        rated_user_id UUID,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ ride_ratings table ensured.');

  } catch (error) {
    console.error('❌ Table fix failed:', error);
  } finally {
    await runner.release();
    await app.close();
  }
}

fixTables();
