const { Location, sequelize } = require('./models');

async function checkLocationStructure() {
  try {
    // Check the actual table structure
    const [results] = await sequelize.query('DESCRIBE location');
    console.log('Location table structure:', results);
    
    // Check if any location has destination_id set
    const [locations] = await sequelize.query('SELECT * FROM location WHERE destination_id IS NOT NULL LIMIT 5');
    console.log('Locations with destination_id:', locations);
    
    // Find location that references dest-dalat-center
    const [referencingLocations] = await sequelize.query("SELECT * FROM location WHERE destination_id = 'dest-dalat-center'");
    console.log('Locations referencing dest-dalat-center:', referencingLocations);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
}

checkLocationStructure();
