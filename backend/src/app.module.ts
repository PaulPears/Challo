import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DriversModule } from './drivers/drivers.module';
import { RidesModule } from './rides/rides.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';
import { StorageModule } from './common/storage/storage.module';
import { RatingsModule } from './ratings/ratings.module';
import { IncentivesModule } from './incentives/incentives.module';
import { AppConfigModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: process.env.DB_SYNC === 'true', // Use true ONLY for initial deployment or carefully in non-prod environments

      // Connection Pooling
      extra: {
        max: parseInt(process.env.DB_POOL_MAX || '10'), // Maximum connections
        min: parseInt(process.env.DB_POOL_MIN || '2'),  // Minimum connections
        idleTimeoutMillis: 30000, // Close idle connections after 30s
        connectionTimeoutMillis: 10000, // Timeout for acquiring connection

        // SSL Configuration for production
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        } : false,
      },

      // Query timeout
      connectTimeoutMS: 10000,

      // Logging
      logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],

      // Retry logic
      retryAttempts: 3,
      retryDelay: 3000,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),

    AuthModule,
    UsersModule,
    DriversModule,
    RidesModule,
    PaymentsModule,
    NotificationsModule,
    HealthModule,
    AdminModule,
    StorageModule,
    RatingsModule,
    IncentivesModule,
    AppConfigModule,
  ],
})
export class AppModule { }
