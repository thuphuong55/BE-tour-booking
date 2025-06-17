const { TourTourCategory } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(TourTourCategory);
