const { Booking, Tour, Payment, User, DepartureDate, Promotion, sequelize, Agency, Review } = require("../models");
const { Op } = require("sequelize");

// Helper function to get agency ID from user
const getAgencyId = async (userId) => {
  console.log('DEBUG getAgencyId - userId:', userId);
  const agency = await Agency.findOne({ where: { user_id: userId } });
  console.log('getAgencyId direct query:', agency, 'userId:', userId);
  return agency?.id;
};

console.log("AgencyBookingController file loaded");

// GET /agency/bookings/stats - Agency booking statistics
exports.getMyBookingStats = async (req, res) => {
  try {
    const agencyId = await getAgencyId(req.user.id);
    if (!agencyId) {
      return res.status(403).json({ error: "Không tìm thấy agency" });
    }

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const stats = await Promise.all([
      // Total bookings for agency's tours
      Booking.count({
        include: [{
          model: Tour,
          as: 'tour',
          where: { agency_id: agencyId },
          attributes: []
        }]
      }),
      
      // This month bookings
      Booking.count({
        where: {
          created_at: { [Op.gte]: firstDayOfMonth }
        },
        include: [{
          model: Tour,
          as: 'tour',
          where: { agency_id: agencyId },
          attributes: []
        }]
      }),
      
      // Pending bookings
      Booking.count({
        where: { status: 'pending' },
        include: [{
          model: Tour,
          as: 'tour',
          where: { agency_id: agencyId },
          attributes: []
        }]
      }),
      
      // Confirmed bookings
      Booking.count({
        where: { status: 'confirmed' },
        include: [{
          model: Tour,
          as: 'tour',
          where: { agency_id: agencyId },
          attributes: []
        }]
      }),
      
      // Recent bookings
      Booking.findAll({
        limit: 5,
        order: [['created_at', 'DESC']],
        include: [
          { 
            model: Tour, 
            as: 'tour', 
            where: { agency_id: agencyId },
            attributes: ['id', 'name'] 
          },
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
        ]
      })
    ]);

    res.json({
      totalBookings: stats[0],
      thisMonthBookings: stats[1],
      pendingBookings: stats[2],
      confirmedBookings: stats[3],
      recentBookings: stats[4]
    });
  } catch (error) {
    console.error("Error getting agency booking stats:", error);
    res.status(500).json({ error: "Lỗi lấy thống kê booking" });
  }
};

