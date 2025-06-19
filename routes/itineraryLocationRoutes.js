const express = require("express");
const router = express.Router();
const controller = require("../controllers/itineraryLocationController");

router.get("/", controller.getAll);

// Lấy 1 cặp itinerary_id + location_id
router.get("/:itinerary_id/:location_id", controller.getById);

// Tạo mới liên kết
router.post("/", controller.create);

// Xoá liên kết
router.delete("/:itinerary_id/:location_id", controller.delete);

module.exports = router;
