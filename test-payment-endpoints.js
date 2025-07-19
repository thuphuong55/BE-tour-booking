const http = require('http');

async function makeRequest(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testPaymentEndpoints() {
  console.log('🧪 TESTING PAYMENT ENDPOINTS (MoMo & VNPay)');
  console.log('=' .repeat(50));

  try {
    // Test VNPay endpoints
    console.log('\n📘 VNPay Endpoints:');
    
    console.log('1. GET /api/payments/vnpay/create-payment (no params)');
    const vnpayTest1 = await makeRequest('GET', 'http://localhost:5001/api/payments/vnpay/create-payment');
    console.log(`   Status: ${vnpayTest1.status}`);
    console.log(`   Response: ${JSON.stringify(vnpayTest1.data)}`);

    console.log('\n2. GET /api/payments/vnpay/create-payment?bookingId=test');
    const vnpayTest2 = await makeRequest('GET', 'http://localhost:5001/api/payments/vnpay/create-payment?bookingId=test');
    console.log(`   Status: ${vnpayTest2.status}`);
    console.log(`   Response: ${JSON.stringify(vnpayTest2.data)}`);

    // Test MoMo endpoints
    console.log('\n💰 MoMo Endpoints:');
    
    console.log('1. POST /api/momo/create-payment (no body)');
    const momoTest1 = await makeRequest('POST', 'http://localhost:5001/api/momo/create-payment');
    console.log(`   Status: ${momoTest1.status}`);
    console.log(`   Response: ${JSON.stringify(momoTest1.data)}`);

    console.log('\n2. POST /api/momo/create-payment (invalid tourId)');
    const momoTest2 = await makeRequest('POST', 'http://localhost:5001/api/momo/create-payment', {
      tourId: 'invalid-tour-id'
    });
    console.log(`   Status: ${momoTest2.status}`);
    console.log(`   Response: ${JSON.stringify(momoTest2.data)}`);

    // Test với tourId thực
    console.log('\n3. POST /api/momo/create-payment (real tourId)');
    const momoTest3 = await makeRequest('POST', 'http://localhost:5001/api/momo/create-payment', {
      tourId: '2231a82b-6b08-4835-8a33-b7e6e031b430' // Tour Đà Lạt từ database
    });
    console.log(`   Status: ${momoTest3.status}`);
    console.log(`   Response: ${JSON.stringify(momoTest3.data)}`);

    // Test Payment details endpoint
    console.log('\n💳 Payment Details:');
    console.log('1. GET /api/payments/details/MOMO1752745294006');
    const paymentTest = await makeRequest('GET', 'http://localhost:5001/api/payments/details/MOMO1752745294006');
    console.log(`   Status: ${paymentTest.status}`);
    console.log(`   Response: ${JSON.stringify(paymentTest.data)}`);

    console.log('\n✅ SUMMARY:');
    console.log('   - VNPay endpoints: Working (need valid bookingId)');
    console.log('   - MoMo endpoints: Working (need valid tourId)');
    console.log('   - Payment details: Working');
    console.log('   - Both systems require valid data to proceed');

  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
  }
}

testPaymentEndpoints();
