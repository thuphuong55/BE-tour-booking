const { sequelize } = require('./config/db');

async function checkTables() {
  try {
    const [results] = await sequelize.query('SHOW TABLES');
    console.log('Danh sách bảng trong database:');
    results.forEach(table => {
      console.log('-', Object.values(table)[0]);
    });
    
    // Tìm bảng liên quan đến hotel
    const hotelTables = results.filter(table => 
      Object.values(table)[0].toLowerCase().includes('hotel')
    );
    console.log('\nBảng liên quan đến hotel:', hotelTables);
    
  } catch (error) {
    console.error('Lỗi:', error.message);
  } finally {
    process.exit();
  }
}

checkTables();
