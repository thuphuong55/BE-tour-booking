const express = require("express");
const router = express.Router();
const tourCategoryController = require("../controllers/tourCategoryController");

router.get("/", tourCategoryController.getAll);
router.get("/:id", tourCategoryController.getById);
router.post("/", tourCategoryController.create);
router.put("/:id", tourCategoryController.update);
router.delete("/:id", tourCategoryController.delete);

module.exports = router;
