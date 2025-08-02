const { Refund, Booking, Tour, User, sequelize } = require("../models");
const { Op } = require("sequelize");

// ═══════════════════════════════════════════════════════════════════
// 💰 REFUND MANAGEMENT SYSTEM
// ═══════════════════════════════════════════════════════════════════

// GET /api/refunds - Lấy danh sách refunds (Admin)
const getAllRefunds = async (req, res) => {
  try {
    const { 
      status, 
      page = 1, 
      limit = 20, 
      user_id,
      booking_id,
      date_from,
      date_to 
    } = req.query;
    
    const offset = (page - 1) * limit;
    let whereClause = {};
    
    // Filters
    if (status) whereClause.status = status;
    if (user_id) whereClause.user_id = user_id;
    if (booking_id) whereClause.booking_id = booking_id;
    
    if (date_from || date_to) {
      whereClause.created_at = {};
      if (date_from) whereClause.created_at[Op.gte] = new Date(date_from);
      if (date_to) whereClause.created_at[Op.lte] = new Date(date_to);
    }
    
    const { count, rows } = await Refund.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Booking,
          as: 'booking',
          include: [
            {
              model: Tour,
              as: 'tour',
              attributes: ['id', 'name', 'destination']
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'processor',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });
    
    return res.json({
      success: true,
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error("❌ Get refunds error:", error);
    
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách hoàn tiền",
      error: error.message
    });
  }
};

// GET /api/refunds/:id - Lấy chi tiết refund
const getRefundById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const refund = await Refund.findByPk(id, {
      include: [
        {
          model: Booking,
          as: 'booking',
          include: [
            {
              model: Tour,
              as: 'tour'
            },
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }
          ]
        },
        {
          model: User,
          as: 'processor',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });
    
    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy refund"
      });
    }
    
    return res.json({
      success: true,
      data: refund
    });
    
  } catch (error) {
    console.error("❌ Get refund by ID error:", error);
    
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin hoàn tiền",
      error: error.message
    });
  }
};

// PUT /api/refunds/:id/approve - Approve refund (Admin)
const approveRefund = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    
    const refund = await Refund.findByPk(id, { transaction: t });
    
    if (!refund) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy refund"
      });
    }
    
    if (refund.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Refund đã được xử lý với trạng thái: ${refund.status}`
      });
    }
    
    await refund.update({
      status: 'approved',
      processed_at: new Date(),
      processed_by: adminId
    }, { transaction: t });
    
    await t.commit();
    
    console.log(`✅ Refund approved:`, {
      refundId: refund.id,
      amount: refund.amount,
      approvedBy: adminId
    });
    
    return res.json({
      success: true,
      message: "Đã duyệt hoàn tiền",
      data: {
        refund_id: refund.id,
        status: 'approved',
        amount: refund.amount,
        processed_at: refund.processed_at
      }
    });
    
  } catch (error) {
    await t.rollback();
    console.error("❌ Approve refund error:", error);
    
    return res.status(500).json({
      success: false,
      message: "Lỗi khi duyệt hoàn tiền",
      error: error.message
    });
  }
};

// PUT /api/refunds/:id/reject - Reject refund (Admin)
const rejectRefund = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { reject_reason } = req.body;
    const adminId = req.user.id;
    
    const refund = await Refund.findByPk(id, { transaction: t });
    
    if (!refund) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy refund"
      });
    }
    
    if (refund.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Refund đã được xử lý với trạng thái: ${refund.status}`
      });
    }
    
    await refund.update({
      status: 'rejected',
      reason: reject_reason || refund.reason,
      processed_at: new Date(),
      processed_by: adminId
    }, { transaction: t });
    
    await t.commit();
    
    console.log(`❌ Refund rejected:`, {
      refundId: refund.id,
      amount: refund.amount,
      rejectedBy: adminId,
      reason: reject_reason
    });
    
    return res.json({
      success: true,
      message: "Đã từ chối hoàn tiền",
      data: {
        refund_id: refund.id,
        status: 'rejected',
        reason: reject_reason,
        processed_at: refund.processed_at
      }
    });
    
  } catch (error) {
    await t.rollback();
    console.error("❌ Reject refund error:", error);
    
    return res.status(500).json({
      success: false,
      message: "Lỗi khi từ chối hoàn tiền",
      error: error.message
    });
  }
};

// GET /api/refunds/user/:userId - Lấy refunds của user
const getUserRefunds = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestUserId = req.user.id;
    const userRole = req.user.role;
    
    // Kiểm tra quyền truy cập
    if (userRole !== 'admin' && requestUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn chỉ có thể xem refund của chính mình"
      });
    }
    
    const refunds = await Refund.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Booking,
          as: 'booking',
          include: [
            {
              model: Tour,
              as: 'tour',
              attributes: ['id', 'name', 'destination']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    return res.json({
      success: true,
      data: refunds
    });
    
  } catch (error) {
    console.error("❌ Get user refunds error:", error);
    
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách hoàn tiền của user",
      error: error.message
    });
  }
};

module.exports = {
  getAllRefunds,
  getRefundById,
  approveRefund,
  rejectRefund,
  getUserRefunds
};
