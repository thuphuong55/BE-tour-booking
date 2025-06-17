const { FAQ } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(FAQ);
