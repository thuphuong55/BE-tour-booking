const { ItineraryLocation, Itinerary, Location } = require("../models");

module.exports = {
  async getAll(req, res) {
    try {
      const data = await ItineraryLocation.findAll({
        include: [
          {
            model: Itinerary,
            as: "itinerary",
            required: false,
            attributes: ["id", "name"] // Limit attributes to avoid potential issues
          },
          {
            model: Location,
            as: "location",
            required: false,
            attributes: ["id", "name"]
          }
        ]
      });
      return res.status(200).json(data);
    } catch (error) {
      console.error("Error in getAll ItineraryLocation:", {
        message: error.message,
        stack: error.stack
      });
      return res.status(500).json({
        error: "Internal Server Error",
        details: error.message
      });
    }
  },

  async getById(req, res) {
    try {
      const { itinerary_id, location_id } = req.params;

      // Validate input
      if (!itinerary_id || !location_id) {
        return res.status(400).json({ error: "Missing itinerary_id or location_id" });
      }

      const item = await ItineraryLocation.findOne({
        where: { itinerary_id, location_id },
        include: [
          {
            model: Itinerary,
            as: "itinerary",
            required: false,
            attributes: ["id", "name"]
          },
          {
            model: Location,
            as: "location",
            required: false,
            attributes: ["id", "name"]
          }
        ]
      });

      if (!item) {
        return res.status(404).json({ error: "ItineraryLocation not found" });
      }

      return res.status(200).json(item);
    } catch (error) {
      console.error("Error in getById ItineraryLocation:", {
        message: error.message,
        stack: error.stack
      });
      return res.status(500).json({
        error: "Internal Server Error",
        details: error.message
      });
    }
  },

  async create(req, res) {
    try {
      const { itinerary_id, location_id, order, description } = req.body;

      // Validate required fields
      if (!itinerary_id || !location_id) {
        return res.status(400).json({ error: "itinerary_id and location_id are required" });
      }

      // Check if the Itinerary and Location exist
      const itinerary = await Itinerary.findByPk(itinerary_id);
      if (!itinerary) {
        return res.status(400).json({ error: "Invalid itinerary_id: Itinerary not found" });
      }

      const location = await Location.findByPk(location_id);
      if (!location) {
        return res.status(400).json({ error: "Invalid location_id: Location not found" });
      }

      // Check for existing entry
      const existing = await ItineraryLocation.findOne({
        where: { itinerary_id, location_id }
      });

      if (existing) {
        // Update existing record
        const updatedItem = await existing.update({
          order: order || existing.order || 0,
          description: description || existing.description || "",
          updated_at: new Date().toISOString()
        });

        // Fetch updated item with associations
        const updatedWithAssociations = await ItineraryLocation.findOne({
          where: { itinerary_id, location_id },
          include: [
            {
              model: Itinerary,
              as: "itinerary",
              required: false,
              attributes: ["id", "name"]
            },
            {
              model: Location,
              as: "location",
              required: false,
              attributes: ["id", "name"]
            }
          ]
        });

        return res.status(200).json({
          message: "ItineraryLocation updated successfully",
          data: updatedWithAssociations
        });
      }

      // Create new record
      const item = await ItineraryLocation.create({
        itinerary_id,
        location_id,
        order: order || 0,
        description: description || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Fetch created item with associations
      const createdItem = await ItineraryLocation.findOne({
        where: { itinerary_id, location_id },
        include: [
          {
            model: Itinerary,
            as: "itinerary",
            required: false,
            attributes: ["id", "name"]
          },
          {
            model: Location,
            as: "location",
            required: false,
            attributes: ["id", "name"]
          }
        ]
      });

      return res.status(201).json({
        message: "ItineraryLocation created successfully",
        data: createdItem
      });
    } catch (error) {
      console.error("Error in create ItineraryLocation:", {
        message: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.status(500).json({
        error: "Internal Server Error",
        details: error.message
      });
    }
  },

  async delete(req, res) {
    try {
      const { itinerary_id, location_id } = req.params;

      // Validate input
      if (!itinerary_id || !location_id) {
        return res.status(400).json({ error: "Missing itinerary_id or location_id" });
      }

      const item = await ItineraryLocation.findOne({
        where: { itinerary_id, location_id }
      });

      if (!item) {
        return res.status(404).json({ error: "ItineraryLocation not found" });
      }

      await item.destroy();
      return res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
      console.error("Error in delete ItineraryLocation:", {
        message: error.message,
        stack: error.stack
      });
      return res.status(500).json({
        error: "Internal Server Error",
        details: error.message
      });
    }
  }
};