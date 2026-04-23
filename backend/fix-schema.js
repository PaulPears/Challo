const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:8520894522@localhost:5432/ride_andhra';

async function fixSchema() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    console.log('--- Fixing Subscription Tables Schema ---');
    
    // 1. Drop the constraint if it exists
    await client.query(`
      ALTER TABLE IF EXISTS driver_subscriptions 
      DROP CONSTRAINT IF EXISTS driver_subscriptions_plan_id_fkey;
    `);

    // 2. Change column types to VARCHAR
    console.log('Changing id to VARCHAR in subscription_plans...');
    await client.query(`
      ALTER TABLE subscription_plans 
      ALTER COLUMN id TYPE VARCHAR;
    `);

    // 3. Re-create system_settings if it failed before
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR PRIMARY KEY,
        value TEXT NOT NULL,
        type VARCHAR DEFAULT 'text',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Schema fixed successfully!');
  } catch (err) {
    console.error('Error fixing schema:', err);
  } finally {
    await client.end();
  }
}

fixSchema();
