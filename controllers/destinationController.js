const { Destination, Location, ItineraryLocation } = require("../models");
const generateCrudController = require("./generateCrudController");

// Custom delete function to handle cascade delete properly
const customDelete = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, check if destination exists
    const destination = await Destination.findByPk(id);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: "Destination not found"
      });
    }
    
    // Check if any locations reference this destination
    const referencingLocations = await Location.findAll({
      where: { destination_id: id }
    });
    
    if (referencingLocations.length > 0) {
      // Option 1: Clear the destination_id from referencing locations
      await Location.update(
        { destination_id: null },
        { where: { destination_id: id } }
      );
      
      console.log(`Cleared destination_id from ${referencingLocations.length} location(s)`);
    }
    
    // Check if there are any itinerary_location records that reference this destination's location
    const itineraryLocationRefs = await ItineraryLocation.findAll({
      where: { location_id: id }
    });
    
    if (itineraryLocationRefs.length > 0) {
      // Remove itinerary_location references
      await ItineraryLocation.destroy({
        where: { location_id: id }
      });
      
      console.log(`Removed ${itineraryLocationRefs.length} itinerary_location reference(s)`);
    }
    
    // Now safe to delete the destination
    await destination.destroy();
    
    res.status(200).json({
      success: true,
      message: "Destination deleted successfully"
    });
    
  } catch (error) {
    console.error('Error deleting destination:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete destination",
      error: error.message
    });
  }
};

// Generate the base CRUD controller
const baseCrudController = generateCrudController(Destination, [
  {
    model: Location,
    as: "location",          
    attributes: ["id", "name"],
  },
]);

// Override the delete method
module.exports = {
  ...baseCrudController,
  delete: customDelete
};


