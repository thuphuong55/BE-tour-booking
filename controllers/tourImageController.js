const { TourImage } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(TourImage);
