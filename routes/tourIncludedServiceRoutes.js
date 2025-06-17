const express = require("express");
const router = express.Router();
const tourIncludedServiceController = require("../controllers/tourIncludedServiceController");

router.get("/", tourIncludedServiceController.getAll);
router.get("/:id", tourIncludedServiceController.getById);
router.post("/", tourIncludedServiceController.create);
router.put("/:id", tourIncludedServiceController.update);
router.delete("/:id", tourIncludedServiceController.delete);

module.exports = router;
