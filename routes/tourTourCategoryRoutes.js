const express = require("express");
const router = express.Router();
const tourTourCategoryController = require("../controllers/tourTourCategoryController");

router.get("/", tourTourCategoryController.getAll);
router.get("/:id", tourTourCategoryController.getById);
router.post("/", tourTourCategoryController.create);
router.put("/:id", tourTourCategoryController.update);
router.delete("/:id", tourTourCategoryController.delete);

module.exports = router;
