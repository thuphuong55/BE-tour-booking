const express = require("express");
const router = express.Router();
const departureLocationController = require("../controllers/departureLocationController");

// GET /api/departure-locations - Lấy danh sách điểm khởi hành duy nhất
router.get("/", departureLocationController.getDepartureLocations);

// GET /api/departure-locations/with-count - Lấy điểm khởi hành với số lượng tour
router.get("/with-count", departureLocationController.getDepartureLocationsWithCount);

// GET /api/departure-locations/search?q=keyword - Tìm kiếm điểm khởi hành
router.get("/search", departureLocationController.searchDepartureLocations);

module.exports = router;
