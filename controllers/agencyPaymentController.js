const { Payment, Booking, Tour, User, Agency, sequelize } = require("../models");
const { Op } = require("sequelize");

// Helper function to get agency ID from user
const getAgencyId = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [{ model: Agency, as: 'agency' }]
  });
  return user?.agency?.id;
};

// GET /agency/payments/stats - Agency payment statistics
exports.getMyPaymentStats = async (req, res) => {
  try {
    const agencyId = await getAgencyId(req.user.id);
    if (!agencyId) {
      return res.status(403).json({ error: "Không tìm thấy agency" });
    }

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const stats = await Promise.all([
      // Total payments for agency's tours
      Payment.count({
        include: [{
          model: Booking,
          as: 'booking',
          include: [{
            model: Tour,
            as: 'tour',
            where: { agency_id: agencyId },
            attributes: []
          }]
        }]
      }),
      
      // This month payments
      Payment.count({
        where: {
          created_at: { [Op.gte]: firstDayOfMonth }
        },
        include: [{
          model: Booking,
          as: 'booking',
          include: [{
            model: Tour,
            as: 'tour',
            where: { agency_id: agencyId },
            attributes: []
          }]
        }]
      }),
      
      // Completed payments
      Payment.count({
        where: { status: 'completed' },
        include: [{
          model: Booking,
          as: 'booking',
          include: [{
            model: Tour,
            as: 'tour',
            where: { agency_id: agencyId },
            attributes: []
          }]
        }]
      }),
      
      // Pending payments
      Payment.count({
        where: { status: 'pending' },
        include: [{
          model: Booking,
          as: 'booking',
          include: [{
            model: Tour,
            as: 'tour',
            where: { agency_id: agencyId },
            attributes: []
          }]
        }]
      })
    ]);

    res.json({
      totalPayments: stats[0],
      thisMonthPayments: stats[1],
      completedPayments: stats[2],
      pendingPayments: stats[3]
    });
  } catch (error) {
    console.error("Error getting agency payment stats:", error);
    res.status(500).json({ error: "Lỗi lấy thống kê payment" });
  }
};

// GET /agency/payments/revenue - Agency revenue statistics
exports.getMyRevenueStats = async (req, res) => {
  try {
    const agencyId = await getAgencyId(req.user.id);
    if (!agencyId) {
      return res.status(403).json({ error: "Không tìm thấy agency" });
    }

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

    const revenueStats = await Promise.all([
      // Total revenue from completed payments
      Payment.sum('amount', {
        where: { status: 'completed' },
        include: [{
          model: Booking,
          as: 'booking',
          include: [{
            model: Tour,
            as: 'tour',
            where: { agency_id: agencyId },
            attributes: []
          }]
        }]
      }),
      
      // This month revenue
      Payment.sum('amount', {
        where: {
          status: 'completed',
          created_at: { [Op.gte]: firstDayOfMonth }
        },
        include: [{
          model: Booking,
          as: 'booking',
          include: [{
            model: Tour,
            as: 'tour',
            where: { agency_id: agencyId },
            attributes: []
          }]
        }]
      }),
      
      // This year revenue
      Payment.sum('amount', {
        where: {
          status: 'completed',
          created_at: { [Op.gte]: firstDayOfYear }
        },
        include: [{
          model: Booking,
          as: 'booking',
          include: [{
            model: Tour,
            as: 'tour',
            where: { agency_id: agencyId },
            attributes: []
          }]
        }]
      })
    ]);

    res.json({
      totalRevenue: revenueStats[0] || 0,
      thisMonthRevenue: revenueStats[1] || 0,
      thisYearRevenue: revenueStats[2] || 0
    });
  } catch (error) {
    console.error("Error getting agency revenue stats:", error);
    res.status(500).json({ error: "Lỗi lấy thống kê doanh thu" });
  }
};

// GET /agency/payments/commission - Agency commission statistics
exports.getMyCommissionStats = async (req, res) => {
  try {
    const agencyId = await getAgencyId(req.user.id);
    if (!agencyId) {
      return res.status(403).json({ error: "Không tìm thấy agency" });
    }

    // Get agency commission rate (assuming it's stored in agency table)
    const agency = await Agency.findByPk(agencyId);
    const commissionRate = agency?.commission_rate || 0.10; // Default 10%

    const totalRevenue = await Payment.sum('amount', {
      where: { status: 'completed' },
      include: [{
        model: Booking,
        as: 'booking',
        include: [{
          model: Tour,
          as: 'tour',
          where: { agency_id: agencyId },
          attributes: []
        }]
      }]
    });

    const totalCommission = (totalRevenue || 0) * commissionRate;
    const netRevenue = (totalRevenue || 0) - totalCommission;

    res.json({
      totalRevenue: totalRevenue || 0,
      commissionRate: commissionRate,
      totalCommission: totalCommission,
      netRevenue: netRevenue
    });
  } catch (error) {
    console.error("Error getting agency commission stats:", error);
    res.status(500).json({ error: "Lỗi lấy thống kê hoa hồng" });
  }
};

