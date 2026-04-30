const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:8520894522@localhost:5432/ride_andhra';

async function checkSurgeEvents() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    const res = await client.query(`SELECT * FROM surge_events`);
    console.log('Surge Events:');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error checking surge events:', err);
  } finally {
    await client.end();
  }
}

checkSurgeEvents();
