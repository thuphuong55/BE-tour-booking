const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const momoController = require("../controllers/momoController");

router.get("/", async (req, res) => {
  try {
    const { Booking } = require("../models");
    const { user_id } = req.query;
    
    const whereClause = {};
    if (user_id) {
      whereClause.user_id = user_id;
    }
    
    const bookings = await Booking.findAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: require("../models").Tour,
          as: "tour",
          attributes: ["id", "name", "price", "location", "destination"]
        },
        {
          model: require("../models").DepartureDate,
          as: "departureDate",
          attributes: ["departure_date", "number_of_days", "number_of_nights"]
        },
        {
          model: require("../models").Promotion,
          as: "promotion",
          attributes: ["id", "code", "description", "discount_amount"]
        }
      ]
    });
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Lỗi khi lấy bookings", details: error.message });
  }
});
router.get("/:id", bookingController.getById);

// Validate promotion code endpoint
router.post("/validate-promotion", async (req, res) => {
  try {
    const { Promotion } = require("../models");
    const { promotion_code, tour_price } = req.body;
    
    if (!promotion_code) {
      return res.status(400).json({ error: "Mã khuyến mãi không được để trống" });
    }
    
    // Chuẩn hóa mã: trim spaces và convert về uppercase
    const normalizedCode = promotion_code.trim().toUpperCase();
    
    const promotion = await Promotion.findOne({
      where: { code: normalizedCode }
    });
    
    if (!promotion) {
      return res.status(404).json({ error: "Mã khuyến mãi không tồn tại" });
    }
    
    const now = new Date();
    if (now < new Date(promotion.start_date)) {
      return res.status(400).json({ error: "Mã khuyến mãi chưa có hiệu lực" });
    }
    
    if (now > new Date(promotion.end_date)) {
      return res.status(400).json({ error: "Mã khuyến mãi đã hết hạn" });
    }
    
    // Tính toán giảm giá - có thể là % hoặc giá cố định
    const discount_value = parseFloat(promotion.discount_amount);
    const original_price = parseFloat(tour_price);
    
    let discount_amount;
    // Nếu discount_amount > 100, coi như giá cố định (VNĐ)
    // Nếu discount_amount <= 100, coi như phần trăm (%)
    if (discount_value > 100) {
      // Giảm giá cố định (VNĐ)
      discount_amount = Math.min(discount_value, original_price); // Không được giảm quá giá gốc
    } else {
      // Giảm giá theo phần trăm (%)
      discount_amount = (original_price * discount_value) / 100;
    }
    
    const final_price = Math.max(0, original_price - discount_amount);
    
    res.json({
      valid: true,
      promotion: {
        id: promotion.id,
        code: promotion.code,
        description: promotion.description,
        discount_amount: discount_amount
      },
      pricing: {
        original_price: original_price,
        discount_amount: discount_amount,
        final_price: final_price,
        savings: original_price - final_price
      }
    });
    
  } catch (error) {
    console.error("Error validating promotion:", error);
    res.status(500).json({ error: "Lỗi khi kiểm tra mã khuyến mãi", details: error.message });
  }
});

router.post("/", bookingController.create);
router.put("/:id", bookingController.update);
router.delete("/:id", bookingController.delete);



module.exports = router;
