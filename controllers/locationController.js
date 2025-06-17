const { Location } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(Location);
