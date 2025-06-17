const { Booking } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(Booking);
