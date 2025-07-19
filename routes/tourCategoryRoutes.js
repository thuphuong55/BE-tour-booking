const express = require("express");
const router = express.Router();
const controller = require("../controllers/tourCategoryController");

// Lấy tất cả danh mục
router.get("/", controller.getAll);

// Lấy 1 danh mục
router.get("/:id", controller.getById);

// Lấy 1 danh mục kèm danh sách tour liên quan
router.get("/:id/tours", controller.getCategoryWithTours);

// Lấy tours theo category với pagination
router.get("/:id/tours-only", controller.getToursByCategory);

// Thêm danh mục
router.post("/", controller.create);

// Cập nhật danh mục
router.put("/:id", controller.update);

// Xoá danh mục
router.delete("/:id", controller.delete);

module.exports = router;
