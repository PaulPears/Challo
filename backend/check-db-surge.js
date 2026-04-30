const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:8520894522@localhost:5432/ride_andhra';

async function checkTables() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    const tables = ['peak_hour_surges', 'surge_events', 'fare_settings'];
    for (const table of tables) {
      try {
        const res = await client.query(`SELECT count(*) FROM ${table}`);
        console.log(`Table ${table} exists and has ${res.rows[0].count} rows.`);
        
        if (parseInt(res.rows[0].count) > 0) {
           const data = await client.query(`SELECT * FROM ${table} LIMIT 5`);
           console.log(`Sample data from ${table}:`);
           console.log(JSON.stringify(res.rows, null, 2));
        }
      } catch (e) {
        console.log(`Table ${table} DOES NOT EXIST or error: ${e.message}`);
      }
    }
  } finally {
    await client.end();
  }
}

checkTables();
