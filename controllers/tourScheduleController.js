const { TourSchedule } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(TourSchedule);
