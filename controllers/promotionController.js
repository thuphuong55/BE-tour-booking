const { Promotion } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(Promotion);
