const express = require("express");
const router = express.Router();
const faqController = require("../controllers/faqController");

router.get("/", faqController.getAll);
router.get("/:id", faqController.getById);
router.post("/", faqController.create);
router.put("/:id", faqController.update);
router.delete("/:id", faqController.delete);

module.exports = router;
