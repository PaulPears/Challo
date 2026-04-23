const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:8520894522@localhost:5432/ride_andhra' });

async function run() {
  await client.connect();
  try {
    // Force inject vehicle details into Praveen's account and any other empty account
    await client.query(`
      UPDATE driver_profiles 
      SET 
        vehicle_model = 'Bajaj Pulsar 150',
        vehicle_plate_number = 'AP 39 ZQ 5555',
        vehicle_color = 'Midnight Black'
      WHERE vehicle_model IS NULL
    `);
    console.log("Successfully injected fake vehicle data into all empty accounts.");
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
