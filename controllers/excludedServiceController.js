const {  ExcludedService } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(ExcludedService);
