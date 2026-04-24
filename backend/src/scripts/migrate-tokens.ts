import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const queryRunner = dataSource.createQueryRunner();

  console.log('🚀 Starting Push Token Migration...');

  try {
    await queryRunner.connect();
    
    // 1. Add rider_push_token if it doesn't exist
    console.log('Checking rider_push_token column...');
    await queryRunner.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='rider_push_token') THEN
          ALTER TABLE users ADD COLUMN rider_push_token VARCHAR(255);
        END IF;
      END $$;
    `);

    // 2. Add driver_push_token if it doesn't exist
    console.log('Checking driver_push_token column...');
    await queryRunner.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='driver_push_token') THEN
          ALTER TABLE users ADD COLUMN driver_push_token VARCHAR(255);
        END IF;
      END $$;
    `);

    // 3. Migrate data from old push_token column if it exists
    console.log('Migrating existing token data...');
    await queryRunner.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='push_token') THEN
          UPDATE users SET rider_push_token = push_token WHERE rider_push_token IS NULL;
          -- ALTER TABLE users DROP COLUMN push_token; -- Commented out for safety, you can drop it later
        END IF;
      END $$;
    `);

    console.log('✅ Migration successful! The new columns are ready.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

bootstrap();
