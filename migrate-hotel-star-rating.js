const { sequelize } = require('./models');

async function migrateHotelTable() {
  try {
    console.log('🔄 Migrating Hotel table: Replace loai_phong with star_rating...');
    
    console.log('1. Adding star_rating column...');
    await sequelize.query(`
      ALTER TABLE hotels 
      ADD COLUMN star_rating INT(1) NULL 
      COMMENT 'Số sao khách sạn (1-5)'
    `);
    console.log('✅ Added star_rating column');
    
    console.log('2. Dropping loai_phong column...');
    await sequelize.query('ALTER TABLE hotels DROP COLUMN loai_phong');
    console.log('✅ Dropped loai_phong column');
    
    console.log('🎉 Migration completed successfully!');
    console.log('');
    
    console.log('📋 New Hotel table structure:');
    const columns = await sequelize.query('DESCRIBE hotels', { 
      type: sequelize.QueryTypes.SELECT 
    });
    
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'} ${col.Key ? '[' + col.Key + ']' : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
  
  process.exit(0);
}

migrateHotelTable();
