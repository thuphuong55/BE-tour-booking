const { Payment, Booking } = require('./models');

async function checkPayment() {
  try {
    const orderId = 'MOMO1752745294006';
    
    console.log('🔍 Searching for payment with order_id:', orderId);
    
    const payment = await Payment.findOne({
      where: { order_id: orderId }
    });
    
    if (payment) {
      console.log('✅ Found payment:');
      console.log('   ID:', payment.id);
      console.log('   Order ID:', payment.order_id);
      console.log('   Amount:', payment.amount);
      console.log('   Status:', payment.status);
      console.log('   Method:', payment.payment_method);
      console.log('   Booking ID:', payment.booking_id);
    } else {
      console.log('❌ No payment found with order_id:', orderId);
      
      // Tìm các payments gần đây
      const recentPayments = await Payment.findAll({
        attributes: ['id', 'order_id', 'amount', 'status', 'payment_method'],
        limit: 10,
        order: [['created_at', 'DESC']]
      });
      
      console.log('\n📋 Recent payments in database:');
      recentPayments.forEach((p, index) => {
        console.log(`   ${index + 1}. Order ID: ${p.order_id || 'NULL'} | Status: ${p.status} | Amount: ${p.amount}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

checkPayment();
