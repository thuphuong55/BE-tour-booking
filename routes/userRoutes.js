const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

// ───────────────────────────────────────────
//  Public Endpoints (No authentication required)
// ───────────────────────────────────────────
router.post("/register", userController.register);
router.post("/verify-otp", userController.verifyOtp);
router.post("/login", userController.login);

// Guest User ID endpoint for frontend
router.get("/guest-id", (req, res) => {
  const GUEST_USER_ID = "3ca8bb89-a406-4deb-96a7-dab4d9be3cc1";
  res.json({
    success: true,
    data: {
      guest_user_id: GUEST_USER_ID,
      message: "Guest User ID for frontend booking"
    }
  });
});

// ───────────────────────────────────────────
//  Protected Endpoints (Authentication required)
// ───────────────────────────────────────────
router.get("/", protect(["admin"]), userController.getAll);
router.get("/:id", protect(["admin"]), userController.getById);
router.post("/", protect(["admin"]), userController.create);
router.put("/:id", protect(["admin"]), userController.update);
router.delete("/:id", protect(["admin"]), userController.delete);

module.exports = router;
