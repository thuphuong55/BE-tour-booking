const { Tour } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(Tour);
