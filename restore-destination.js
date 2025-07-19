const { Destination, Location } = require('./models');

async function restoreDestination() {
  try {
    // Restore the destination
    await Destination.create({
      id: 'dest-dalat-center',
      name: 'Trung tâm Đà Lạt',
      location_id: '61d461a7-c081-4585-869e-063f09cdb60e',
      description: 'Khu vực trung tâm thành phố Đà Lạt với nhiều điểm tham quan và mua sắm'
    });
    
    // Restore the location reference
    await Location.update(
      { destination_id: 'dest-dalat-center' },
      { where: { id: '61d461a7-c081-4585-869e-063f09cdb60e' } }
    );
    
    console.log('Restored destination and location reference successfully!');
    
  } catch (error) {
    console.error('Error restoring:', error.message);
  } finally {
    process.exit();
  }
}

restoreDestination();
