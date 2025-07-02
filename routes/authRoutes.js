const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", protect(["user", "admin", "agency"]), authController.logout); // dùng POST cho logout an toàn hơn
router.post("/reset-password/:token", authController.resetPassword);


module.exports = router;
