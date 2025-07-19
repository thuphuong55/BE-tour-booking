const axios = require('axios');

async function testPromotionDiscount() {
  try {
    console.log('=== TEST PROMOTION DISCOUNT CALCULATION ===\n');
    
    const testData = {
      promotion_code: 'SUMMER2025',
      tour_price: 5800000  // 5,800,000 VND
    };
    
    console.log('Test Data:');
    console.log(`- Promotion Code: ${testData.promotion_code}`);
    console.log(`- Tour Price: ${testData.tour_price.toLocaleString()} VND`);
    console.log('- Expected: 10% discount = 580,000 VND');
    console.log('- Expected Final Price: 5,220,000 VND\n');
    
    const response = await axios.post('http://localhost:5001/api/bookings/validate-promotion', testData);
    
    console.log('API Response:');
    console.log('- Status:', response.status);
    console.log('- Valid:', response.data.valid);
    
    if (response.data.promotion) {
      console.log('\nPromotion Info:');
      console.log(`- Code: ${response.data.promotion.code}`);
      console.log(`- Description: ${response.data.promotion.description}`);
      console.log(`- Discount Amount (stored): ${response.data.promotion.discount_amount}`);
    }
    
    if (response.data.pricing) {
      console.log('\nPricing Calculation:');
      console.log(`- Original Price: ${response.data.pricing.original_price.toLocaleString()} VND`);
      console.log(`- Discount Amount: ${response.data.pricing.discount_amount.toLocaleString()} VND`);
      console.log(`- Final Price: ${response.data.pricing.final_price.toLocaleString()} VND`);
      console.log(`- Savings: ${response.data.pricing.savings.toLocaleString()} VND`);
      
      // Kiểm tra tính toán
      const expectedDiscount = 5800000 * 0.10; // 10%
      const actualDiscount = response.data.pricing.discount_amount;
      
      console.log('\n=== VERIFICATION ===');
      console.log(`Expected Discount: ${expectedDiscount.toLocaleString()} VND`);
      console.log(`Actual Discount: ${actualDiscount.toLocaleString()} VND`);
      
      if (Math.abs(expectedDiscount - actualDiscount) < 1) {
        console.log('✅ DISCOUNT CALCULATION: CORRECT');
      } else {
        console.log('❌ DISCOUNT CALCULATION: INCORRECT');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testPromotionDiscount();
