const { TourExcludedService } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(TourExcludedService);
