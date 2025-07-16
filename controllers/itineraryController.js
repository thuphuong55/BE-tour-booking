const { Itinerary, Tour, Location, ItineraryLocation } = require("../models");

// [GET] /api/itineraries
exports.getAll = async (req, res) => {
  try {
    const itineraries = await Itinerary.findAll({
      include: [
        {
          model: Tour,
          as: 'tour',
          attributes: ['id', 'name']
        },
        {
          model: Location,
          as: 'locations',
          attributes: ['id', 'name', 'description']
        }
      ],
      order: [['day_number', 'ASC']]
    });

    res.status(200).json({
      message: "Lấy danh sách hành trình thành công",
      data: itineraries
    });
  } catch (error) {
    console.error("Error getting itineraries:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [GET] /api/itineraries/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const itinerary = await Itinerary.findByPk(id, {
      include: [
        {
          model: Tour,
          as: 'tour',
          attributes: ['id', 'name']
        },
        {
          model: Location,
          as: 'locations',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    if (!itinerary) {
      return res.status(404).json({ message: "Không tìm thấy hành trình" });
    }

    res.status(200).json({
      message: "Lấy thông tin hành trình thành công",
      data: itinerary
    });
  } catch (error) {
    console.error("Error getting itinerary:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [GET] /api/itineraries/tour/:tourId
exports.getByTourId = async (req, res) => {
  try {
    const { tourId } = req.params;
    
    const itineraries = await Itinerary.findAll({
      where: { tour_id: tourId },
      include: [
        {
          model: Location,
          as: 'locations',
          attributes: ['id', 'name', 'description']
        }
      ],
      order: [['day_number', 'ASC']]
    });

    res.status(200).json({
      message: "Lấy hành trình theo tour thành công",
      data: itineraries
    });
  } catch (error) {
    console.error("Error getting itineraries by tour:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [POST] /api/itineraries
exports.create = async (req, res) => {
  try {
    const { tour_id, day_number, title, description, location_ids = [] } = req.body;

    if (!tour_id || !day_number || !title) {
      return res.status(400).json({ 
        message: "Vui lòng cung cấp tour_id, day_number và title" 
      });
    }

    // Kiểm tra tour có tồn tại không
    const tour = await Tour.findByPk(tour_id);
    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }

    // Tạo itinerary
    const itinerary = await Itinerary.create({
      tour_id,
      day_number,
      title,
      description
    });

    // Thêm locations nếu có
    if (location_ids && location_ids.length > 0) {
      // Kiểm tra tất cả location_ids có tồn tại không
      const existingLocations = await Location.findAll({
        where: { id: location_ids },
        attributes: ['id']
      });

      const existingLocationIds = existingLocations.map(loc => loc.id);
      const invalidIds = location_ids.filter(id => !existingLocationIds.includes(id));

      if (invalidIds.length > 0) {
        return res.status(400).json({
          message: "Một số location không tồn tại",
          invalidIds
        });
      }

      // Thêm locations vào itinerary
      await itinerary.setLocations(location_ids);
    }

    // Lấy itinerary với đầy đủ thông tin
    const createdItinerary = await Itinerary.findByPk(itinerary.id, {
      include: [
        {
          model: Tour,
          as: 'tour',
          attributes: ['id', 'name']
        },
        {
          model: Location,
          as: 'locations',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    res.status(201).json({
      message: "Tạo hành trình thành công",
      data: createdItinerary
    });
  } catch (error) {
    console.error("Error creating itinerary:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [PUT] /api/itineraries/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { tour_id, day_number, title, description, location_ids } = req.body;

    const itinerary = await Itinerary.findByPk(id);
    if (!itinerary) {
      return res.status(404).json({ message: "Không tìm thấy hành trình" });
    }

    // Cập nhật thông tin cơ bản
    await itinerary.update({
      tour_id: tour_id || itinerary.tour_id,
      day_number: day_number || itinerary.day_number,
      title: title || itinerary.title,
      description: description || itinerary.description
    });

    // Cập nhật locations nếu có
    if (location_ids !== undefined) {
      if (location_ids.length > 0) {
        // Kiểm tra tất cả location_ids có tồn tại không
        const existingLocations = await Location.findAll({
          where: { id: location_ids },
          attributes: ['id']
        });

        const existingLocationIds = existingLocations.map(loc => loc.id);
        const invalidIds = location_ids.filter(id => !existingLocationIds.includes(id));

        if (invalidIds.length > 0) {
          return res.status(400).json({
            message: "Một số location không tồn tại",
            invalidIds
          });
        }

        await itinerary.setLocations(location_ids);
      } else {
        // Xóa tất cả locations
        await itinerary.setLocations([]);
      }
    }

    // Lấy itinerary đã cập nhật với đầy đủ thông tin
    const updatedItinerary = await Itinerary.findByPk(id, {
      include: [
        {
          model: Tour,
          as: 'tour',
          attributes: ['id', 'name']
        },
        {
          model: Location,
          as: 'locations',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    res.status(200).json({
      message: "Cập nhật hành trình thành công",
      data: updatedItinerary
    });
  } catch (error) {
    console.error("Error updating itinerary:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [DELETE] /api/itineraries/:id
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const itinerary = await Itinerary.findByPk(id);
    if (!itinerary) {
      return res.status(404).json({ message: "Không tìm thấy hành trình" });
    }

    // Xóa các liên kết với locations trước
    await itinerary.setLocations([]);
    
    // Xóa itinerary
    await itinerary.destroy();

    res.status(200).json({
      message: "Xóa hành trình thành công"
    });
  } catch (error) {
    console.error("Error deleting itinerary:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [POST] /api/itineraries/:id/locations
exports.addLocations = async (req, res) => {
  try {
    const { id } = req.params;
    const { location_ids } = req.body;

    if (!location_ids || !Array.isArray(location_ids) || location_ids.length === 0) {
      return res.status(400).json({ 
        message: "Vui lòng cung cấp danh sách location_ids" 
      });
    }

    const itinerary = await Itinerary.findByPk(id);
    if (!itinerary) {
      return res.status(404).json({ message: "Không tìm thấy hành trình" });
    }

    // Kiểm tra tất cả location_ids có tồn tại không
    const existingLocations = await Location.findAll({
      where: { id: location_ids },
      attributes: ['id']
    });

    const existingLocationIds = existingLocations.map(loc => loc.id);
    const invalidIds = location_ids.filter(id => !existingLocationIds.includes(id));

    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: "Một số location không tồn tại",
        invalidIds
      });
    }

    // Thêm locations vào itinerary (không xóa locations hiện có)
    await itinerary.addLocations(location_ids);

    // Lấy itinerary với locations đã cập nhật
    const updatedItinerary = await Itinerary.findByPk(id, {
      include: [
        {
          model: Location,
          as: 'locations',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    res.status(200).json({
      message: "Thêm locations vào hành trình thành công",
      data: updatedItinerary
    });
  } catch (error) {
    console.error("Error adding locations to itinerary:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// [DELETE] /api/itineraries/:id/locations
exports.removeLocations = async (req, res) => {
  try {
    const { id } = req.params;
    const { location_ids } = req.body;

    if (!location_ids || !Array.isArray(location_ids) || location_ids.length === 0) {
      return res.status(400).json({ 
        message: "Vui lòng cung cấp danh sách location_ids" 
      });
    }

    const itinerary = await Itinerary.findByPk(id);
    if (!itinerary) {
      return res.status(404).json({ message: "Không tìm thấy hành trình" });
    }

    // Xóa locations khỏi itinerary
    await itinerary.removeLocations(location_ids);

    // Lấy itinerary với locations đã cập nhật
    const updatedItinerary = await Itinerary.findByPk(id, {
      include: [
        {
          model: Location,
          as: 'locations',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    res.status(200).json({
      message: "Xóa locations khỏi hành trình thành công",
      data: updatedItinerary
    });
  } catch (error) {
    console.error("Error removing locations from itinerary:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
