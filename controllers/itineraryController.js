const { Itinerary } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(Itinerary);
