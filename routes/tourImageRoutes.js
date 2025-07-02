const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/tourImageController");

// lấy album ảnh (đa tour, có phân trang)
router.get("/", ctrl.getAll);

router.get("/tour/:tourId", ctrl.getByTour);

router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.delete);

module.exports = router;
