const { Destination, ItineraryLocation } = require('./models');

async function checkDestinationDeletion() {
  try {
    console.log('Checking destination deletion issue...');
    
    // First, let's see what destinations exist
    const destinations = await Destination.findAll({
      attributes: ['id', 'name', 'location_id']
    });
    console.log('All destinations:', destinations.map(d => ({
      id: d.id,
      name: d.name, 
      location_id: d.location_id
    })));
    
    // Check if dest-dalat-center exists as a destination
    const targetDest = await Destination.findByPk('dest-dalat-center');
    console.log('Target destination:', targetDest ? {
      id: targetDest.id,
      name: targetDest.name,
      location_id: targetDest.location_id
    } : 'Not found');
    
    // Check itinerary_location records that reference this ID
    const itineraryRefs = await ItineraryLocation.findAll({
      where: { location_id: 'dest-dalat-center' }
    });
    console.log('ItineraryLocation records referencing dest-dalat-center:', itineraryRefs.length);
    
    if (itineraryRefs.length > 0) {
      console.log('Sample references:', itineraryRefs.slice(0, 3).map(ref => ({
        itinerary_id: ref.itinerary_id,
        location_id: ref.location_id
      })));
    }
    
  } catch (error) {
    console.error('Error checking destination:', error.message);
  } finally {
    process.exit();
  }
}

checkDestinationDeletion();
