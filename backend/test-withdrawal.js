const axios = require('axios');

async function testWithdrawal() {
    const API_URL = 'http://localhost:3000';
    const driverToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNGFkNTI0NC0yNzk0LTQwNzMtOTA4ZC1jNWEyNmExZDRjODEiLCJwaG9uZU51bWJlciI6IjgzNzQ5NTA0NzUiLCJyb2xlcyI6Intkcml2ZXIsYWRtaW4scmlkZXJ9IiwibmFtZSI6InByYXZlZW4gS3VtYXIiLCJpYXQiOjE3NzY4OTExMjQsImV4cCI6MTc3NzQ5NTkyNH0.9XG6CPAJyyeSOUfel3EY9nGSzEhomK6IVoirl6TBSQU';

    const config = {
        headers: { Authorization: `Bearer ${driverToken}` }
    };

    try {
        console.log('1. Setting up bank details...');
        await axios.post(`${API_URL}/payments/bank-details`, {
            bank_name: 'HDFC',
            account_number: '1234567890',
            ifsc_code: 'HDFC0001234',
            account_holder_name: 'Praveen Kumar'
        }, config);
        console.log('✅ Bank details saved.');

        console.log('\n2. Fetching current balance...');
        const walletResp = await axios.get(`${API_URL}/payments/wallet`, config);
        console.log(`💰 Current Balance: ₹${walletResp.data.balance}, Rewards: ₹${walletResp.data.reward_balance}`);

        console.log('\n3. Requesting withdrawal of ₹100...');
        const withdrawResp = await axios.post(`${API_URL}/payments/withdraw`, { amount: 100 }, config);
        console.log('✅ Withdrawal requested successfully. ID:', withdrawResp.data.id);

        console.log('\n4. Checking withdrawal history...');
        const historyResp = await axios.get(`${API_URL}/payments/withdrawals`, config);
        console.log('📋 Last Request:', historyResp.data[0]);

        console.log('\n5. Checking updated balance...');
        const walletResp2 = await axios.get(`${API_URL}/payments/wallet`, config);
        console.log(`💰 Updated Balance: ₹${walletResp2.data.balance}, Rewards: ₹${walletResp2.data.reward_balance}`);

    } catch (error) {
        if (error.response) {
            console.error('❌ Test failed:', error.response.status, error.response.data);
        } else {
            console.error('❌ Test failed:', error.message);
        }
    }
}

testWithdrawal();
