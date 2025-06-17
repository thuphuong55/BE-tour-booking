const { Review } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(Review);
