const { ItineraryLocation } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(ItineraryLocation);