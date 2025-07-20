const { Tour } = require("../models");
const { Op } = require("sequelize");

// Lấy danh sách các điểm khởi hành duy nhất
exports.getDepartureLocations = async (req, res) => {
  try {
    const departureLocations = await Tour.findAll({
      attributes: [[Tour.sequelize.fn('DISTINCT', Tour.sequelize.col('departure_location')), 'departure_location']],
      where: {
        departure_location: {
          [Op.ne]: null,
          [Op.ne]: ''
        },
        status: 'Đang hoạt động' // Chỉ lấy từ tour đang hoạt động
      },
      order: [['departure_location', 'ASC']],
      raw: true
    });

    // Transform để trả về format đơn giản hơn
    const locations = departureLocations
      .map(item => item.departure_location)
      .filter(location => location && location.trim().length > 0);

    res.json({
      success: true,
      data: locations,
      count: locations.length
    });

  } catch (error) {
    console.error("Error getting departure locations:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách điểm khởi hành",
      error: error.message
    });
  }
};

// Lấy danh sách điểm khởi hành với số lượng tour
exports.getDepartureLocationsWithCount = async (req, res) => {
  try {
    const departureLocations = await Tour.findAll({
      attributes: [
        'departure_location',
        [Tour.sequelize.fn('COUNT', Tour.sequelize.col('id')), 'tour_count']
      ],
      where: {
        departure_location: {
          [Op.ne]: null,
          [Op.ne]: ''
        },
        status: 'Đang hoạt động'
      },
      group: ['departure_location'],
      order: [['departure_location', 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: departureLocations,
      count: departureLocations.length
    });

  } catch (error) {
    console.error("Error getting departure locations with count:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách điểm khởi hành với số lượng",
      error: error.message
    });
  }
};

// Tìm kiếm điểm khởi hành
exports.searchDepartureLocations = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp từ khóa tìm kiếm"
      });
    }

    const departureLocations = await Tour.findAll({
      attributes: [[Tour.sequelize.fn('DISTINCT', Tour.sequelize.col('departure_location')), 'departure_location']],
      where: {
        departure_location: {
          [Op.like]: `%${q.trim()}%`,
          [Op.ne]: null,
          [Op.ne]: ''
        },
        status: 'Đang hoạt động'
      },
      order: [['departure_location', 'ASC']],
      raw: true
    });

    const locations = departureLocations
      .map(item => item.departure_location)
      .filter(location => location && location.trim().length > 0);

    res.json({
      success: true,
      data: locations,
      count: locations.length,
      query: q
    });

  } catch (error) {
    console.error("Error searching departure locations:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tìm kiếm điểm khởi hành",
      error: error.message
    });
  }
};
