const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/promotionController");

router.get("/", promotionController.getAll);
router.get("/:id", promotionController.getById);
router.post("/", promotionController.create);
router.put("/:id", promotionController.update);
router.delete("/:id", promotionController.delete);

module.exports = router;
