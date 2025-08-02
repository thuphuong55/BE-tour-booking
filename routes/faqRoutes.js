const express = require("express");
const router = express.Router();
const faqController = require("../controllers/faqController");
const { protect } = require("../middlewares/auth");

// ═══════════════════════════════════════════════════════════════════
// 🤖 PUBLIC FAQ CHAT ENDPOINTS - No Authentication Required
// ═══════════════════════════════════════════════════════════════════

// GET /api/faqs/chat - Lấy FAQs cho chat widget (Public)
router.get("/chat", faqController.getChatFAQs);

// GET /api/faqs/chat/categories - Lấy danh sách categories (Public)
router.get("/chat/categories", faqController.getChatCategories);

// POST /api/faqs/chat/search - Smart search FAQ (Public)
router.post("/chat/search", faqController.searchFAQs);

// PUT /api/faqs/:id/view - Tăng view count (Public)
router.put("/:id/view", faqController.incrementViewCount);

// ═══════════════════════════════════════════════════════════════════
// 🛠️ ADMIN FAQ MANAGEMENT - Authentication Required
// ═══════════════════════════════════════════════════════════════════

// GET /api/faqs - Admin get all FAQs
router.get("/", protect(["admin", "agency"]), faqController.getAll);

// GET /api/faqs/:id - Get single FAQ
router.get("/:id", faqController.getById);

// POST /api/faqs - Create new FAQ (Admin only)
router.post("/", protect(["admin"]), faqController.create);

// PUT /api/faqs/:id - Update FAQ (Admin only)
router.put("/:id", protect(["admin"]), faqController.update);

// DELETE /api/faqs/:id - Delete FAQ (Admin only)
router.delete("/:id", protect(["admin"]), faqController.delete);

module.exports = router;
