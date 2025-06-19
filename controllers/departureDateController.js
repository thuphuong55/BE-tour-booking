const { DepartureDate } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(DepartureDate);
