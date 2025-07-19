const CommissionService = require('../services/commissionService');
const { CommissionSetting, User, TourCategory } = require('../models');

const commissionController = {
  /**
   * Tính hoa hồng cho một booking cụ thể
   * POST /api/admin/commissions/calculate/:bookingId
   */
  async calculateBookingCommission(req, res) {
    try {
      const { bookingId } = req.params;
      const { force = false } = req.body;

      const result = await CommissionService.calculateCommission(bookingId, force);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Lỗi calculate commission:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tính hoa hồng',
        error: error.message
      });
    }
  },

  /**
   * Tính hoa hồng cho tất cả booking chưa được tính
   * POST /api/admin/commissions/calculate-pending
   */
  async calculatePendingCommissions(req, res) {
    try {
      const result = await CommissionService.calculatePendingCommissions();
      res.status(200).json(result);
    } catch (error) {
      console.error('Lỗi calculate pending commissions:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tính hoa hồng pending',
        error: error.message
      });
    }
  },

  /**
   * Lấy báo cáo hoa hồng
   * GET /api/admin/commissions/report
   */
  async getCommissionReport(req, res) {
    try {
      const { date_from, date_to, agency_id } = req.query;
      
      const filters = {};
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;
      if (agency_id) filters.agency_id = agency_id;

      const result = await CommissionService.getCommissionReport(filters);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Lỗi get commission report:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy báo cáo hoa hồng',
        error: error.message
      });
    }
  },

  /**
   * Lấy danh sách cấu hình hoa hồng
   * GET /api/admin/commission-settings
   */
  async getCommissionSettings(req, res) {
    try {
      const { agency_id, is_active } = req.query;
      
      const whereCondition = {};
      if (agency_id) whereCondition.user_id = agency_id;
      if (is_active !== undefined) whereCondition.is_active = is_active === 'true';

      const settings = await CommissionSetting.findAll({
        where: whereCondition,
        include: [
          {
            model: User,
            as: 'agency',
            attributes: ['id', 'name', 'email']
          },
          {
            model: TourCategory,
            as: 'tourCategory',
            attributes: ['id', 'name']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Lỗi get commission settings:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy cấu hình hoa hồng',
        error: error.message
      });
    }
  },

  /**
   * Tạo cấu hình hoa hồng mới
   * POST /api/admin/commission-settings
   */
  async createCommissionSetting(req, res) {
    try {
      const {
        user_id,
        commission_rate,
        min_booking_value,
        max_booking_value,
        tour_category_id,
        effective_from,
        effective_to
      } = req.body;

      // Validation
      if (!user_id || !commission_rate) {
        return res.status(400).json({
          success: false,
          message: 'user_id và commission_rate là bắt buộc'
        });
      }

      if (commission_rate < 0 || commission_rate > 100) {
        return res.status(400).json({
          success: false,
          message: 'Tỷ lệ hoa hồng phải từ 0% đến 100%'
        });
      }

      // Kiểm tra user có tồn tại và là agency không
      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy user'
        });
      }

      const newSetting = await CommissionSetting.create({
        user_id,
        commission_rate,
        min_booking_value: min_booking_value || null,
        max_booking_value: max_booking_value || null,
        tour_category_id: tour_category_id || null,
        effective_from: effective_from || new Date(),
        effective_to: effective_to || null
      });

      // Lấy lại với include
      const setting = await CommissionSetting.findByPk(newSetting.id, {
        include: [
          {
            model: User,
            as: 'agency',
            attributes: ['id', 'name', 'email']
          },
          {
            model: TourCategory,
            as: 'tourCategory',
            attributes: ['id', 'name']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Tạo cấu hình hoa hồng thành công',
        data: setting
      });
    } catch (error) {
      console.error('Lỗi create commission setting:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo cấu hình hoa hồng',
        error: error.message
      });
    }
  },

  /**
   * Cập nhật cấu hình hoa hồng
   * PUT /api/admin/commission-settings/:id
   */
  async updateCommissionSetting(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const setting = await CommissionSetting.findByPk(id);
      if (!setting) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy cấu hình hoa hồng'
        });
      }

      // Validation tỷ lệ hoa hồng
      if (updates.commission_rate && (updates.commission_rate < 0 || updates.commission_rate > 100)) {
        return res.status(400).json({
          success: false,
          message: 'Tỷ lệ hoa hồng phải từ 0% đến 100%'
        });
      }

      await setting.update(updates);

      // Lấy lại với include
      const updatedSetting = await CommissionSetting.findByPk(id, {
        include: [
          {
            model: User,
            as: 'agency',
            attributes: ['id', 'name', 'email']
          },
          {
            model: TourCategory,
            as: 'tourCategory',
            attributes: ['id', 'name']
          }
        ]
      });

      res.status(200).json({
        success: true,
        message: 'Cập nhật cấu hình hoa hồng thành công',
        data: updatedSetting
      });
    } catch (error) {
      console.error('Lỗi update commission setting:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật cấu hình hoa hồng',
        error: error.message
      });
    }
  },

  /**
   * Xóa cấu hình hoa hồng
   * DELETE /api/admin/commission-settings/:id
   */
  async deleteCommissionSetting(req, res) {
    try {
      const { id } = req.params;

      const setting = await CommissionSetting.findByPk(id);
      if (!setting) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy cấu hình hoa hồng'
        });
      }

      await setting.destroy();

      res.status(200).json({
        success: true,
        message: 'Xóa cấu hình hoa hồng thành công'
      });
    } catch (error) {
      console.error('Lỗi delete commission setting:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa cấu hình hoa hồng',
        error: error.message
      });
    }
  }
};

module.exports = commissionController;