// GET /agency/bookings/revenue - Agency revenue statistics
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
      // Total revenue from confirmed bookings
      Booking.sum('total_price', {
        where: { status: 'confirmed' },
        include: [{
          model: Tour,
          as: 'tour',
          where: { agency_id: agencyId },
          attributes: []
        }]
      }),
      
      // This month revenue
      Booking.sum('total_price', {
        where: {
          status: 'confirmed',
          created_at: { [Op.gte]: firstDayOfMonth }
        },
        include: [{
          model: Tour,
          as: 'tour',
          where: { agency_id: agencyId },
          attributes: []
        }]
      }),
      
      // This year revenue
      Booking.sum('total_price', {
        where: {
          status: 'confirmed',
          created_at: { [Op.gte]: firstDayOfYear }
        },
        include: [{
          model: Tour,
          as: 'tour',
          where: { agency_id: agencyId },
          attributes: []
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

// GET /agency/bookings - Get agency's bookings
exports.getMyBookings = async (req, res) => {
  try {
    // 1. Tìm agency theo user đang đăng nhập

    console.log("User ID from token:", req.user.id);
    const allAgencies = await Agency.findAll();
    allAgencies.forEach(a => {
      console.log(`[Agency] id: ${a.id}, user_id: ${a.user_id}, status: ${a.status}`);
    });
    const agency = await Agency.findOne({ where: { user_id: req.user.id, status: 'approved' } });
    console.log("Agency found:", agency);
    if (!agency) {
      return res.status(403).json({ error: 'Chỉ agency đã được duyệt mới có quyền thao tác', debug: { user_id: req.user.id, agencies: allAgencies.map(a => ({ id: a.id, user_id: a.user_id, status: a.status })) } });
    }

    // 2. Lấy tất cả tour của agency
    const tours = await Tour.findAll({ where: { agency_id: agency.id } });
    const tourIds = tours.map(t => t.id);
    if (tourIds.length === 0) {
      return res.json([]);
    }

    // 3. Lấy tất cả booking của các tour này
    const bookings = await Booking.findAll({
      where: { tour_id: tourIds },
      include: [
        { model: Tour, as: 'tour' },
        { model: User, as: 'user' },
        { model: DepartureDate, as: 'departureDate' },
        { model: Payment, as: 'payment' }
      ]
    });
    res.json(bookings);
  } catch (error) {
    console.error("Error getting agency bookings:", error);
    res.status(500).json({ error: "Lỗi lấy danh sách booking" });
  }
};

// GET /agency/bookings/:id - Get agency booking detail
exports.getMyBookingById = async (req, res) => {
  try {
    const agencyId = await getAgencyId(req.user.id);
    if (!agencyId) {
      return res.status(403).json({ error: "Không tìm thấy agency" });
    }

    const { id } = req.params;
    
    const booking = await Booking.findByPk(id, {
      include: [
        { 
          model: Tour, 
          as: 'tour',
          where: { agency_id: agencyId }, // Ensure booking belongs to agency
          include: [
            { model: require("../models").TourImage, as: 'images', limit: 1 }
          ]
        },
        { 
          model: User, 
          as: 'user', 
          attributes: ['id', 'name', 'email'] 
        },
        {
          model: DepartureDate,
          as: 'departureDate'
        },
        {
          model: Promotion,
          as: 'promotion'
        },
        {
          model: Payment,
          as: 'payment'
        },
        {
          model: require("../models").InformationBookingTour,
          as: 'guests'
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy booking hoặc booking không thuộc agency của bạn" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error getting agency booking by id:", error);
    res.status(500).json({ error: "Lỗi lấy chi tiết booking" });
  }
};

// PUT /agency/bookings/:id/status - Update booking status (agency can only confirm/cancel)
exports.updateMyBookingStatus = async (req, res) => {
  try {
    const agencyId = await getAgencyId(req.user.id);
    if (!agencyId) {
      return res.status(403).json({ error: "Không tìm thấy agency" });
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    // Agency can only confirm or cancel pending bookings
    const validStatuses = ['confirmed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Agency chỉ có thể xác nhận hoặc hủy booking" });
    }

    const booking = await Booking.findByPk(id, {
      include: [{
        model: Tour,
        as: 'tour',
        where: { agency_id: agencyId }
      }]
    });

    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy booking hoặc booking không thuộc agency của bạn" });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: "Chỉ có thể thay đổi trạng thái booking đang pending" });
    }

    await booking.update({ 
      status,
      agency_note: reason,
      updated_at: new Date()
    });

    res.json({ 
      message: "Cập nhật trạng thái thành công",
      booking: booking
    });
  } catch (error) {
    console.error("Error updating agency booking status:", error);
    res.status(500).json({ error: "Lỗi cập nhật trạng thái booking" });
  }
};

// GET /agency/bookings/customers - Get agency's customers
exports.getMyCustomers = async (req, res) => {
  try {
    const agencyId = await getAgencyId(req.user.id);
    if (!agencyId) {
      return res.status(403).json({ error: "Không tìm thấy agency" });
    }

    const customers = await User.findAll({
      attributes: ['id', 'name', 'email'],
      include: [{
        model: Booking,
        as: 'bookings',
        attributes: ['id', 'status', 'total_price', 'created_at'],
        include: [{
          model: Tour,
          as: 'tour',
          where: { agency_id: agencyId },
          attributes: ['id', 'name']
        }],
        required: true
      }],
      group: ['User.id'],
      order: [['bookings', 'created_at', 'DESC']]
    });

    // Calculate customer stats
    const customerStats = customers.map(customer => {
      const bookings = customer.bookings;
      const totalBookings = bookings.length;
      const totalSpent = bookings
        .filter(b => b.status === 'confirmed')
        .reduce((sum, b) => sum + parseFloat(b.total_price), 0);
      
      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        totalBookings,
        totalSpent,
        lastBookingDate: bookings[0]?.created_at
      };
    });

    res.json(customerStats);
  } catch (error) {
    console.error("Error getting agency customers:", error);
    res.status(500).json({ error: "Lỗi lấy danh sách khách hàng" });
  }
};

// GET /agency/bookings/reviews - Get reviews for agency's tours
exports.getMyBookingReviews = async (req, res) => {
  try {
    // Sử dụng logic tương tự getMyBookings
    console.log("User ID from token:", req.user.id);
    const agency = await Agency.findOne({ where: { user_id: req.user.id, status: 'approved' } });
    console.log("Agency found for reviews:", agency);
    if (!agency) {
      return res.status(403).json({ error: 'Chỉ agency đã được duyệt mới có quyền thao tác' });
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const reviews = await Review.findAndCountAll({
      include: [{
        model: Tour,
        as: 'tour',
        where: { agency_id: agency.id },
        attributes: ['id', 'name']
      }, {
        model: User,
        as: 'user',
        attributes: ['id', 'name']
      }],
      limit: parseInt(limit),
      offset: offset,
      order: [['review_date', 'DESC']]
    });

    res.json({
      reviews: reviews.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(reviews.count / limit),
        totalReviews: reviews.count,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error getting agency reviews:", error);
    res.status(500).json({ error: "Lỗi lấy danh sách đánh giá" });
  }
};
