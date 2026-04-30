const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:8520894522@localhost:5432/ride_andhra';

async function findTable() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    const res = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name ILIKE '%surge%' OR table_name ILIKE '%peak%'
    `);
    console.log('Matching tables:');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

findTable();
