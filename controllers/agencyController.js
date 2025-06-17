const { Agency } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(Agency);
