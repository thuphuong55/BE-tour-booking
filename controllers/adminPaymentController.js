const { Payment, Booking, Tour, User, sequelize } = require("../models");
const { Op } = require("sequelize");

// GET /admin/payments/stats - Payment statistics
exports.getPaymentStats = async (req, res) => {
  try {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const stats = await Promise.all([
      // Total payments
      Payment.count(),
      
      // This month payments
      Payment.count({
        where: {
          created_at: { [Op.gte]: firstDayOfMonth }
        }
      }),
      
      // Completed payments
      Payment.count({
        where: { status: 'completed' }
      }),
      
      // Pending payments
      Payment.count({
        where: { status: 'pending' }
      }),
      
      // Failed payments
      Payment.count({
        where: { status: 'failed' }
      }),
      
      // Recent payments
      Payment.findAll({
        limit: 5,
        order: [['created_at', 'DESC']],
        include: [
          { 
            model: Booking, 
            as: 'booking',
            include: [
              { model: Tour, as: 'tour', attributes: ['id', 'name'] },
              { model: User, as: 'user', attributes: ['id', 'name'] }
            ]
          }
        ]
      })
    ]);

    res.json({
      totalPayments: stats[0],
      thisMonthPayments: stats[1],
      completedPayments: stats[2],
      pendingPayments: stats[3],
      failedPayments: stats[4],
      recentPayments: stats[5]
    });
  } catch (error) {
    console.error("Error getting payment stats:", error);
    res.status(500).json({ error: "Lỗi lấy thống kê payment" });
  }
};

// GET /admin/payments/revenue - Revenue statistics
exports.getRevenueStats = async (req, res) => {
  try {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

    const revenueStats = await Promise.all([
      // Total revenue from completed payments
      Payment.sum('amount', {
        where: { status: 'completed' }
      }),
      
      // This month revenue
      Payment.sum('amount', {
        where: {
          status: 'completed',
          created_at: { [Op.gte]: firstDayOfMonth }
        }
      }),
      
      // This year revenue
      Payment.sum('amount', {
        where: {
          status: 'completed',
          created_at: { [Op.gte]: firstDayOfYear }
        }
      }),
      
      // Daily revenue for last 30 days
      sequelize.query(`
        SELECT 
          DATE(created_at) as date,
          SUM(amount) as revenue,
          COUNT(*) as transactions
        FROM payment 
        WHERE status = 'completed' 
          AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date
      `, { type: sequelize.QueryTypes.SELECT })
    ]);

    res.json({
      totalRevenue: revenueStats[0] || 0,
      thisMonthRevenue: revenueStats[1] || 0,
      thisYearRevenue: revenueStats[2] || 0,
      dailyChart: revenueStats[3]
    });
  } catch (error) {
    console.error("Error getting revenue stats:", error);
    res.status(500).json({ error: "Lỗi lấy thống kê doanh thu" });
  }
};

