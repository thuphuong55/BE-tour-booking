const { Destination, Location } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(Destination, [
  {
    model: Location,
    as: "location",          // alias đúng với model mới
    attributes: ["id", "name"],
  },
]);


