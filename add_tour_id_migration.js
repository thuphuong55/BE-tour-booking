const { sequelize } = require('./models');

async function addTourIdToBooking() {
  try {
    console.log('🔧 Adding tour_id column to booking table...\n');
    
    // 1. Add tour_id column
    await sequelize.query(`
      ALTER TABLE booking 
      ADD COLUMN tour_id CHAR(36) NULL 
      AFTER tour_schedule_id
    `);
    
    console.log('✅ Added tour_id column to booking table');
    
    // 2. Update tour_id based on departure_date_id
    console.log('🔄 Updating tour_id from departure_date relationships...\n');
    
    const updateResult = await sequelize.query(`
      UPDATE booking b
      INNER JOIN departure_date d ON b.departure_date_id = d.id
      SET b.tour_id = d.tour_id
      WHERE b.tour_id IS NULL
    `);
    
    console.log(`✅ Updated ${updateResult[0].affectedRows} booking records with tour_id`);
    
    // 3. Make tour_id NOT NULL
    await sequelize.query(`
      ALTER TABLE booking 
      MODIFY COLUMN tour_id CHAR(36) NOT NULL
    `);
    
    console.log('✅ Made tour_id NOT NULL');
    
    // 4. Add foreign key constraint
    await sequelize.query(`
      ALTER TABLE booking 
      ADD CONSTRAINT fk_booking_tour 
      FOREIGN KEY (tour_id) REFERENCES tour(id) 
      ON UPDATE CASCADE ON DELETE RESTRICT
    `);
    
    console.log('✅ Added foreign key constraint for tour_id');
    
    // 5. Verify results
    const [results] = await sequelize.query(`
      SELECT 
        b.id as booking_id,
        b.tour_id,
        t.name as tour_name,
        b.total_price
      FROM booking b
      INNER JOIN tour t ON b.tour_id = t.id
      LIMIT 5
    `);
    
    console.log('📊 Verification - Bookings with tours:');
    results.forEach((row, index) => {
      console.log(`${index + 1}. Booking: ${row.booking_id.substring(0, 8)}...`);
      console.log(`   Tour: ${row.tour_name}`);
      console.log(`   Price: ${row.total_price}`);
      console.log('');
    });
    
    console.log('🎉 Successfully added tour_id to booking table!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

addTourIdToBooking();
