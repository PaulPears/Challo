const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:8520894522@localhost:5432/ride_andhra';

async function listTables() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in database:');
    res.rows.forEach(row => console.log('- ' + row.table_name));
  } catch (err) {
    console.error('Error listing tables:', err);
  } finally {
    await client.end();
  }
}

listTables();
