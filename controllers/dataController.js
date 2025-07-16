const { IncludedService, TourCategory, Hotel, ExcludedService } = require('../models');

// Lấy tất cả included services
const getAllIncludedServices = async (req, res) => {
  try {
    const services = await IncludedService.findAll({
      attributes: ['id', 'name']
    });
    res.json(services);
  } catch (err) {
    console.error("Lỗi khi lấy included services:", err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy tất cả tour categories
const getAllTourCategories = async (req, res) => {
  try {
    const categories = await TourCategory.findAll({
      attributes: ['id', 'name']
    });
    res.json(categories);
  } catch (err) {
    console.error("Lỗi khi lấy tour categories:", err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy tất cả hotels
const getAllHotels = async (req, res) => {
  try {
    const hotels = await Hotel.findAll({
      attributes: ['id_hotel', 'ten_khach_san', 'ten_phong', 'loai_phong']
    });
    res.json(hotels);
  } catch (err) {
    console.error("Lỗi khi lấy hotels:", err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy tất cả excluded services
const getAllExcludedServices = async (req, res) => {
  try {
    const services = await ExcludedService.findAll({
      attributes: ['id', 'service_name']
    });
    res.json(services);
  } catch (err) {
    console.error("Lỗi khi lấy excluded services:", err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  getAllIncludedServices,
  getAllTourCategories,
  getAllHotels,
  getAllExcludedServices
};
