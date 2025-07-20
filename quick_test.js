const axios = require('axios');

async function quickTest() {
    try {
        console.log('Testing admin login...');
        const loginRes = await axios.post('http://localhost:5011/api/auth/login', {
            email: 'admin@test.com',
            password: 'admin123'
        }, { timeout: 5000 });
        
        console.log('✅ Admin login:', loginRes.status);
        
        const token = loginRes.data.token;
        const toursRes = await axios.get('http://localhost:5011/api/admin/tours?page=1&limit=1', {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000
        });
        
        console.log('✅ Get tours:', toursRes.status);
        console.log('Tours count:', toursRes.data.data?.tours?.length);
        
    } catch (error) {
        console.error('❌ Error:', error.code || error.message);
        if (error.response) {
            console.error('Response:', error.response.status, error.response.data);
        }
    }
}

quickTest();
