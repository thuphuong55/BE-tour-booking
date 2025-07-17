const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/", protect(["admin"]), userController.getAll);
router.get("/:id", protect(["admin"]), userController.getById);
router.post("/", protect(["admin"]), userController.create);
router.put("/:id", protect(["admin"]), userController.update);
router.delete("/:id", protect(["admin"]), userController.delete);

router.post("/register", userController.register);
router.post("/verify-otp", userController.verifyOtp);

router.post("/login", userController.login);



module.exports = router;
