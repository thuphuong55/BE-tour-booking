const { sequelize } = require('./models');

async function checkAgency() {
  try {
    const [result] = await sequelize.query('DESCRIBE agency');
    console.log('Cấu trúc bảng agency:');
    result.forEach(field => {
      console.log(`- ${field.Field}: ${field.Type}`);
    });
  } catch (error) {
    console.error('Lỗi:', error.message);
  }
  process.exit();
}

checkAgency();
