const express = require("express");
const router = express.Router();
const tourExcludedServiceController = require("../controllers/tourExcludedServiceController");

router.get("/", tourExcludedServiceController.getAll);
router.get("/:id", tourExcludedServiceController.getById);
router.post("/", tourExcludedServiceController.create);
router.put("/:id", tourExcludedServiceController.update);
router.delete("/:id", tourExcludedServiceController.delete);

module.exports = router;
