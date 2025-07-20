const express = require("express");
const router = express.Router();
const controller = require("../controllers/destinationLocationController");

// Destinations endpoints
router.get("/destinations", controller.getAllDestinations);
router.get("/destinations/search", controller.searchDestinations);

// Locations endpoints  
router.get("/locations", controller.getAllLocations);
router.get("/locations/search", controller.searchLocations);

module.exports = router;
