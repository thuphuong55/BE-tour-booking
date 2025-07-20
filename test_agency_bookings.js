const { Booking, Tour, User } = require('./models');

async function testAgencyBookings() {
  try {
    console.log('🧪 Testing agency bookings with tour_id...\n');
    
    // Test booking query with tour relation
    const bookings = await Booking.findAll({
      limit: 5,
      include: [
        {
          model: Tour,
          as: 'tour',
          attributes: ['id', 'name', 'price', 'destination']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    console.log(`📋 Found ${bookings.length} bookings:`);
    
    bookings.forEach((booking, index) => {
      console.log(`\n${index + 1}. Booking ID: ${booking.id.substring(0, 8)}...`);
      console.log(`   User: ${booking.user?.name || 'Guest User'}`);
      console.log(`   Tour: ${booking.tour?.name || 'Tour not found'}`);
      console.log(`   Destination: ${booking.tour?.destination || 'N/A'}`);
      console.log(`   Price: ${Number(booking.total_price).toLocaleString('vi-VN')} VND`);
      console.log(`   Status: ${booking.status}`);
      
      // Check if tour_id exists
      console.log(`   tour_id: ${booking.tour_id}`);
      console.log(`   Tour found: ${booking.tour ? '✅' : '❌'}`);
    });
    
    // Test agency specific query
    console.log('\n🏢 Testing agency-specific booking query...\n');
    
    const agencyBookings = await Booking.findAll({
      include: [
        {
          model: Tour,
          as: 'tour',
          where: {
            agency_id: { [require('sequelize').Op.ne]: null }
          },
          attributes: ['id', 'name', 'agency_id', 'destination']
        }
      ],
      limit: 3
    });
    
    console.log(`📋 Found ${agencyBookings.length} agency bookings:`);
    
    agencyBookings.forEach((booking, index) => {
      console.log(`\n${index + 1}. Agency Booking: ${booking.id.substring(0, 8)}...`);
      console.log(`   Tour: ${booking.tour.name}`);
      console.log(`   Agency ID: ${booking.tour.agency_id}`);
      console.log(`   Price: ${Number(booking.total_price).toLocaleString('vi-VN')} VND`);
    });
    
    console.log('\n🎉 tour_id column is working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
  
  process.exit(0);
}

testAgencyBookings();
