const { TourIncludedService } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(TourIncludedService);
