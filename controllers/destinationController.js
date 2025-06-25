const { Destination } = require("../models");
const generateCrudController = require("./generateCrudController");
module.exports = generateCrudController(Destination);
