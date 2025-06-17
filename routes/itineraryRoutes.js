const express = require("express");
const router = express.Router();
const itineraryController = require("../controllers/itineraryController");

router.get("/", itineraryController.getAll);
router.get("/:id", itineraryController.getById);
router.post("/", itineraryController.create);
router.put("/:id", itineraryController.update);
router.delete("/:id", itineraryController.delete);

module.exports = router;
