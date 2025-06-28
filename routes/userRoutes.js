const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/", protect(["admin"]), userController.getAll);
router.get("/:id", protect(["admin"]), userController.getById);
router.post("/", protect(["admin"]), userController.create);
router.put("/:id", protect(["admin"]), userController.update);
router.delete("/:id", protect(["admin"]), userController.delete);

module.exports = router;
