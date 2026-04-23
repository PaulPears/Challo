const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function runSql() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    const sql = `
    CREATE TABLE IF NOT EXISTS "driver_bank_details" (
        "user_id" uuid PRIMARY KEY,
        "bank_name" varchar(100) NOT NULL,
        "account_number" varchar(50) NOT NULL,
        "ifsc_code" varchar(20) NOT NULL,
        "account_holder_name" varchar(100) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_driver_bank_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    );

    DO $$ BEGIN
        CREATE TYPE "withdrawal_requests_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "withdrawal_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "driver_id" uuid NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "status" "withdrawal_requests_status_enum" DEFAULT 'PENDING',
        "bank_snapshot" jsonb,
        "admin_note" text,
        "processed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_withdrawal_driver" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE CASCADE
    );
    `;

    try {
        console.log('Connecting to DB to run manual table creation SQL...');
        await client.connect();
        await client.query(sql);
        console.log('✅ Tables created/verified successfully.');
    } catch (error) {
        console.error('❌ SQL execution failed:', error.message);
    } finally {
        await client.end();
    }
}

runSql();
