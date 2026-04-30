const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:8520894522@localhost:5432/ride_andhra';

async function seedSurges() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    console.log('--- Ensuring Tables Exist ---');
    
    // Create peak_hour_surges table
    await client.query(`
      CREATE TABLE IF NOT EXISTS peak_hour_surges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        days_of_week JSONB,
        multiplier DECIMAL(5,3) DEFAULT 1.2,
        vehicle_types TEXT,
        latitude DECIMAL(10,6),
        longitude DECIMAL(10,6),
        radius_km DECIMAL(10,2),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create surge_events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS surge_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        start_date TIMESTAMPTZ NOT NULL,
        end_date TIMESTAMPTZ NOT NULL,
        multiplier DECIMAL(5,3) DEFAULT 1.2,
        vehicle_types TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        latitude DECIMAL(10,6),
        longitude DECIMAL(10,6),
        radius_km DECIMAL(10,2),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log('--- Cleaning Old Data ---');
    await client.query('DELETE FROM peak_hour_surges');
    await client.query('DELETE FROM surge_events');

    console.log('--- Seeding Peak Hour Surges ---');
    
    // 1. Midnight Surge (Applies everywhere, all vehicles, 10 PM - 5 AM)
    await client.query(`
      INSERT INTO peak_hour_surges (name, start_time, end_time, days_of_week, multiplier, vehicle_types, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      'Midnight Rush', 
      '22:00:00', 
      '05:00:00', 
      JSON.stringify([0, 1, 2, 3, 4, 5, 6]), 
      1.500, 
      null, // All vehicles
      true
    ]);

    // 2. Morning Peak (Specific to Anantapur, Bike & Auto only, 7 AM - 11 AM)
    await client.query(`
      INSERT INTO peak_hour_surges (name, start_time, end_time, days_of_week, multiplier, vehicle_types, latitude, longitude, radius_km, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      'Morning Office Rush (ATP)', 
      '07:00:00', 
      '11:00:00', 
      JSON.stringify([1, 2, 3, 4, 5]), // Mon-Fri
      1.300, 
      'bike,auto', 
      14.680000, 
      77.600000, 
      10.0, // 10km radius
      true
    ]);

    console.log('--- Seeding Surge Events ---');
    
    // 3. Weekend Special (Next 48 hours)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 48);

    await client.query(`
      INSERT INTO surge_events (name, start_date, end_date, multiplier, is_active)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      'Weekend Demand Spike', 
      startDate, 
      endDate, 
      1.250, 
      true
    ]);

    console.log('✅ Seeding completed successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await client.end();
  }
}

seedSurges();
