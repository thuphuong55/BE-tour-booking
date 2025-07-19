const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/promotionController");

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
router.post("/", promotionController.create);
router.put("/:id", promotionController.update);
router.delete("/:id", promotionController.delete);

module.exports = router;
