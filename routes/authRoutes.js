const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", protect(["user", "admin", "agency"]), authController.logout); // dùng POST cho logout an toàn hơn
router.post("/reset-password/:token", authController.resetPassword);
router.get("/me", protect(["user", "admin", "agency"]), authController.getUserInfo);
router.put("/me", protect(["user", "admin", "agency"]), authController.updateUserInfo);


module.exports = router;
