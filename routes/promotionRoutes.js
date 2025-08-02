const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/promotionController");
const newsletterController = require("../controllers/promotionNewsletterController");
const { protect } = require("../middlewares/auth");

// Public endpoints - Không cần authentication
router.get("/", promotionController.getAll);

// Lấy promotions đang hoạt động
router.get("/active", async (req, res) => {
  try {
    const { Promotion } = require("../models");
    const { Op } = require("sequelize");
    
    const now = new Date();
    const activePromotions = await Promotion.findAll({
      where: {
        start_date: { [Op.lte]: now },
        end_date: { [Op.gte]: now }
      },
      order: [["created_at", "DESC"]]
    });
    
    res.json(activePromotions);
  } catch (error) {
    console.error("Error fetching active promotions:", error);
    res.status(500).json({ error: "Lỗi khi lấy promotions đang hoạt động", details: error.message });
  }
});

// Lấy promotion theo code
router.get("/code/:code", async (req, res) => {
  try {
    const { Promotion } = require("../models");
    const { code } = req.params;
    
    const promotion = await Promotion.findOne({
      where: { code: code }
    });
    
    if (!promotion) {
      return res.status(404).json({ error: "Mã khuyến mãi không tồn tại" });
    }
    
    res.json(promotion);
  } catch (error) {
    console.error("Error fetching promotion by code:", error);
    res.status(500).json({ error: "Lỗi khi lấy promotion theo code", details: error.message });
  }
});

router.get("/:id", promotionController.getById);

// 🔒 PROTECTED ENDPOINTS - Admin và Agency có thể tạo/sửa/xóa mã giảm giá
router.post("/", protect(["admin", "agency"]), promotionController.create);
router.put("/:id", protect(["admin", "agency"]), promotionController.update);
router.delete("/:id", protect(["admin", "agency"]), promotionController.delete);

// 🏢 AGENCY ENDPOINTS - Agency lấy promotions của họ
router.get("/my/promotions", protect(["agency"]), async (req, res) => {
  try {
    const { Promotion } = require("../models");
    const agencyId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = { agency_id: agencyId };
    if (status) whereClause.status = status;

    const promotions = await Promotion.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      promotions: promotions.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(promotions.count / limit),
        totalPromotions: promotions.count,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error getting agency promotions:", error);
    res.status(500).json({ error: "Lỗi lấy danh sách mã giảm giá của agency" });
  }
});

// 📧 NEWSLETTER ENDPOINTS - Admin và Agency gửi mã giảm giá cho users
router.post("/send-newsletter", protect(["admin", "agency"]), newsletterController.sendPromotionNewsletter);
router.post("/send-to-user", protect(["admin", "agency"]), newsletterController.sendPromotionToUser);

module.exports = router;
