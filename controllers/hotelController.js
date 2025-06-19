const { Hotel } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(Hotel);
