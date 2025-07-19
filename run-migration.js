const { sequelize } = require('./config/db');
const migration = require('./migrations/20250718_add_promotion_support.js');

async function runMigration() {
  try {
    console.log('🔄 Running promotion support migration...');
    
    await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Added promotion_id to tour table');
    console.log('   - Added promotion_id, original_price, discount_amount to booking table');
    
    process.exit(0);
  } catch (error) {
    if (error.message.includes('column "promotion_id" of relation "booking" already exists')) {
      console.log('✅ Migration already applied - promotion_id columns exist');
    } else {
      console.error('❌ Migration failed:', error.message);
    }
    process.exit(0);
  }
}

runMigration();
