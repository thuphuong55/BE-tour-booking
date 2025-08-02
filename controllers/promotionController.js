const { Promotion, Tour, User } = require("../models");
const { Op } = require("sequelize");

const promotionController = {
  // GET /promotions - Lấy tất cả promotions
  async getAll(req, res) {
    try {
      const { page = 1, limit = 20, status, agency_id } = req.query;
      const offset = (page - 1) * limit;
      
      const whereClause = {};
      if (status) whereClause.status = status;
      if (agency_id) whereClause.agency_id = agency_id;

      const promotions = await Promotion.findAndCountAll({
        where: whereClause,
        // include: [
        //   {
        //     model: User,
        //     as: 'agency',
        //     attributes: ['id', 'name', 'email']
        //   }
        // ],
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
      console.error("Error getting promotions:", error);
      res.status(500).json({ error: "Lỗi lấy danh sách mã giảm giá" });
    }
  },

  // GET /promotions/:id - Lấy promotion theo ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      
      const promotion = await Promotion.findByPk(id);
        // include: [
        //   {
        //     model: User,
        //     as: 'agency',
        //     attributes: ['id', 'name', 'email']
        //   }
        // ]

      if (!promotion) {
        return res.status(404).json({ error: "Không tìm thấy mã giảm giá" });
      }

      res.json(promotion);
    } catch (error) {
      console.error("Error getting promotion by ID:", error);
      res.status(500).json({ error: "Lỗi lấy chi tiết mã giảm giá" });
    }
  },

  // POST /promotions - Tạo promotion mới
  async create(req, res) {
    try {
      const { code, description, discount_amount, discount_type, discount_value, start_date, end_date, applicable_tours } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Validation
      if (!code || !description || !start_date || !end_date) {
        return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
      }
      // Kiểm tra loại mã giảm giá
      if (discount_type === 'percentage') {
        if (typeof discount_value !== 'number' || discount_value <= 0) {
          return res.status(400).json({ error: "Thiếu hoặc sai discount_value cho mã giảm giá phần trăm" });
        }
      } else if (discount_type === 'fixed_amount') {
        if (typeof discount_amount !== 'number' || discount_amount <= 0) {
          return res.status(400).json({ error: "Thiếu hoặc sai discount_amount cho mã giảm giá cố định" });
        }
      } else {
        return res.status(400).json({ error: "discount_type không hợp lệ" });
      }

      // Kiểm tra code đã tồn tại chưa
      const existingPromotion = await Promotion.findOne({ where: { code } });
      if (existingPromotion) {
        return res.status(400).json({ error: "Mã khuyến mãi đã tồn tại" });
      }

      // Nếu là agency, chỉ có thể tạo promotion cho tours của họ
      let agencyId = null;
      if (userRole === 'agency') {
        agencyId = req.body.agency_id || userId;
        // Kiểm tra applicable_tours có thuộc về agency này không (nếu có)
        if (applicable_tours && applicable_tours.length > 0) {
          const tours = await Tour.findAll({
            where: {
              id: { [Op.in]: applicable_tours },
              agency_id: agencyId
            }
          });
          if (tours.length !== applicable_tours.length) {
            return res.status(403).json({ error: "Bạn chỉ có thể tạo mã giảm giá cho tours của mình" });
          }
        }
      } else if (userRole === 'admin') {
        // Admin có thể tạo promotion cho bất kỳ agency nào
        agencyId = req.body.agency_id || null;
      }

      // Tạo promotion với các trường phù hợp
      let saveDiscountAmount = null;
      if (discount_type === 'percentage') {
        saveDiscountAmount = discount_value;
      } else if (discount_type === 'fixed_amount') {
        saveDiscountAmount = discount_amount;
      }
      const newPromotion = await Promotion.create({
        code,
        description,
        discount_type,
        discount_value: discount_type === 'percentage' ? discount_value : null,
        discount_amount: saveDiscountAmount,
        start_date,
        end_date,
        agency_id: agencyId
      });

      res.status(201).json({
        message: "Tạo mã giảm giá thành công",
        promotion: newPromotion
      });
    } catch (error) {
      console.error("Error creating promotion:", error);
      res.status(500).json({ error: "Lỗi tạo mã giảm giá" });
    }
  },

  // PUT /promotions/:id - Cập nhật promotion
  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      const promotion = await Promotion.findByPk(id);
      if (!promotion) {
        return res.status(404).json({ error: "Không tìm thấy mã giảm giá" });
      }

      // Agency chỉ có thể sửa promotion của họ
      if (userRole === 'agency' && promotion.agency_id !== userId) {
        return res.status(403).json({ error: "Bạn chỉ có thể sửa mã giảm giá của mình" });
      }

      // Nếu cập nhật applicable_tours và là agency, kiểm tra tours có thuộc về họ không
      if (userRole === 'agency' && updates.applicable_tours) {
        const tours = await Tour.findAll({
          where: {
            id: { [Op.in]: updates.applicable_tours },
            agency_id: userId
          }
        });
        
        if (tours.length !== updates.applicable_tours.length) {
          return res.status(403).json({ error: "Bạn chỉ có thể áp dụng mã giảm giá cho tours của mình" });
        }
      }

      await promotion.update(updates);

      res.json({
        message: "Cập nhật mã giảm giá thành công",
        promotion: promotion
      });
    } catch (error) {
      console.error("Error updating promotion:", error);
      res.status(500).json({ error: "Lỗi cập nhật mã giảm giá" });
    }
  },

  // DELETE /promotions/:id - Xóa promotion
  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const promotion = await Promotion.findByPk(id);
      if (!promotion) {
        return res.status(404).json({ error: "Không tìm thấy mã giảm giá" });
      }

      // Agency chỉ có thể xóa promotion của họ
      if (userRole === 'agency' && promotion.agency_id !== userId) {
        return res.status(403).json({ error: "Bạn chỉ có thể xóa mã giảm giá của mình" });
      }

      // Kiểm tra xem promotion đã được sử dụng chưa (nếu có field used_count)
      // if (promotion.used_count > 0) {
      //   return res.status(400).json({ error: "Không thể xóa mã giảm giá đã được sử dụng" });
      // }

      await promotion.destroy();

      res.json({ message: "Xóa mã giảm giá thành công" });
    } catch (error) {
      console.error("Error deleting promotion:", error);
      res.status(500).json({ error: "Lỗi xóa mã giảm giá" });
    }
  }
};

module.exports = promotionController;