// GET /admin/payments/methods - Payment method statistics
exports.getPaymentMethodStats = async (req, res) => {
  try {
    const methodStats = await Payment.findAll({
      attributes: [
        'payment_method',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount']
      ],
      where: { status: 'completed' },
      group: ['payment_method'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });

    res.json(methodStats);
  } catch (error) {
    console.error("Error getting payment method stats:", error);
    res.status(500).json({ error: "Lỗi lấy thống kê phương thức thanh toán" });
  }
};

// GET /admin/payments - Get all payments with filters
exports.getAllPayments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      method,
      search,
      date_from,
      date_to,
      sort = 'created_at',
      order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Filters
    if (status) whereClause.status = status;
    if (method) whereClause.payment_method = method;
    if (date_from || date_to) {
      whereClause.created_at = {};
      if (date_from) whereClause.created_at[Op.gte] = new Date(date_from);
      if (date_to) whereClause.created_at[Op.lte] = new Date(date_to);
    }

    // Search in order_id, user name, tour name
    const searchClause = search ? {
      [Op.or]: [
        { order_id: { [Op.like]: `%${search}%` } },
        { '$booking.user.name$': { [Op.like]: `%${search}%` } },
        { '$booking.tour.name$': { [Op.like]: `%${search}%` } }
      ]
    } : {};

    const payments = await Payment.findAndCountAll({
      where: { ...whereClause, ...searchClause },
      include: [
        { 
          model: Booking, 
          as: 'booking',
          include: [
            { model: Tour, as: 'tour', attributes: ['id', 'name', 'destination'] },
            { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [[sort, order.toUpperCase()]],
      distinct: true
    });

    res.json({
      payments: payments.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(payments.count / limit),
        totalPayments: payments.count,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error getting all payments:", error);
    res.status(500).json({ error: "Lỗi lấy danh sách payment" });
  }
};

// GET /admin/payments/:id - Get payment detail
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findByPk(id, {
      include: [
        { 
          model: Booking, 
          as: 'booking',
          include: [
            { 
              model: Tour, 
              as: 'tour',
              include: [
                { model: require("../models").TourImage, as: 'images', limit: 1 }
              ]
            },
            { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
            { model: require("../models").DepartureDate, as: 'departureDate' }
          ]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ error: "Không tìm thấy payment" });
    }

    res.json(payment);
  } catch (error) {
    console.error("Error getting payment by id:", error);
    res.status(500).json({ error: "Lỗi lấy chi tiết payment" });
  }
};

// PUT /admin/payments/:id/status - Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['pending', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Trạng thái không hợp lệ" });
    }

    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({ error: "Không tìm thấy payment" });
    }

    await payment.update({ 
      status,
      admin_note: reason,
      updated_at: new Date()
    });

    // If payment is completed, update booking status
    if (status === 'completed') {
      const booking = await Booking.findByPk(payment.booking_id);
      if (booking && booking.status === 'pending') {
        await booking.update({ status: 'confirmed' });
      }
    }

    res.json({ 
      message: "Cập nhật trạng thái payment thành công",
      payment: payment
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ error: "Lỗi cập nhật trạng thái payment" });
  }
};

// GET /admin/payments/failed - Get failed payments
exports.getFailedPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const failedPayments = await Payment.findAndCountAll({
      where: { status: 'failed' },
      include: [
        { 
          model: Booking, 
          as: 'booking',
          include: [
            { model: Tour, as: 'tour', attributes: ['id', 'name'] },
            { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      payments: failedPayments.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(failedPayments.count / limit),
        totalPayments: failedPayments.count,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error getting failed payments:", error);
    res.status(500).json({ error: "Lỗi lấy danh sách payment thất bại" });
  }
};

// PUT /admin/payments/:id/retry - Retry failed payment
exports.retryPayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({ error: "Không tìm thấy payment" });
    }

    if (payment.status !== 'failed') {
      return res.status(400).json({ error: "Chỉ có thể retry payment đã thất bại" });
    }

    await payment.update({ 
      status: 'pending',
      retry_count: (payment.retry_count || 0) + 1,
      updated_at: new Date()
    });

    res.json({ 
      message: "Đã đặt lại payment để retry",
      payment: payment
    });
  } catch (error) {
    console.error("Error retrying payment:", error);
    res.status(500).json({ error: "Lỗi retry payment" });
  }
};

// GET /admin/payments/export/csv - Export payments to CSV
exports.exportPaymentsCSV = async (req, res) => {
  try {
    const { status, method, date_from, date_to } = req.query;
    
    const whereClause = {};
    if (status) whereClause.status = status;
    if (method) whereClause.payment_method = method;
    if (date_from || date_to) {
      whereClause.created_at = {};
      if (date_from) whereClause.created_at[Op.gte] = new Date(date_from);
      if (date_to) whereClause.created_at[Op.lte] = new Date(date_to);
    }

    const payments = await Payment.findAll({
      where: whereClause,
      include: [
        { 
          model: Booking, 
          as: 'booking',
          include: [
            { model: Tour, as: 'tour', attributes: ['name'] },
            { model: User, as: 'user', attributes: ['name', 'email'] }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Generate CSV content
    const csvHeader = 'Payment ID,Order ID,Tour Name,Customer Name,Email,Amount,Method,Status,Payment Date\n';
    const csvData = payments.map(payment => {
      return [
        payment.id,
        payment.order_id || '',
        payment.booking?.tour?.name || '',
        payment.booking?.user?.name || '',
        payment.booking?.user?.email || '',
        payment.amount,
        payment.payment_method,
        payment.status,
        payment.created_at
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=payments_export.csv');
    res.send(csv);
  } catch (error) {
    console.error("Error exporting payments CSV:", error);
    res.status(500).json({ error: "Lỗi xuất dữ liệu CSV" });
  }
};
