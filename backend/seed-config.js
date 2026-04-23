const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:8520894522@localhost:5432/ride_andhra';

async function seed() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    console.log('--- Updating Table Schemas ---');
    
    // Ensure subscription_plans has all required columns
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        duration_days INTEGER NOT NULL
      );
    `);
    
    await client.query('ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS description TEXT;');
    await client.query('ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS features JSONB;');
    await client.query('ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;');
    await client.query('ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;');
    await client.query('ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');
    await client.query('ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');

    // System settings table for config
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

    console.log('--- Seeding Subscription Plans ---');
    const plans = [
      {
        id: 'daily_express',
        name: 'Daily Express',
        price: 24,
        duration_days: 1,
        description: 'Perfect for a trial run. Zero commission on all rides.',
        features: JSON.stringify(['24-hour access', 'Unlimited rides', 'Priority support']),
        is_popular: false
      },
      {
        id: 'weekly_pro',
        name: 'Weekly Pro',
        price: 149,
        duration_days: 7,
        description: 'Best for regular drivers. Maximize your weekly earnings.',
        features: JSON.stringify(['7-day access', 'Unlimited rides', 'Exclusive high-demand zones', '24/7 support']),
        is_popular: true
      },
      {
        id: 'monthly_elite',
        name: 'Monthly Elite',
        price: 549,
        duration_days: 30,
        description: 'Maximum savings for full-time professionals.',
        features: JSON.stringify(['30-day access', 'Unlimited rides', 'Early access to new features', 'VIP support', 'Monthly stats report']),
        is_popular: false
      }
    ];

    // Clear out any legacy plans not in our current list
    const activePlanIds = plans.map(p => p.id);
    await client.query(
      `DELETE FROM subscription_plans WHERE id NOT IN (${activePlanIds.map((_, i) => `$${i + 1}`).join(', ')})`,
      activePlanIds
    );

    for (const plan of plans) {
      await client.query(
        `INSERT INTO subscription_plans (id, name, price, duration_days, description, features, is_popular) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name,
         price = EXCLUDED.price, 
         description = EXCLUDED.description, 
         features = EXCLUDED.features, 
         is_popular = EXCLUDED.is_popular,
         is_active = true`,
        [plan.id, plan.name, plan.price, plan.duration_days, plan.description, plan.features, plan.is_popular]
      );
    }

    console.log('--- Seeding System Settings ---');
    const settings = [
      {
        key: 'min_driver_app_version',
        value: '1.0.0',
        description: 'Minimum required version for the driver app'
      },
      {
        key: 'min_rider_app_version',
        value: '1.0.0',
        description: 'Minimum required version for the rider app'
      },
      {
        key: 'latest_driver_app_version',
        value: '1.0.0',
        description: 'Latest available version for the driver app'
      },
      {
        key: 'privacy_policy_driver',
        value: 'Your privacy is important to Ride Andhra. We collect location data to match you with rides...',
        type: 'text'
      },
      {
        key: 'privacy_policy_rider',
        value: 'Ride Andhra collects your pickup and drop-off locations to provide fare estimates and match you with drivers...',
        type: 'text'
      },
      {
        key: 'terms_and_conditions_driver',
        value: 'By using Ride Andhra Driver App, you agree to provide accurate vehicle information and maintain safety...',
        type: 'text'
      },
      {
        key: 'terms_and_conditions_rider',
        value: 'By using Ride Andhra Rider App, you agree that fares are estimates and you will pay drivers directly...',
        type: 'text'
      },
      {
        key: 'support_contact_whatsapp',
        value: '+918374950475',
        description: 'WhatsApp support contact'
      },
      {
        key: 'support_email',
        value: 'help.rideandhra@gmail.com',
        description: 'Primary support email'
      },
      {
        key: 'support_phone',
        value: '+91 8374277617',
        description: 'Primary support helpline'
      },
      {
        key: 'support_office_address',
        value: 'RideAndhra HQ, Kadapa, Andhra Pradesh, India',
        description: 'Main office address'
      }
    ];

    for (const setting of settings) {
      await client.query(
        `INSERT INTO system_settings (key, value, description, type) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (key) DO UPDATE SET 
         value = EXCLUDED.value, 
         description = EXCLUDED.description`,
        [setting.key, setting.value, setting.description, setting.type || 'text']
      );
    }

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    await client.end();
  }
}

seed();