// GET /agency/payments - Get agency's payments
exports.getMyPayments = async (req, res) => {
  try {
    const agencyId = await getAgencyId(req.user.id);
    if (!agencyId) {
      return res.status(403).json({ error: "Không tìm thấy agency" });
    }

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
            { 
              model: Tour, 
              as: 'tour', 
              where: { agency_id: agencyId },
              attributes: ['id', 'name', 'destination'] 
            },
            { 
              model: User, 
              as: 'user', 
              attributes: ['id', 'name', 'email'] 
            }
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
    console.error("Error getting agency payments:", error);
    res.status(500).json({ error: "Lỗi lấy danh sách payment" });
  }
};

// GET /agency/payments/:id - Get agency payment detail
exports.getMyPaymentById = async (req, res) => {
  try {
    const agencyId = await getAgencyId(req.user.id);
    if (!agencyId) {
      return res.status(403).json({ error: "Không tìm thấy agency" });
    }

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
              where: { agency_id: agencyId }, // Ensure payment belongs to agency
              include: [
                { model: require("../models").TourImage, as: 'images', limit: 1 }
              ]
            },
            { 
              model: User, 
              as: 'user', 
              attributes: ['id', 'name', 'email', 'phone'] 
            },
            { 
              model: require("../models").DepartureDate, 
              as: 'departureDate' 
            }
          ]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ error: "Không tìm thấy payment hoặc payment không thuộc agency của bạn" });
    }

    res.json(payment);
  } catch (error) {
    console.error("Error getting agency payment by id:", error);
    res.status(500).json({ error: "Lỗi lấy chi tiết payment" });
  }
};

// GET /agency/payments/monthly - Get monthly revenue chart
exports.getMonthlyRevenue = async (req, res) => {
  try {
    const agencyId = await getAgencyId(req.user.id);
    if (!agencyId) {
      return res.status(403).json({ error: "Không tìm thấy agency" });
    }

    const { year = new Date().getFullYear() } = req.query;

    const monthlyRevenue = await sequelize.query(`
      SELECT 
        MONTH(p.created_at) as month,
        SUM(p.amount) as revenue,
        COUNT(p.id) as transactions
      FROM payment p
      INNER JOIN booking b ON p.booking_id = b.id
      INNER JOIN tour t ON b.tour_id = t.id
      WHERE p.status = 'completed' 
        AND t.agency_id = :agencyId
        AND YEAR(p.created_at) = :year
      GROUP BY MONTH(p.created_at)
      ORDER BY month
    `, { 
      replacements: { agencyId, year },
      type: sequelize.QueryTypes.SELECT 
    });

    // Fill missing months with 0
    const fullYearData = [];
    for (let month = 1; month <= 12; month++) {
      const existingData = monthlyRevenue.find(item => item.month === month);
      fullYearData.push({
        month,
        revenue: existingData ? parseFloat(existingData.revenue) : 0,
        transactions: existingData ? parseInt(existingData.transactions) : 0
      });
    }

    res.json(fullYearData);
  } catch (error) {
    console.error("Error getting monthly revenue:", error);
    res.status(500).json({ error: "Lỗi lấy doanh thu theo tháng" });
  }
};

// GET /agency/payments/export/csv - Export agency payments to CSV
exports.exportMyPaymentsCSV = async (req, res) => {
  try {
    const agencyId = await getAgencyId(req.user.id);
    if (!agencyId) {
      return res.status(403).json({ error: "Không tìm thấy agency" });
    }

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
            { 
              model: Tour, 
              as: 'tour', 
              where: { agency_id: agencyId },
              attributes: ['name'] 
            },
            { 
              model: User, 
              as: 'user', 
              attributes: ['name', 'email'] 
            }
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
    res.setHeader('Content-Disposition', 'attachment; filename=agency_payments_export.csv');
    res.send(csv);
  } catch (error) {
    console.error("Error exporting agency payments CSV:", error);
    res.status(500).json({ error: "Lỗi xuất dữ liệu CSV" });
  }
};
