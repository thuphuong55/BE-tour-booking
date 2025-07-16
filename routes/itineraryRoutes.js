const express = require("express");
const router = express.Router();
const itineraryController = require("../controllers/itineraryController");

router.get("/", itineraryController.getAll);
router.get("/tour/:tourId", itineraryController.getByTourId);
router.get("/:id", itineraryController.getById);
router.post("/", itineraryController.create);
router.put("/:id", itineraryController.update);
router.delete("/:id", itineraryController.delete);

// Quản lý locations trong itinerary
router.post("/:id/locations", itineraryController.addLocations);
router.delete("/:id/locations", itineraryController.removeLocations);

module.exports = router;
