const express = require("express");
const router = express.Router();
const tourScheduleController = require("../controllers/tourScheduleController");

router.get("/", tourScheduleController.getAll);
router.get("/:id", tourScheduleController.getById);
router.post("/", tourScheduleController.create);
router.put("/:id", tourScheduleController.update);
router.delete("/:id", tourScheduleController.delete);

module.exports = router;
