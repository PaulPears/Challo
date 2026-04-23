-- =========================================================
-- 🚀 RIDE ANDHRA – MIGRATION: Entity/Schema Sync (V5)
-- =========================================================

-- 1️⃣ USERS TABLE UPDATES
------------------------------------------------------------
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS password VARCHAR(255),
    ADD COLUMN IF NOT EXISTS push_token VARCHAR(255),
    ADD COLUMN IF NOT EXISTS roles text[] DEFAULT '{"rider"}';

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
        UPDATE users SET roles = array_append('{}', role::text) WHERE roles = '{"rider"}' OR roles IS NULL;
    END IF;
END $$;

-- 2️⃣ RIDES TABLE UPDATES
------------------------------------------------------------
ALTER TABLE rides 
    ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(8,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(8,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS driver_earnings DECIMAL(8,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS super_km_applied DECIMAL(8,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS super_km_discount DECIMAL(8,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rider_payable DECIMAL(8,2),
    ADD COLUMN IF NOT EXISTS company_payable DECIMAL(8,2),
    ADD COLUMN IF NOT EXISTS otp VARCHAR(10);

DO $$ 
BEGIN
    ALTER TYPE payment_method_enum ADD VALUE IF NOT EXISTS 'online';
    ALTER TYPE vehicle_type_enum ADD VALUE IF NOT EXISTS 'luxury_bike';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3️⃣ WALLETS TABLE UPDATES
------------------------------------------------------------
ALTER TABLE wallets 
    ADD COLUMN IF NOT EXISTS super_km_balance DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS pending_platform_fees DECIMAL(10,2) DEFAULT 0;

-- 4️⃣ DRIVER_PROFILES TABLE UPDATES
------------------------------------------------------------
ALTER TABLE driver_profiles 
    ADD COLUMN IF NOT EXISTS license_back_image TEXT,
    ADD COLUMN IF NOT EXISTS pan_image TEXT,
    ADD COLUMN IF NOT EXISTS vehicle_images TEXT[],
    ADD COLUMN IF NOT EXISTS rc_document TEXT,
    ADD COLUMN IF NOT EXISTS rc_back_document TEXT,
    ADD COLUMN IF NOT EXISTS insurance_document TEXT,
    ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_manual_access BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS license_number VARCHAR(50);

-- 5️⃣ RIDER_PROFILES TABLE UPDATES
------------------------------------------------------------
ALTER TABLE rider_profiles 
    ADD COLUMN IF NOT EXISTS super_coins_balance INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS super_km_balance DECIMAL(10,2) DEFAULT 0;

-- 6️⃣ PAYMENTS TABLE UPDATES
------------------------------------------------------------
ALTER TABLE payments 
    ADD COLUMN IF NOT EXISTS taxable_amount DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0;

-- 7️⃣ SYSTEM_SETTINGS TABLE (NEW)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
    "key" VARCHAR PRIMARY KEY,
    "value" TEXT NOT NULL,
    "type" VARCHAR DEFAULT 'text',
    "description" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 8️⃣ SUBSCRIPTION TABLES (NEW)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
    "id" VARCHAR PRIMARY KEY,
    "name" VARCHAR NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "description" TEXT,
    "features" JSONB DEFAULT '[]',
    "is_popular" BOOLEAN DEFAULT FALSE,
    "is_active" BOOLEAN DEFAULT TRUE,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_sales (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "driver_id" UUID NOT NULL REFERENCES users(id),
    "plan_id" VARCHAR NOT NULL,
    "amount_paid" DECIMAL(12,2) NOT NULL,
    "tax_amount" DECIMAL(12,2) DEFAULT 0,
    "status" VARCHAR(20) DEFAULT 'active',
    "sale_type" VARCHAR(30) DEFAULT 'paid',
    "valid_until" TIMESTAMPTZ,
    "payment_id" VARCHAR,
    "order_id" VARCHAR,
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 9️⃣ SETTLEMENTS & INCENTIVES (NEW)
------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE settlement_status_enum AS ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS settlements (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "driver_id" UUID NOT NULL REFERENCES users(id),
    "amount" DECIMAL(10,2) NOT NULL,
    "razorpay_order_id" VARCHAR,
    "razorpay_payment_id" VARCHAR,
    "status" settlement_status_enum DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    CREATE TYPE incentive_type_enum AS ENUM('driver_trip_milestone', 'rider_trip_milestone', 'driver_peak_hours', 'referral_bonus');
    CREATE TYPE incentive_status_enum AS ENUM('active', 'claimed', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS incentives (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES users(id),
    "type" incentive_type_enum NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "reward_amount" DECIMAL(8,2) DEFAULT 0,
    "reward_coins" INTEGER DEFAULT 0,
    "current_progress" INTEGER DEFAULT 0,
    "target_progress" INTEGER DEFAULT 0,
    "status" incentive_status_enum DEFAULT 'active',
    "expires_at" TIMESTAMPTZ,
    "claimed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 🔟 RIDE METADATA (NEW)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ride_rejections (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ride_id" UUID NOT NULL REFERENCES rides(id),
    "driver_id" UUID NOT NULL REFERENCES users(id),
    "rejected_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ride_routes (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ride_id" UUID NOT NULL REFERENCES rides(id),
    "latitude" DECIMAL(10,6) NOT NULL,
    "longitude" DECIMAL(10,6) NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorite_drivers (
    "id" SERIAL PRIMARY KEY,
    "rider_id" UUID NOT NULL REFERENCES users(id),
    "driver_id" UUID NOT NULL REFERENCES users(id),
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rider_id, driver_id)
);

-- =========================================================
-- 🎉 MIGRATION COMPLETE — SCHEMA SYNCED WITH ENTITIES!
-- =========================================================
