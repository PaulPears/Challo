const { Client } = require('pg');
require('dotenv').config();

async function checkSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('--- Checking "rides" table columns ---');
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'rides'
      AND column_name IN ('super_km_applied', 'super_km_discount', 'rider_payable', 'company_payable');
    `);
    
    if (res.rows.length === 0) {
      console.log('❌ NO Super KM columns found in "rides" table!');
    } else {
      console.log('✅ Found columns:');
      res.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkSchema();
