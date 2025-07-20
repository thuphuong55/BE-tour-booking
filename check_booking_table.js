const { Sequelize } = require('sequelize');
const config = require('./config/config.json').development;

async function checkBookingTable() {
  const sequelize = new Sequelize(config.database, config.username, config.password, config);
  
  try {
    console.log('🔍 Checking booking table structure...');
    const result = await sequelize.query('DESCRIBE booking', { type: sequelize.QueryTypes.SELECT });
    
    console.log('📋 Booking table columns:');
    result.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Check if tour_id exists
    const hasTourId = result.find(col => col.Field === 'tour_id');
    console.log('\n🎯 tour_id column:', hasTourId ? '✅ EXISTS' : '❌ MISSING');
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBookingTable();
