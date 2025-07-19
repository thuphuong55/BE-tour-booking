const { sequelize, Promotion } = require('./models');

async function checkPromotions() {
  try {
    const promotions = await Promotion.findAll();
    console.log('=== PROMOTION DATA ===');
    
    promotions.forEach((p, index) => {
      console.log(`${index + 1}. Code: ${p.code}`);
      console.log(`   Discount: ${p.discount_amount}`);
      console.log(`   Description: ${p.description}`);
      console.log(`   Start: ${p.start_date}`);
      console.log(`   End: ${p.end_date}`);
      console.log('   ---');
    });
    
    if (promotions.length === 0) {
      console.log('No promotions found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkPromotions();
