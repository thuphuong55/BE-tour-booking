const { Destination, Location } = require("../models");
const generateCrudController = require("./generateCrudController");

module.exports = generateCrudController(Destination, [
  {
    model: Location,
    as: "locations",          // ✅ alias khớp với Destination.hasMany(Location, { as: "locations" })
    attributes: ["id", "name"],
  },
]);


