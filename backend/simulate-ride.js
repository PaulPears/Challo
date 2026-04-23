/**
 * Simulation Script for RideAndhra
 * This script allows you to inject a dummy ride request into the system.
 * 
 * Usage: node simulate-ride.js --token <USER_JWT_TOKEN> --riderId <RIDER_ID> --lat <LAT> --lng <LNG>
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000'; // Change to your server URL if different

const TOKEN = process.argv.find(a => a.startsWith('--token='))?.split('=')[1];
const RIDER_ID = process.argv.find(a => a.startsWith('--riderId='))?.split('=')[1] || 'default-rider-id';
const LAT = parseFloat(process.argv.find(a => a.startsWith('--lat='))?.split('=')[1]) || 14.6819; // Anantapur
const LNG = parseFloat(process.argv.find(a => a.startsWith('--lng='))?.split('=')[1]) || 77.6006;

const dummyRide = {
    pickup_latitude: LAT,
    pickup_longitude: LNG,
    pickup_address: 'Clock Tower, Anantapur, AP',
    dropoff_latitude: LAT + 0.02,
    dropoff_longitude: LNG + 0.02,
    dropoff_address: 'JNTU Anantapur, AP',
    fare: 150.00,
    distance: 4.5,
    duration: 25,
    vehicle_type: 'auto'
};

async function simulate() {
    console.log('--- RideAndhra Simulation Tool ---');

    if (!TOKEN) {
        console.warn('⚠️ No token provided. Attempting unauthenticated request...');
    }

    try {
        const config = TOKEN ? { headers: { Authorization: `Bearer ${TOKEN}` } } : {};
        const response = await axios.post(`${API_URL}/rides`, dummyRide, config);

        console.log('✅ Success! Ride Request Created.');
        console.log('Ride ID:', response.data.id);
        console.log('Status:', response.data.status);
        console.log('OTP (PIN):', response.data.otp);
        console.log(`Open the Driver App and stay "Online" near ${LAT}, ${LNG} to receive it.`);
    } catch (error) {
        console.error('❌ Simulation failed:', error.response?.data?.message || error.message);
        if (error.response?.status === 401) {
            console.log('\nHow to fix:');
            console.log('1. Log in to the Rider App.');
            console.log('2. Look at the console/terminal logs of the Rider App.');
            console.log('3. Copy the JWT token and use it like this:');
            console.log('   node simulate-ride.js --token=YOUR_TOKEN_HERE');
        }
    }
}

simulate();
