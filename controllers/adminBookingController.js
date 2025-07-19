const { Booking, Tour, Payment, User, DepartureDate, Promotion, sequelize } = require("../models");
const { Op } = require("sequelize");

// GET /admin/bookings/stats - Dashboard statistics
exports.getBookingStats = async (req, res) => {
  try {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const stats = await Promise.all([
      // Total bookings
      Booking.count(),
      
      // This month bookings
      Booking.count({
        where: {
          created_at: { [Op.gte]: firstDayOfMonth }
        }
      }),
      
      // Pending bookings
      Booking.count({
        where: { status: 'pending' }
      }),
      
      // Confirmed bookings
      Booking.count({
        where: { status: 'confirmed' }
      }),
      
      // Cancelled bookings
      Booking.count({
        where: { status: 'cancelled' }
      }),
      
      // Recent bookings
      Booking.findAll({
        limit: 5,
        order: [['created_at', 'DESC']],
        include: [
          { model: Tour, as: 'tour', attributes: ['id', 'name'] },
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
        ]
      })
    ]);

    res.json({
      totalBookings: stats[0],
      thisMonthBookings: stats[1],
      pendingBookings: stats[2],
      confirmedBookings: stats[3],
      cancelledBookings: stats[4],
      recentBookings: stats[5]
    });
  } catch (error) {
    console.error("Error getting booking stats:", error);
    res.status(500).json({ error: "Lỗi lấy thống kê booking" });
  }
};

// GET /admin/bookings/revenue - Revenue statistics
exports.getRevenueStats = async (req, res) => {
  try {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

    const revenueStats = await Promise.all([
      // Total revenue
      Booking.sum('total_price', {
        where: { status: 'confirmed' }
      }),
      
      // This month revenue
      Booking.sum('total_price', {
        where: {
          status: 'confirmed',
          created_at: { [Op.gte]: firstDayOfMonth }
        }
      }),
      
      // This year revenue
      Booking.sum('total_price', {
        where: {
          status: 'confirmed',
          created_at: { [Op.gte]: firstDayOfYear }
        }
      }),
      
      // Monthly revenue chart data
      sequelize.query(`
        SELECT 
          MONTH(created_at) as month,
          YEAR(created_at) as year,
          SUM(total_price) as revenue,
          COUNT(*) as bookings
        FROM booking 
        WHERE status = 'confirmed' 
          AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY year, month
      `, { type: sequelize.QueryTypes.SELECT })
    ]);

    res.json({
      totalRevenue: revenueStats[0] || 0,
      thisMonthRevenue: revenueStats[1] || 0,
      thisYearRevenue: revenueStats[2] || 0,
      monthlyChart: revenueStats[3]
    });
  } catch (error) {
    console.error("Error getting revenue stats:", error);
    res.status(500).json({ error: "Lỗi lấy thống kê doanh thu" });
  }
};

// GET /admin/bookings - Get all bookings with filters
exports.getAllBookings = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      search, 
      tour_id,
      date_from,
      date_to,
      agency_id,
      sort = 'created_at',
      order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Filters
    if (status) whereClause.status = status;
    if (tour_id) whereClause.tour_id = tour_id;
    if (agency_id) whereClause.agency_id = agency_id;
    if (date_from || date_to) {
      whereClause.created_at = {};
      if (date_from) whereClause.created_at[Op.gte] = new Date(date_from);
      if (date_to) whereClause.created_at[Op.lte] = new Date(date_to);
    }

    // Search in user name, email, tour name
    const searchClause = search ? {
      [Op.or]: [
        { '$user.name$': { [Op.like]: `%${search}%` } },
        { '$user.email$': { [Op.like]: `%${search}%` } },
        { '$tour.name$': { [Op.like]: `%${search}%` } }
      ]
    } : {};

    const bookings = await Booking.findAndCountAll({
      where: { ...whereClause, ...searchClause },
      include: [
        { 
          model: Tour, 
          as: 'tour', 
          attributes: ['id', 'name', 'price', 'destination'] 
        },
        { 
          model: User, 
          as: 'user', 
          attributes: ['id', 'name', 'email', 'phone'] 
        },
        {
          model: DepartureDate,
          as: 'departureDate',
          attributes: ['departure_date', 'number_of_days']
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['id', 'amount', 'payment_method', 'status']
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [[sort, order.toUpperCase()]],
      distinct: true
    });

    res.json({
      bookings: bookings.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(bookings.count / limit),
        totalBookings: bookings.count,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error getting all bookings:", error);
    res.status(500).json({ error: "Lỗi lấy danh sách booking" });
  }
};

// GET /admin/bookings/:id - Get booking detail
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findByPk(id, {
      include: [
        { 
          model: Tour, 
          as: 'tour',
          include: [
            { model: require("../models").TourImage, as: 'images', limit: 1 }
          ]
        },
        { 
          model: User, 
          as: 'user', 
          attributes: ['id', 'name', 'email', 'phone', 'address'] 
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
      return res.status(404).json({ error: "Không tìm thấy booking" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error getting booking by id:", error);
    res.status(500).json({ error: "Lỗi lấy chi tiết booking" });
  }
};

// PUT /admin/bookings/:id/status - Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['pending', 'confirmed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Trạng thái không hợp lệ" });
    }

    const booking = await Booking.findByPk(id);
    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy booking" });
    }

    await booking.update({ 
      status,
      admin_note: reason,
      updated_at: new Date()
    });

    // Log activity
    console.log(`Admin updated booking ${id} status to ${status}. Reason: ${reason}`);

    res.json({ 
      message: "Cập nhật trạng thái thành công",
      booking: booking
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ error: "Lỗi cập nhật trạng thái booking" });
  }
};

// DELETE /admin/bookings/:id - Delete booking
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findByPk(id);
    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy booking" });
    }

    // Check if booking can be deleted (không thể xóa booking đã confirmed)
    if (booking.status === 'confirmed') {
      return res.status(400).json({ error: "Không thể xóa booking đã được xác nhận" });
    }

    await booking.destroy();
    res.json({ message: "Xóa booking thành công" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ error: "Lỗi xóa booking" });
  }
};

