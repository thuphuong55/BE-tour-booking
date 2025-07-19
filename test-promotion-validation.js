const axios = require('axios');

async function testPromotionValidation() {
  try {
    console.log('=== TEST PROMOTION CODE VALIDATION ===\n');
    
    // Test các trường hợp khác nhau
    const testCases = [
      { code: 'SUMMER2025', price: 5800000, description: 'Đúng chính xác' },
      { code: 'SUMMMER2025', price: 5800000, description: 'Có 3 chữ M (lỗi typo)' },
      { code: 'summer2025', price: 5800000, description: 'Viết thường' },
      { code: 'SUMMER2025 ', price: 5800000, description: 'Có space phía sau' },
      { code: ' SUMMER2025', price: 5800000, description: 'Có space phía trước' }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      const test = testCases[i];
      console.log(`${i + 1}. Testing: "${test.code}" (${test.description})`);
      
      try {
        const response = await axios.post('http://localhost:5001/api/bookings/validate-promotion', {
          promotion_code: test.code,
          tour_price: test.price
        });
        
        console.log(`   ✅ SUCCESS - Valid: ${response.data.valid}`);
        if (response.data.promotion) {
          console.log(`   📝 Found: ${response.data.promotion.code}`);
          console.log(`   💰 Discount: ${response.data.pricing?.discount_amount?.toLocaleString()} VND`);
        }
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.response?.data?.error || error.message}`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPromotionValidation();
