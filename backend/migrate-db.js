const { Client } = require('pg');

async function migrate() {
  const connectionString = 'postgresql://postgres:8520894522@localhost:5432/ride_andhra';
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database');

    // Add push_token to users
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS push_token VARCHAR(255)
    `);
    console.log('Checked push_token in users table');

    // Ensure is_online, subscription_expiry and location columns exist in driver_profiles
    await client.query(`
      ALTER TABLE driver_profiles 
      ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMP,
      ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10, 6),
      ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(10, 6)
    `);
    console.log('Checked columns in driver_profiles table');

    // Ensure subscription_sales table exists and has all columns
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        driver_id UUID NOT NULL REFERENCES users(id),
        plan_id VARCHAR(50) NOT NULL,
        amount_paid DECIMAL(12, 2) NOT NULL,
        tax_amount DECIMAL(12, 2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        sale_type VARCHAR(30) DEFAULT 'paid',
        valid_until TIMESTAMP,
        payment_id VARCHAR(255),
        order_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Checked subscription_sales table');

    // Add missing columns if table already existed
    await client.query(`
      ALTER TABLE subscription_sales 
      ADD COLUMN IF NOT EXISTS sale_type VARCHAR(30) DEFAULT 'paid',
      ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS order_id VARCHAR(255)
    `);
    console.log('Ensured missing columns in subscription_sales table');

    // Add super_km_balance to rider_profiles
    await client.query(`
      ALTER TABLE rider_profiles 
      ADD COLUMN IF NOT EXISTS super_km_balance DECIMAL(10, 2) DEFAULT 0
    `);
    console.log('Checked super_km_balance in rider_profiles table');

    // Add financial breakdown columns to rides
    await client.query(`
      ALTER TABLE rides 
      ADD COLUMN IF NOT EXISTS super_km_applied DECIMAL(8, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS super_km_discount DECIMAL(8, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS rider_payable DECIMAL(8, 2),
      ADD COLUMN IF NOT EXISTS company_payable DECIMAL(8, 2)
    `);
    console.log('Checked Super KM columns in rides table');

    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
