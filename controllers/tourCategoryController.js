const { TourCategory} = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(TourCategory);
