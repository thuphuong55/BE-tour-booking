const express = require("express");
const router = express.Router();
const controller = require("../controllers/departureDateController");

// CRUD mặc định
router.get("/", async (req, res) => {
  try {
    const { DepartureDate } = require("../models");
    const { tour_id } = req.query;
    
    const whereClause = {};
    if (tour_id) {
      whereClause.tour_id = tour_id;
    }
    
    const data = await DepartureDate.findAll({
      where: whereClause,
      order: [["departure_date", "ASC"]],
    });
    res.json(data);
  } catch (error) {
    console.error("Error fetching departure dates:", error);
    res.status(500).json({ error: "Lỗi khi lấy departure dates", details: error.message });
  }
});            // GET /api/departure-dates?tour_id=...
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
      order: [["departure_date", "ASC"]],
    });
    res.json(data);
  } catch (error) {
    console.error("Error fetching departure dates by tour_id:", error);
    res.status(500).json({ error: "Lỗi khi lấy theo tour_id", details: error.message });
  }
});

module.exports = router;
