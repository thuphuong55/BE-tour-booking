const { Payment } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(Payment);
