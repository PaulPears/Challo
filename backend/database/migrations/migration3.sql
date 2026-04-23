-- =========================================================
-- 🚀 RIDE ANDHRA – MIGRATION: Entity/Schema Sync (V5)
-- =========================================================

-- 1️⃣ USERS TABLE UPDATES
------------------------------------------------------------
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS password VARCHAR(255),
    ADD COLUMN IF NOT EXISTS push_token VARCHAR(255),
    ADD COLUMN IF NOT EXISTS roles text[] DEFAULT '{"rider"}';

-- (Optional) Migration of old single 'role' to 'roles' array if tables exist
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

-- Update payment_method enum to include 'online' if needed
DO $$ 
BEGIN
    ALTER TYPE payment_method_enum ADD VALUE IF NOT EXISTS 'online';
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

-- =========================================================
-- 🎉 MIGRATION COMPLETE — SCHEMA SYNCED WITH ENTITIES!
-- =========================================================
