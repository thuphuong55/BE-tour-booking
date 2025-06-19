const express = require("express");
const router = express.Router();
const controller = require("../controllers/departureDateController");

// CRUD mặc định
router.get("/", controller.getAll);            // GET /api/departure-dates
router.get("/:id", controller.getById);        // GET /api/departure-dates/:id
router.post("/", controller.create);           // POST /api/departure-dates
router.put("/:id", controller.update);         // PUT /api/departure-dates/:id
router.delete("/:id", controller.delete);      // DELETE /api/departure-dates/:id

// Custom: Lấy theo tour_id
router.get("/by-tour/:tourId", async (req, res) => {
  try {
    const { DepartureDate } = require("../models");
    const tourId = req.params.tourId;
    const data = await DepartureDate.findAll({
      where: { tour_id: tourId },
      order: [["ngay_khoi_hanh", "ASC"]],
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy theo tour_id" });
  }
});

module.exports = router;
