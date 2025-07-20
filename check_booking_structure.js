const { sequelize } = require('./models');

async function checkBookingStructure() {
  try {
    console.log('🔍 Checking booking table structure...\n');
    
    // 1. Check table structure
    const [columns] = await sequelize.query('DESCRIBE booking');
    console.log('📊 Booking Table Columns:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    console.log('\n🔍 Checking sample booking data...\n');
    
    // 2. Check sample data
    const [bookings] = await sequelize.query(`
      SELECT 
        id,
        user_id,
        tour_schedule_id,
        departure_date_id,
        total_price,
        status,
        created_at
      FROM booking 
      LIMIT 3
    `);
    
    console.log('📋 Sample Bookings:');
    bookings.forEach((booking, index) => {
      console.log(`${index + 1}. Booking ID: ${booking.id}`);
      console.log(`   - user_id: ${booking.user_id}`);
      console.log(`   - tour_schedule_id: ${booking.tour_schedule_id}`);
      console.log(`   - departure_date_id: ${booking.departure_date_id}`);
      console.log(`   - total_price: ${booking.total_price}`);
      console.log(`   - status: ${booking.status}`);
      console.log('');
    });
    
    // 3. Check if tour_schedule table exists
    console.log('🔍 Checking tour_schedule table...\n');
    try {
      const [tourSchedules] = await sequelize.query(`
        SELECT id, tour_id, departure_date 
        FROM tour_schedule 
        LIMIT 3
      `);
      
      console.log('📋 Sample Tour Schedules:');
      tourSchedules.forEach((schedule, index) => {
        console.log(`${index + 1}. Schedule ID: ${schedule.id}`);
        console.log(`   - tour_id: ${schedule.tour_id}`);
        console.log(`   - departure_date: ${schedule.departure_date}`);
        console.log('');
      });
    } catch (error) {
      console.log('❌ tour_schedule table does not exist or error:', error.message);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkBookingStructure();
