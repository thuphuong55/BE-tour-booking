const express = require('express');
const router = express.Router();
const hotelLocationController = require('../controllers/hotelLocationController');

// Lấy tất cả khách sạn với thông tin địa điểm
router.get('/', hotelLocationController.getAllHotels);

// Lọc khách sạn theo địa điểm
router.get('/location/:locationId', hotelLocationController.getHotelsByLocation);

// Cập nhật địa điểm cho khách sạn
router.put('/:hotelId/location', hotelLocationController.updateHotelLocation);

module.exports = router;
