
const express = require("express");
const router = express.Router();
const itineraryController = require("../controllers/itineraryController");
const { protect } = require("../middlewares/auth");

router.get("/", protect(), itineraryController.getAll);
router.get("/tour/:tourId", protect(), itineraryController.getByTourId);
router.get("/:id", protect(), itineraryController.getById);
router.post("/", protect(["admin", "agency"]), itineraryController.create);
router.put("/:id", protect(["admin", "agency"]), itineraryController.update);
router.delete("/:id", protect(["admin", "agency"]), itineraryController.delete);

// Quản lý locations trong itinerary
router.post("/:id/locations", protect(["admin", "agency"]), itineraryController.addLocations);
router.delete("/:id/locations", protect(["admin", "agency"]), itineraryController.removeLocations);

module.exports = router;
