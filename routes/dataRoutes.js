const express = require("express");
const router = express.Router();
const dataController = require("../controllers/dataController");

// Lấy danh sách các dịch vụ bao gồm
router.get("/included-services", dataController.getAllIncludedServices);

// Lấy danh sách các danh mục tour
router.get("/tour-categories", dataController.getAllTourCategories);

// Lấy danh sách khách sạn
router.get("/hotels", dataController.getAllHotels);

// Lấy danh sách dịch vụ loại trừ
router.get("/excluded-services", dataController.getAllExcludedServices);

module.exports = router;
