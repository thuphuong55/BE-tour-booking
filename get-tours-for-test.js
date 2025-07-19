const http = require('http');

// Test để lấy danh sách tours có thể dùng để test booking
async function getTourList() {
  console.log('🔍 Getting tour list for testing...\n');
  
  try {
    // 1. Login admin
    console.log('1️⃣ Admin login...');
    const loginOptions = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    
    const loginData = JSON.stringify({
      email: 'admin12@gmail.com', 
      password: 'admin123'
    });
    
    const loginResult = await makeRequest(loginOptions, loginData);
    
    if (loginResult.status !== 200) {
      throw new Error('Login failed');
    }
    
    const token = loginResult.data.token;
    console.log('✅ Login successful');
    
    // 2. Get tours without auth first
    console.log('\n2️⃣ Getting tours...');
    const tourOptions = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/tours',
      method: 'GET'
    };
    
    const tourResult = await makeRequest(tourOptions);
    
    if (tourResult.status === 200) {
      console.log('✅ Found tours:');
      const tours = tourResult.data.data || tourResult.data.tours || [];
      
      if (tours.length > 0) {
        tours.forEach((tour, index) => {
          console.log(`   ${index + 1}. ID: ${tour.id}`);
          console.log(`      Name: ${tour.name}`);
          console.log(`      Price: ${tour.price?.toLocaleString()} VNĐ`);
          console.log(`      Location: ${tour.location}`);
          console.log(`      Agency: ${tour.agency_id}`);
          console.log('');
        });
        
        // Lấy departure dates cho tour đầu tiên
        const firstTour = tours[0];
        console.log(`\n3️⃣ Getting departure dates for tour: ${firstTour.name}...`);
        
        const departureOptions = {
          hostname: 'localhost',
          port: 5001,
          path: `/api/tours/${firstTour.id}/departure-dates`,
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        };
        
        const departureResult = await makeRequest(departureOptions);
        
        if (departureResult.status === 200) {
          const departures = departureResult.data.data || departureResult.data.departureDates || [];
          console.log('✅ Available departure dates:');
          
          departures.forEach((dep, idx) => {
            console.log(`   ${idx + 1}. ID: ${dep.id}`);
            console.log(`      Date: ${dep.departure_date}`);
            console.log(`      Available: ${dep.available_slots || 'N/A'}`);
            console.log('');
          });
          
          if (departures.length > 0) {
            console.log('📋 Sample booking data for testing:');
            console.log('```json');
            console.log(JSON.stringify({
              user_id: "cef03e0b-05a6-40b2-9119-eb15456d28db",
              tour_id: firstTour.id,
              departure_date_id: departures[0].id,
              total_price: firstTour.price,
              number_of_adults: 2,
              number_of_children: 0,
              status: "pending",
              guests: [
                {
                  name: "Nguyễn Văn Test",
                  email: "test@gmail.com",
                  phone: "0123456789",
                  id_number: "123456789",
                  birth_date: "1990-01-01",
                  gender: "male"
                }
              ]
            }, null, 2));
            console.log('```');
          }
          
        } else {
          console.log('❌ Could not get departure dates');
        }
        
      } else {
        console.log('   No tours found in database');
      }
      
    } else {
      console.log('❌ Could not get tours:', tourResult.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n🎯 Tour list retrieval completed!');
}

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (err) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

getTourList();
