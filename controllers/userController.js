const { User } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(User);
