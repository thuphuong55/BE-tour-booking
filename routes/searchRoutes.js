const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Ghi log người dùng tìm kiếm
router.post('/log', searchController.logSearch);

// Lấy top 5 từ khóa tìm kiếm nhiều nhất (locations)
router.get('/top', searchController.getTopSearchLocations);

// Lấy top 5 điểm đến nổi bật (destinations)
router.get('/top-destinations', searchController.getTopSearchDestinations);



module.exports = router;
