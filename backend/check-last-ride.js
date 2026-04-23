const { Client } = require('pg');
require('dotenv').config();

async function checkLastRide() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('--- Checking Last Super KM Ride Details ---');
    const res = await client.query(`
      SELECT 
        id, 
        status, 
        estimated_fare, 
        final_fare, 
        rider_payable, 
        company_payable, 
        super_km_applied, 
        super_km_discount 
      FROM rides 
      WHERE super_km_applied > 0 
      ORDER BY created_at DESC 
      LIMIT 1;
    `);

    if (res.rows.length === 0) {
      console.log('❌ NO Super KM rides found in database!');
    } else {
      console.log('✅ Last Super KM Ride:', JSON.stringify(res.rows[0], null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkLastRide();
