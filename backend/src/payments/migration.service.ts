import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class MigrationService implements OnModuleInit {
    constructor(private dataSource: DataSource) { }

    async onModuleInit() {
        console.log('--- STARTING COMPREHENSIVE DB SYNCHRONIZATION ---');
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        
        try {
            // 0. Enable UUID extension
            await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
            console.log('✅ Extension uuid-ossp enabled.');

            // 1. Users Table - Roles Array
            await queryRunner.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='roles') THEN
                        ALTER TABLE "users" ADD COLUMN "roles" text[] NOT NULL DEFAULT '{rider}';
                        -- Migrate from role to roles array if role exists
                        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
                           UPDATE "users" SET "roles" = ARRAY["role"]::text[];
                        END IF;
                    END IF;

                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password') THEN
                        ALTER TABLE "users" ADD COLUMN "password" text;
                    END IF;
                END $$;
            `);
            console.log('✅ Password column added to users table.');
            console.log('✅ Users table roles array synchronized.');

            // 2. Driver Profiles Table - Add Missing Columns
            await queryRunner.query(`
                DO $$
                BEGIN
                    -- Core ID/Docs
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_profiles' AND column_name='license_number') THEN
                        ALTER TABLE "driver_profiles" ADD COLUMN "license_number" character varying(50);
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_profiles' AND column_name='license_image') THEN
                        ALTER TABLE "driver_profiles" ADD COLUMN "license_image" text;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_profiles' AND column_name='aadhar_number') THEN
                        ALTER TABLE "driver_profiles" ADD COLUMN "aadhar_number" character varying(12);
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_profiles' AND column_name='aadhar_image') THEN
                        ALTER TABLE "driver_profiles" ADD COLUMN "aadhar_image" text;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_profiles' AND column_name='pan_image') THEN
                        ALTER TABLE "driver_profiles" ADD COLUMN "pan_image" text;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_profiles' AND column_name='license_back_image') THEN
                        ALTER TABLE "driver_profiles" ADD COLUMN "license_back_image" text;
                    END IF;
                    
                    -- Vehicle Setup
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_profiles' AND column_name='vehicle_type') THEN
                        -- Create type if doesn't exist (enumName: vehicle_type)
                        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_type_enum') THEN
                           CREATE TYPE "vehicle_type_enum" AS ENUM('cab', 'bike', 'auto', 'bike_lite', 'parcel', 'premium');
                        END IF;
                        ALTER TABLE "driver_profiles" ADD COLUMN "vehicle_type" "vehicle_type_enum" DEFAULT 'auto';
                    END IF;
                    
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_profiles' AND column_name='vehicle_images') THEN
                        ALTER TABLE "driver_profiles" ADD COLUMN "vehicle_images" text[] DEFAULT '{}';
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_profiles' AND column_name='rc_document') THEN
                        ALTER TABLE "driver_profiles" ADD COLUMN "rc_document" text;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_profiles' AND column_name='insurance_document') THEN
                        ALTER TABLE "driver_profiles" ADD COLUMN "insurance_document" text;
                    END IF;

                    -- Metrics & Availability
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_profiles' AND column_name='driver_rating') THEN
                        ALTER TABLE "driver_profiles" ADD COLUMN "driver_rating" numeric(2,1) DEFAULT 5.0;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_profiles' AND column_name='total_rides') THEN
                        ALTER TABLE "driver_profiles" ADD COLUMN "total_rides" integer DEFAULT 0;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_profiles' AND column_name='earnings_total') THEN
                        ALTER TABLE "driver_profiles" ADD COLUMN "earnings_total" numeric(12,2) DEFAULT 0.0;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_profiles' AND column_name='is_available') THEN
                        ALTER TABLE "driver_profiles" ADD COLUMN "is_available" boolean DEFAULT false;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_profiles' AND column_name='is_online') THEN
                        ALTER TABLE "driver_profiles" ADD COLUMN "is_online" boolean DEFAULT false;
                    END IF;

                    -- Approval
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_profiles' AND column_name='approved_at') THEN
                        ALTER TABLE "driver_profiles" ADD COLUMN "approved_at" timestamp without time zone;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_profiles' AND column_name='approved_by') THEN
                        ALTER TABLE "driver_profiles" ADD COLUMN "approved_by" uuid;
                    END IF;
                END $$;
            `);
            console.log('✅ Driver profiles table synchronized (License, Aadhar, Vehicle Type added).');

            // 3. Rider Profiles - Super Coins
            await queryRunner.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rider_profiles' AND column_name='super_coins_balance') THEN
                        ALTER TABLE "rider_profiles" ADD COLUMN "super_coins_balance" integer DEFAULT 0;
                    END IF;
                END $$;
            `);
            console.log('✅ Rider profiles table synchronized.');

            // 4. Wallets - Platform Fees
            await queryRunner.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wallets' AND column_name='pending_platform_fees') THEN
                        ALTER TABLE "wallets" ADD COLUMN "pending_platform_fees" numeric(10,2) DEFAULT 0.0;
                    END IF;
                END $$;
            `);
            console.log('✅ Wallets table synchronized (Platform Fees column added).');

            // 5. Drivers Table (Real-time data)
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "drivers" (
                  "id" SERIAL PRIMARY KEY,
                  "user_id" uuid NOT NULL,
                  "name" character varying,
                  "license_number" character varying,
                  "vehicle_details" text,
                  "vehicle_type" "vehicle_type_enum",
                  "is_online" boolean DEFAULT false,
                  "last_seen_at" timestamp with time zone,
                  "current_latitude" numeric(10,6),
                  "current_longitude" numeric(10,6),
                  "current_location" geography(Point,4326),
                  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                  CONSTRAINT "UQ_drivers_user_id" UNIQUE ("user_id"),
                  CONSTRAINT "FK_drivers_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
                )
            `);
            console.log('✅ Drivers real-time table verified.');

            // 6. Wallet Transactions
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "wallet_transactions" (
                  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                  "wallet_id" uuid NOT NULL,
                  "amount" numeric(10,2) NOT NULL,
                  "transaction_type" character varying NOT NULL,
                  "reference_type" character varying NOT NULL,
                  "reference_id" character varying NOT NULL,
                  "description" character varying NOT NULL,
                  "balance_after" numeric(10,2) NOT NULL,
                  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                  CONSTRAINT "PK_wallet_transactions_id" PRIMARY KEY ("id"),
                  CONSTRAINT "FK_wallet_transactions_wallet_id" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
                )
            `);
            console.log('✅ Wallet transactions table verified.');

            // 7. Favorite Drivers
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "favorite_drivers" (
                  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                  "rider_id" uuid NOT NULL,
                  "driver_id" integer NOT NULL,
                  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                  CONSTRAINT "PK_favorite_drivers_id" PRIMARY KEY ("id"),
                  CONSTRAINT "UQ_favorite_drivers_rider_driver" UNIQUE ("rider_id", "driver_id"),
                  CONSTRAINT "FK_favorite_drivers_rider_id" FOREIGN KEY ("rider_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                  CONSTRAINT "FK_favorite_drivers_driver_id" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE NO ACTION
                )
            `);
            console.log('✅ Favorite drivers table verified.');

            // 8. Notifications Table
            await queryRunner.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
                       CREATE TYPE "notification_type" AS ENUM('ride_request', 'ride_accepted', 'ride_completed', 'promotion', 'system', 'payment');
                    END IF;
                END $$
            `);
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "notifications" (
                  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                  "user_id" uuid NOT NULL,
                  "type" "notification_type" NOT NULL DEFAULT 'system',
                  "title" character varying(200) NOT NULL,
                  "message" text NOT NULL,
                  "data" jsonb,
                  "is_read" boolean NOT NULL DEFAULT false,
                  "sent_at" TIMESTAMP NOT NULL DEFAULT now(),
                  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                  CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id"),
                  CONSTRAINT "FK_notifications_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
                )
            `);
            console.log('✅ Notifications table verified.');

            // 9. Settlements Table (Razorpay payment tracking)
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "settlements" (
                  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                  "driver_id" uuid NOT NULL,
                  "amount" numeric(10,2) NOT NULL,
                  "razorpay_order_id" character varying,
                  "razorpay_payment_id" character varying,
                  "status" character varying NOT NULL DEFAULT 'PENDING',
                  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                  CONSTRAINT "PK_settlements_id" PRIMARY KEY ("id"),
                  CONSTRAINT "FK_settlements_driver_id" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE CASCADE
                )
            `);
            console.log('✅ Settlements table verified.');

            // 10. Ride Rejections Table
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "ride_rejections" (
                  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                  "ride_id" uuid NOT NULL,
                  "driver_id" uuid NOT NULL,
                  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                  CONSTRAINT "PK_ride_rejections_id" PRIMARY KEY ("id"),
                  CONSTRAINT "UQ_ride_rejections_ride_driver" UNIQUE ("ride_id", "driver_id"),
                  CONSTRAINT "FK_ride_rejections_ride_id" FOREIGN KEY ("ride_id") REFERENCES "rides"("id") ON DELETE CASCADE,
                  CONSTRAINT "FK_ride_rejections_driver_id" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE CASCADE
                )
            `);
            console.log('✅ Ride rejections table verified.');

            // 11. Rides Table - Missing Financial Columns
            await queryRunner.query(`
                DO $$
                BEGIN
                    -- Create payment_method_enum if it doesn't exist
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_enum') THEN
                        CREATE TYPE "payment_method_enum" AS ENUM('cash', 'online');
                    END IF;

                    -- Add payment_method column
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rides' AND column_name='payment_method') THEN
                        ALTER TABLE "rides" ADD COLUMN "payment_method" "payment_method_enum" DEFAULT 'cash';
                    END IF;

                    -- Add financial columns
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rides' AND column_name='gst_amount') THEN
                        ALTER TABLE "rides" ADD COLUMN "gst_amount" numeric(8,2) DEFAULT 0;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rides' AND column_name='platform_fee') THEN
                        ALTER TABLE "rides" ADD COLUMN "platform_fee" numeric(8,2) DEFAULT 0;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rides' AND column_name='driver_earnings') THEN
                        ALTER TABLE "rides" ADD COLUMN "driver_earnings" numeric(8,2) DEFAULT 0;
                    END IF;
                END $$;
            `);
            console.log('✅ Rides table synchronized (Financial columns added).');

            // 12. Ratings Table
            await queryRunner.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rating_role_enum') THEN
                        CREATE TYPE "rating_role_enum" AS ENUM('rider', 'driver');
                    END IF;
                END $$;
                
                CREATE TABLE IF NOT EXISTS "ratings" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "ride_id" uuid NOT NULL,
                    "rated_by_user_id" uuid NOT NULL,
                    "rated_user_id" uuid NOT NULL,
                    "rated_user_role" "rating_role_enum" NOT NULL,
                    "stars" numeric(2,1) NOT NULL,
                    "comment" text,
                    "tags" text[] DEFAULT '{}',
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_ratings_id" PRIMARY KEY ("id"),
                    CONSTRAINT "FK_ratings_ride_id" FOREIGN KEY ("ride_id") REFERENCES "rides"("id") ON DELETE CASCADE,
                    CONSTRAINT "FK_ratings_rated_by_user_id" FOREIGN KEY ("rated_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE,
                    CONSTRAINT "FK_ratings_rated_user_id" FOREIGN KEY ("rated_user_id") REFERENCES "users"("id") ON DELETE CASCADE
                );
            `);
            console.log('✅ Ratings table verified.');

            console.log('--- DB SYNCHRONIZATION COMPLETED SUCCESSFULLY ---');
        } catch (error) {
            console.error('❌ DB SYNCHRONIZATION FAILED:', error);
        } finally {
            await queryRunner.release();
        }
    }
}
