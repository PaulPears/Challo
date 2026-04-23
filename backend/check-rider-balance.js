const { Client } = require('pg');
require('dotenv').config();

async function checkBalance() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    // User ID extracted from the token the user used in the terminal
    const userId = '4fdf166e-a307-482d-ba04-05a2ddc7f705'; 
    console.log(`--- Checking balance for User ${userId} ---`);
    const res = await client.query(`
      SELECT super_km_balance FROM rider_profiles WHERE user_id = $1;
    `, [userId]);
    
    if (res.rows.length === 0) {
      console.log('❌ Rider profile NOT found!');
    } else {
      console.log(`✅ Current Super KM Balance: ${res.rows[0].super_km_balance} KM`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkBalance();
