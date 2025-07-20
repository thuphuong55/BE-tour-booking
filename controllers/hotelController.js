const { Hotel, Location } = require("../models");
const generateCrudController = require("./generateCrudController");

// Custom create với validation star_rating
const create = async (req, res) => {
  try {
    const { ten_khach_san, ten_phong, star_rating, location_id } = req.body;

    // Validation
    if (!ten_khach_san) {
      return res.status(400).json({ message: "Tên khách sạn là bắt buộc" });
    }

    if (star_rating && (star_rating < 1 || star_rating > 5)) {
      return res.status(400).json({ message: "Số sao phải từ 1 đến 5" });
    }

    const hotel = await Hotel.create({
      ten_khach_san,
      ten_phong,
      star_rating: star_rating || null,
      location_id
    });

    // Trả về hotel với location info
    const hotelWithLocation = await Hotel.findByPk(hotel.id, {
      include: [{ model: Location, as: 'location' }]
    });

    res.status(201).json(hotelWithLocation);
  } catch (error) {
    console.error("Error creating hotel:", error);
    res.status(500).json({ message: "Lỗi khi tạo khách sạn", error: error.message });
  }
};

// Custom update với validation star_rating
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { ten_khach_san, ten_phong, star_rating, location_id } = req.body;

    const hotel = await Hotel.findByPk(id);
    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }

    // Validation
    if (star_rating && (star_rating < 1 || star_rating > 5)) {
      return res.status(400).json({ message: "Số sao phải từ 1 đến 5" });
    }

    await hotel.update({
      ten_khach_san: ten_khach_san || hotel.ten_khach_san,
      ten_phong: ten_phong || hotel.ten_phong,
      star_rating: star_rating !== undefined ? star_rating : hotel.star_rating,
      location_id: location_id || hotel.location_id
    });

    // Trả về hotel với location info
    const updatedHotel = await Hotel.findByPk(id, {
      include: [{ model: Location, as: 'location' }]
    });

    res.json(updatedHotel);
  } catch (error) {
    console.error("Error updating hotel:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật khách sạn", error: error.message });
  }
};

// Custom getAll để include location và sort theo star_rating
const getAll = async (req, res) => {
  try {
    const { star_rating, location_id } = req.query;
    
    let whereClause = {};
    if (star_rating) {
      whereClause.star_rating = star_rating;
    }
    if (location_id) {
      whereClause.location_id = location_id;
    }

    const hotels = await Hotel.findAll({
      where: whereClause,
      include: [{ model: Location, as: 'location' }],
      order: [
        ['star_rating', 'DESC'], // Sắp xếp theo số sao giảm dần
        ['ten_khach_san', 'ASC']
      ]
    });

    res.json(hotels);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách khách sạn", error: error.message });
  }
};

// Custom getById với location info
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const hotel = await Hotel.findByPk(id, {
      include: [{ model: Location, as: 'location' }]
    });

    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }

    res.json(hotel);
  } catch (error) {
    console.error("Error fetching hotel:", error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin khách sạn", error: error.message });
  }
};

// Endpoint lấy khách sạn theo số sao
const getByStarRating = async (req, res) => {
  try {
    const { star_rating } = req.params;
    
    if (star_rating < 1 || star_rating > 5) {
      return res.status(400).json({ message: "Số sao phải từ 1 đến 5" });
    }

    const hotels = await Hotel.findAll({
      where: { star_rating: star_rating },
      include: [{ model: Location, as: 'location' }],
      order: [['ten_khach_san', 'ASC']]
    });

    res.json(hotels);
  } catch (error) {
    console.error("Error fetching hotels by star rating:", error);
    res.status(500).json({ message: "Lỗi khi lấy khách sạn theo số sao", error: error.message });
  }
};

module.exports = {
  ...generateCrudController(Hotel),
  create,
  update, 
  getAll,
  getById,
  getByStarRating
};
