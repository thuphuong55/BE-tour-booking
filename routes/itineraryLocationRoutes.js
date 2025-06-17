const express = require("express");
const router = express.Router();
const itineraryLocationController = require("../controllers/itineraryLocationController");

router.get("/", itineraryLocationController.getAll);
router.get("/:id", itineraryLocationController.getById);
router.post("/", itineraryLocationController.create);
router.put("/:id", itineraryLocationController.update);
router.delete("/:id", itineraryLocationController.delete);

module.exports = router;
