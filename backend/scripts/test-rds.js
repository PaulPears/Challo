const { Client } = require('pg');

const databaseUrl = 'postgresql://postgres:8520894522@database-2.ca7woeg2wmuh.us-east-1.rds.amazonaws.com:5432/postgres';

async function testConnection() {
  console.log('Testing connection to:', databaseUrl.replace(/:([^:@]+)@/, ':****@'));
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Successfully connected to the database!');
    const res = await client.query('SELECT current_database(), current_user');
    console.log('Connection info:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    if (err.message.includes('self signed certificate')) {
      console.log('Tip: Try setting DB_SSL_REJECT_UNAUTHORIZED=false');
    }
    if (err.message.includes('timeout') || err.message.includes('ETIMEDOUT')) {
      console.log('Tip: Check your RDS Security Group and VPC settings. Ensure App Runner can access the RDS instance.');
    }
  }
}

testConnection();
