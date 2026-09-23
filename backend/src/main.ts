// Allow self-signed certs for Railway PostgreSQL SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';
import { ValidationPipe } from '@nestjs/common';
import { LoggerService } from './common/logger/logger.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new LoggerService();
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      bufferLogs: true,
      rawBody: true, // Needed for Razorpay/Stripe webhooks signature verification
    });

    // Initialize custom logger
    app.useLogger(logger);
    logger.log('🚀 Starting application bootstrap...', 'Bootstrap');

    // Serve static files uploaded by users
    app.useStaticAssets(join(process.cwd(), 'uploads'), {
      prefix: '/uploads/',
    });

    // Global exception filter
    app.useGlobalFilters(new HttpExceptionFilter(logger));

    // Enable global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Strip properties not in the DTO
        transform: true, // Transform payloads to DTO instances
        forbidNonWhitelisted: true, // Throw error if extra properties are present
      }),
    );
    
    // Increase payload limits for document uploads
    const express = require('express');
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    // Security Headers - Helmet.js
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
        crossOriginEmbedderPolicy: false, // Disable for API compatibility
        crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin requests
      }),
    );

    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['*']; // Allow all for development if not specified

    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        logger.warn(`CORS blocked origin: ${origin}`, 'Bootstrap');
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      exposedHeaders: ['Content-Length', 'Content-Type'],
      maxAge: 3600,
    });

    // Request Size Limits - Prevent DoS attacks
    app.use(compression());

    const port = process.env.PORT ?? 3000;
    const nodeEnv = process.env.NODE_ENV ?? 'development';

    logger.log(`Environment: ${nodeEnv}`, 'Bootstrap');
    logger.log(`Attempting to listen on port: ${port}`, 'Bootstrap');

    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 Application is running on: http://0.0.0.0:${port}`, 'Bootstrap');
    logger.log(`🔒 Security middleware enabled: Helmet, CORS, Compression`, 'Bootstrap');
    logger.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`, 'Bootstrap');
  } catch (error) {
    logger.error('❌ Application failed to start!', error.stack, 'Bootstrap');
    process.exit(1);
  }
}
bootstrap();