// PUT /admin/bookings/bulk/status - Bulk update status
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { booking_ids, status, reason } = req.body;

    if (!Array.isArray(booking_ids) || booking_ids.length === 0) {
      return res.status(400).json({ error: "Danh sách booking_ids không hợp lệ" });
    }

    const validStatuses = ['pending', 'confirmed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Trạng thái không hợp lệ" });
    }

    const updated = await Booking.update(
      { 
        status,
        admin_note: reason,
        updated_at: new Date()
      },
      {
        where: { id: { [Op.in]: booking_ids } }
      }
    );

    res.json({ 
      message: `Cập nhật ${updated[0]} booking thành công`,
      updatedCount: updated[0]
    });
  } catch (error) {
    console.error("Error bulk updating booking status:", error);
    res.status(500).json({ error: "Lỗi cập nhật hàng loạt" });
  }
};

// DELETE /admin/bookings/bulk - Bulk delete bookings
exports.bulkDeleteBookings = async (req, res) => {
  try {
    const { booking_ids } = req.body;

    if (!Array.isArray(booking_ids) || booking_ids.length === 0) {
      return res.status(400).json({ error: "Danh sách booking_ids không hợp lệ" });
    }

    // Only allow deleting pending/cancelled bookings
    const deleted = await Booking.destroy({
      where: { 
        id: { [Op.in]: booking_ids },
        status: { [Op.ne]: 'confirmed' }
      }
    });

    res.json({ 
      message: `Xóa ${deleted} booking thành công`,
      deletedCount: deleted
    });
  } catch (error) {
    console.error("Error bulk deleting bookings:", error);
    res.status(500).json({ error: "Lỗi xóa hàng loạt" });
  }
};

// GET /admin/bookings/export/csv - Export bookings to CSV
exports.exportBookingsCSV = async (req, res) => {
  try {
    const { status, date_from, date_to, agency_id } = req.query;
    
    const whereClause = {};
    if (status) whereClause.status = status;
    if (agency_id) whereClause.agency_id = agency_id;
    if (date_from || date_to) {
      whereClause.created_at = {};
      if (date_from) whereClause.created_at[Op.gte] = new Date(date_from);
      if (date_to) whereClause.created_at[Op.lte] = new Date(date_to);
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        { model: Tour, as: 'tour', attributes: ['name', 'destination'] },
        { model: User, as: 'user', attributes: ['name', 'email', 'phone'] },
        { model: DepartureDate, as: 'departureDate', attributes: ['departure_date'] }
      ],
      order: [['created_at', 'DESC']]
    });

    // Generate CSV content
    const csvHeader = 'ID,Tour Name,Customer Name,Email,Phone,Total Price,Status,Booking Date,Departure Date\n';
    const csvData = bookings.map(booking => {
      return [
        booking.id,
        booking.tour?.name || '',
        booking.user?.name || '',
        booking.user?.email || '',
        booking.user?.phone || '',
        booking.total_price,
        booking.status,
        booking.created_at,
        booking.departureDate?.departure_date || ''
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bookings_export.csv');
    res.send(csv);
  } catch (error) {
    console.error("Error exporting bookings CSV:", error);
    res.status(500).json({ error: "Lỗi xuất dữ liệu CSV" });
  }
};
