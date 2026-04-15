/**
 * RideAndhra Dev Token Generator
 * Generates a valid JWT token for any existing user in the database.
 *
 * Usage:
 *   node get-token.js                          -> lists all riders
 *   node get-token.js --phone=917386780455     -> token for that phone
 *   node get-token.js --role=rider             -> token for first rider
 *   node get-token.js --role=driver            -> token for first driver
 */

require('dotenv').config();
const { Client } = require('pg');
const jwt = require('jsonwebtoken');

const DB_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

const PHONE = process.argv.find(a => a.startsWith('--phone='))?.split('=')[1];
const ROLE  = process.argv.find(a => a.startsWith('--role='))?.split('=')[1]?.toLowerCase() || 'rider';

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  let rows;
  if (PHONE) {
    const clean = PHONE.startsWith('91') && PHONE.length > 10 ? PHONE.slice(2) : PHONE;
    const res = await client.query(
      `SELECT id, phone_number, name, roles FROM "users" WHERE phone_number = $1 LIMIT 1`,
      [clean]
    );
    rows = res.rows;
  } else {
    // Find first user with matching role
    const res = await client.query(
      `SELECT id, phone_number, name, roles FROM "users" 
       WHERE roles::text ILIKE $1 
       ORDER BY created_at ASC LIMIT 10`,
      [`%${ROLE}%`]
    );
    rows = res.rows;
  }

  await client.end();

  if (rows.length === 0) {
    console.error(`❌ No user found. Make sure a ${ROLE} has logged in to the app at least once.`);
    process.exit(1);
  }

  if (!PHONE && rows.length > 1) {
    console.log(`\n📋 Found ${rows.length} ${ROLE}(s):\n`);
    rows.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.phone_number} — ${u.name || '(no name)'} [${u.id}]`);
    });
    console.log('\n👉 Re-run with: node get-token.js --phone=<phone>\n');
  }

  // Generate token for first user (or the specific one)
  const user = rows[0];
  const payload = {
    sub: user.id,
    phoneNumber: user.phone_number,
    roles: user.roles,
    name: user.name || '',
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  console.log('\n✅ JWT Token generated for:');
  console.log(`   Phone : ${user.phone_number}`);
  console.log(`   Name  : ${user.name || '(no name)'}`);
  console.log(`   Role  : ${JSON.stringify(user.roles)}`);
  console.log(`   ID    : ${user.id}`);
  console.log('\n📋 Your token:\n');
  console.log(token);
  console.log('\n🚀 Run the simulation:\n');
  console.log(`   node simulate-ride.js --token=${token}\n`);
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
