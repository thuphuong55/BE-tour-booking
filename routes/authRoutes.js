const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", protect(["user", "admin", "agency"]), authController.logout); // dùng POST cho logout an toàn hơn

// Forgot Password Flow
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOTP);
router.post("/reset-password-with-token", authController.resetPasswordWithToken);

// Legacy routes
router.post("/reset-password/:token", authController.resetPassword);
router.post("/set-password", authController.setPassword);

router.get("/me", protect(["user", "admin", "agency"]), authController.getUserInfo);
router.put("/me", protect(["user", "admin", "agency"]), authController.updateUserInfo);


module.exports = router;
