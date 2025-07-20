const { Sequelize } = require('sequelize');
const config = require('./config/config.json').development;

async function checkPromotionTable() {
  const sequelize = new Sequelize(config.database, config.username, config.password, config);
  
  try {
    console.log('🔍 Checking promotion table structure...');
    const result = await sequelize.query('DESCRIBE promotion', { type: sequelize.QueryTypes.SELECT });
    
    console.log('📋 Promotion table columns:');
    result.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPromotionTable();
