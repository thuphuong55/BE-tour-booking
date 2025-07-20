const axios = require('axios');

async function simpleTest() {
    try {
        // Login
        const loginRes = await axios.post('http://localhost:5011/api/auth/login', {
            email: 'admin@test.com',
            password: 'admin123'
        });
        
        const token = loginRes.data.token;
        console.log('✅ Login success');
        
        // Get tours
        const toursRes = await axios.get('http://localhost:5011/api/admin/tours?page=1&limit=2', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Get tours success');
        console.log('Response keys:', Object.keys(toursRes.data));
        console.log('Data keys:', Object.keys(toursRes.data.data));
        console.log('Tours length:', toursRes.data.data.tours?.length);
        
        if (toursRes.data.data.tours && toursRes.data.data.tours.length > 0) {
            const tour = toursRes.data.data.tours[0];
            console.log('First tour:', {
                id: tour.id,
                name: tour.name,
                price: tour.price
            });
            
            // Test update
            const updateRes = await axios.put(`http://localhost:5011/api/admin/tours/${tour.id}`, {
                name: `${tour.name} - ADMIN UPDATED`,
                price: tour.price + 50000
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('✅ Update success!');
            console.log('Updated tour name:', updateRes.data.tour.name);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

simpleTest();
