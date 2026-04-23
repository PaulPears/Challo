/**
 * Super Kilometer Ride Simulation Tool
 * This script simulates a full ride lifecycle with Super KM discounts.
 * 
 * Flow: Booking -> Acceptance -> Start (PIN) -> Completion -> Financial Audit
 * 
 * Usage: 
 * node simulate-super-km.js --riderToken=<RIDER_JWT> --driverToken=<DRIVER_JWT> [--km=5]
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000';

const RIDER_TOKEN = process.argv.find(a => a.startsWith('--riderToken='))?.split('=')[1];
const DRIVER_TOKEN = process.argv.find(a => a.startsWith('--driverToken='))?.split('=')[1];
const RIDE_KM = parseFloat(process.argv.find(a => a.startsWith('--km='))?.split('=')[1]) || 5.0;

if (!RIDER_TOKEN || !DRIVER_TOKEN) {
    console.error('❌ Error: Both --riderToken and --driverToken are required.');
    process.exit(1);
}

const riderConfig = { headers: { Authorization: `Bearer ${RIDER_TOKEN}` } };
const driverConfig = { headers: { Authorization: `Bearer ${DRIVER_TOKEN}` } };

// Role Validation
function validateTokens() {
    try {
        const decode = (token) => JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        const riderData = decode(RIDER_TOKEN);
        const driverData = decode(DRIVER_TOKEN);

        console.log(`Rider: ${riderData.phoneNumber} (Roles: ${riderData.roles})`);
        console.log(`Driver: ${driverData.phoneNumber} (Roles: ${driverData.roles})`);

        if (!riderData.roles.includes('rider')) {
            console.error('❌ Error: Rider token does not have "rider" role.');
            process.exit(1);
        }
        if (!driverData.roles.includes('driver')) {
            console.error('❌ Error: Driver token does not have "driver" role. (Did you pass the same token twice?)');
            process.exit(1);
        }
    } catch (e) {
        console.warn('⚠️ Could not validate token roles, proceeding anyway...');
    }
}

validateTokens();

async function runSimulation() {
    console.log('\n--- 🚀 Starting Super KM Ride Simulation ---\n');

    try {
        // 0. Credit Rider Balance (New Step to ensure backend applies discount)
        console.log('Step 0: Ensuring Rider has Super KM Balance...');
        const { Client } = require('pg');
        require('dotenv').config();
        const client = new Client({ connectionString: process.env.DATABASE_URL });
        await client.connect();
        // Credit the rider used in the test (based on token)
        const riderId = '4fdf166e-a307-482d-ba04-05a2ddc7f705'; 
        await client.query('UPDATE rider_profiles SET super_km_balance = GREATEST(super_km_balance, 50.0) WHERE user_id = $1', [riderId]);
        await client.end();
        console.log('✅ Rider Balance ready.');

        // 1. Get Fare Estimate
        console.log(`\nStep 1: Fetching fare estimate for ${RIDE_KM} KM...`);
        const estimateResp = await axios.post(`${API_URL}/rides/fare`, {
            distance: RIDE_KM * 1000,
            duration: RIDE_KM * 60,
            vehicleType: 'auto',
            superKmBalance: 50 // Match the credited amount
        }, riderConfig);

        const estimate = estimateResp.data;
        console.log(`✅ Estimate Received:`);
        console.log(`   Base Fare: ₹${estimate.totalFare}`);
        console.log(`   Super KM Discount: -₹${estimate.superKmDiscount} (${estimate.superKmApplied} KM applied)`);
        console.log(`   Rider Payable: ₹${estimate.riderPayable}`);
        console.log(`   Company Payable: ₹${estimate.companyPayable}`);

        // 2. Create Ride
        console.log('\nStep 2: Creating Ride Request with apply_super_km: true...');
        const createResp = await axios.post(`${API_URL}/rides`, {
            pickup_latitude: 14.6819,
            pickup_longitude: 77.6006,
            pickup_address: 'Simulator Pickup',
            dropoff_latitude: 14.6819 + (RIDE_KM * 0.01),
            dropoff_longitude: 77.6006 + (RIDE_KM * 0.01),
            dropoff_address: 'Simulator Dropoff',
            vehicle_type: 'auto',
            distance: RIDE_KM,
            duration: RIDE_KM * 5,
            fare: estimate.totalFare,
            apply_super_km: true
        }, riderConfig);

        const rideId = createResp.data.id;
        const pin = createResp.data.otp;
        console.log(`✅ Ride Created! ID: ${rideId}, PIN: ${pin}`);

        // 3. Driver Accepts Ride
        console.log('\nStep 3: Driver Accepting Ride...');
        await axios.patch(`${API_URL}/rides/${rideId}/accept`, {}, driverConfig);
        console.log('✅ Ride Accepted by Driver.');

        // 4. Driver Starts Ride (Verification)
        console.log(`\nStep 4: Driver Starting Ride with PIN ${pin}...`);
        await axios.patch(`${API_URL}/rides/${rideId}/start`, { pin: pin }, driverConfig);
        console.log('✅ Ride Started.');

        // 5. Driver Completes Ride
        console.log('\nStep 5: Driver Completing Ride...');
        const completeResp = await axios.patch(`${API_URL}/rides/${rideId}/complete`, {}, driverConfig);
        const finalRide = completeResp.data;
        
        // We check the DRIVER'S wallet for the compensation credit
        const walletResp = await axios.get(`${API_URL}/payments/wallet`, driverConfig);
        const wallet = walletResp.data;
        console.log(`\nFinal Wallet Status (Driver):`);
        console.log(`   - Main Balance: ₹${wallet.balance}`);
        console.log(`   - Reward Balance (incl. Compensation): ₹${wallet.reward_balance || wallet.super_km_balance}`);
        
        if (Number(wallet.reward_balance || wallet.super_km_balance || 0) > 0) {
            console.log('✅ SUCCESS: Super KM Compensation credited to dedicated rewards bucket.');
        } else {
            console.log('ℹ️ Note: Compensation not found in rewards bucket. (Check if driver had previous balance)');
        }
        console.log('✅ Ride Completed.');

        // 6. Final Audit (Ensure fields are treated as numbers)
        console.log('\n--- 📊 Final Financial Audit ---');
        const rPayable = Number(finalRide.rider_payable);
        const cPayable = Number(finalRide.company_payable);
        const gst = Number(finalRide.gst_amount);
        const earnings = Number(finalRide.driver_earnings);

        console.log(`Base Fare:        ₹${(rPayable + cPayable).toFixed(2)}`);
        console.log(`Rider Paid:       ₹${rPayable.toFixed(2)}`);
        console.log(`Company Coverage: ₹${cPayable.toFixed(2)} (Super KM)`);
        console.log(`GST (5%):         ₹${gst.toFixed(2)}`);
        console.log(`Driver Earnings:  ₹${earnings.toFixed(2)}`);
        console.log('--------------------------------\n');
        
        console.log('✅ Simulation finished successfully!');

    } catch (error) {
        console.error('\n❌ Simulation Failed!');
        console.error('Error Details:', error.response?.data?.message || error.message);
        if (error.response?.data?.errors) {
            console.error('Validation Errors:', JSON.stringify(error.response.data.errors, null, 2));
        }
    }
}

runSimulation();
