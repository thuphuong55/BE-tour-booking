const express = require("express");
const router = express.Router();
const tourController = require("../controllers/tourController");

router.get("/", tourController.getAll);
router.get("/:id", tourController.getById);
router.post("/", tourController.create);
router.put("/:id", tourController.update);
router.delete("/:id", tourController.delete);

module.exports = router;
