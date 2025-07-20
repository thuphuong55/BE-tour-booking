const { Destination, Location } = require("../models");

// Lấy tất cả destinations
const getAllDestinations = async (req, res) => {
  try {
    const destinations = await Destination.findAll({
      include: [
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'description']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: destinations,
      total: destinations.length
    });
  } catch (error) {
    console.error("Error fetching destinations:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách điểm đến",
      error: error.message
    });
  }
};

// Lấy tất cả locations
const getAllLocations = async (req, res) => {
  try {
    const locations = await Location.findAll({
      attributes: ['id', 'name', 'description', 'image_url'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: locations,
      total: locations.length
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách địa điểm",
      error: error.message
    });
  }
};

// Tìm kiếm destinations
const searchDestinations = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Query parameter 'q' is required"
      });
    }

    const { Op } = require('sequelize');
    
    const destinations = await Destination.findAll({
      where: {
        name: {
          [Op.iLike]: `%${q.trim()}%`
        }
      },
      include: [
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name']
        }
      ],
      order: [['name', 'ASC']],
      limit: 20
    });

    res.json({
      success: true,
      data: destinations,
      total: destinations.length,
      query: q.trim()
    });
  } catch (error) {
    console.error("Error searching destinations:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tìm kiếm điểm đến",
      error: error.message
    });
  }
};

// Tìm kiếm locations
const searchLocations = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Query parameter 'q' is required"
      });
    }

    const { Op } = require('sequelize');
    
    const locations = await Location.findAll({
      where: {
        name: {
          [Op.iLike]: `%${q.trim()}%`
        }
      },
      attributes: ['id', 'name', 'description', 'image_url'],
      order: [['name', 'ASC']],
      limit: 20
    });

    res.json({
      success: true,
      data: locations,
      total: locations.length,
      query: q.trim()
    });
  } catch (error) {
    console.error("Error searching locations:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tìm kiếm địa điểm",
      error: error.message
    });
  }
};

module.exports = {
  getAllDestinations,
  getAllLocations,
  searchDestinations,
  searchLocations
};
