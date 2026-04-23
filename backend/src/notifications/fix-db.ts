import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  console.log('--- Database Fix Started ---');
  try {
    await dataSource.query(`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);
    console.log('✅ Column updated_at successfully ensured on notifications table.');
  } catch (error) {
    console.error('❌ Failed to update database:', error.message);
  } finally {
    await app.close();
    console.log('--- Database Fix Finished ---');
  }
}

bootstrap();
