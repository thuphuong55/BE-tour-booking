const express = require("express");
const router = express.Router();
const excludedServiceController = require("../controllers/excludedServiceController");

router.get("/", excludedServiceController.getAll);
router.get("/:id", excludedServiceController.getById);
router.post("/", excludedServiceController.create);
router.put("/:id", excludedServiceController.update);
router.delete("/:id", excludedServiceController.delete);

module.exports = router;
