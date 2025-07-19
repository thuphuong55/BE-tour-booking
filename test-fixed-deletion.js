const { Destination, Location, ItineraryLocation } = require('./models');

async function testFixedDeletion() {
  try {
    console.log('Testing fixed destination deletion...');
    
    // Check current state
    const destination = await Destination.findByPk('dest-dalat-center');
    console.log('Destination exists:', destination ? destination.name : 'Not found');
    
    const referencingLocations = await Location.findAll({
      where: { destination_id: 'dest-dalat-center' }
    });
    console.log('Locations referencing dest-dalat-center:', referencingLocations.length);
    
    // Clear references first
    if (referencingLocations.length > 0) {
      await Location.update(
        { destination_id: null },
        { where: { destination_id: 'dest-dalat-center' } }
      );
      console.log('Cleared references from locations');
    }
    
    // Check itinerary_location references
    const itineraryRefs = await ItineraryLocation.findAll({
      where: { location_id: 'dest-dalat-center' }
    });
    console.log('Itinerary location references:', itineraryRefs.length);
    
    if (itineraryRefs.length > 0) {
      await ItineraryLocation.destroy({
        where: { location_id: 'dest-dalat-center' }
      });
      console.log('Cleared itinerary location references');
    }
    
    // Now try to delete the destination
    const result = await Destination.destroy({
      where: { id: 'dest-dalat-center' }
    });
    
    console.log('Deletion successful! Rows affected:', result);
    
  } catch (error) {
    console.error('Error during test:', error.message);
  } finally {
    process.exit();
  }
}

testFixedDeletion();
