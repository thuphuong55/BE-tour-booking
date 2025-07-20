const express = require("express");
const router = express.Router();
const controller = require("../controllers/hotelController");

router.get("/", controller.getAll);
router.get("/star/:star_rating", controller.getByStarRating); // Lấy khách sạn theo số sao
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

module.exports = router;
