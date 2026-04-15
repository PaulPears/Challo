const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USERNAME || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'ride_andhra',
  password: process.env.DB_PASSWORD || 'admin',
  port: parseInt(process.env.DB_PORT) || 5432,
});

async function run() {
  try {
    await client.connect();
    
    // Check user roles
    const res = await client.query("SELECT id, roles FROM users WHERE phone_number = '8374950475'");
    console.log('Current roles:', res.rows[0]?.roles);
    
    // Update role
    await client.query("UPDATE users SET roles = ARRAY['rider', 'driver'] WHERE phone_number = '8374950475'");
    console.log('✅ Updated roles for user 8374950475 to [rider, driver]');
    
    // Verify Update
    const check = await client.query("SELECT roles FROM users WHERE phone_number = '8374950475'");
    console.log('New roles:', check.rows[0]?.roles);
    
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.end();
  }
}

run();
