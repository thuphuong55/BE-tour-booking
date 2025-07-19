const { sequelize } = require('./config/db');

async function checkLocationTable() {
  try {
    const [results] = await sequelize.query('DESCRIBE location');
    console.log('Cấu trúc bảng location:');
    results.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default || ''}`);
    });
    
    const [hotelResults] = await sequelize.query('DESCRIBE hotels');
    console.log('\nCấu trúc bảng hotels:');
    hotelResults.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default || ''}`);
    });
    
  } catch (error) {
    console.error('Lỗi:', error.message);
  } finally {
    process.exit();
  }
}

checkLocationTable();
