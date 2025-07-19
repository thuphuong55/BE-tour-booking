const { Location, Destination } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(Location, [
  {
    model: Destination,
    as: "destinations",
    attributes: ["id", "name", "image"],
  },
]);