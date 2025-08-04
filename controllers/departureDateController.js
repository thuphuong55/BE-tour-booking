const { DepartureDate, Booking, User, InformationBookingTour, Tour } = require("../models");
const generateCrudController = require("./generateCrudController");

// GET /api/departure-dates (phân quyền, phân trang, lọc theo agency)
const getAllDepartureDates = async (req, res) => {
  console.log("🎯 [CONTROLLER] getAllDepartureDates CONTROLLER CALLED!");
  try {
    console.log('[DEBUG-DEPARTURE] User from req.user:', {
      id: req.user?.id,
      email: req.user?.email,
      role: req.user?.role,
      fullUser: req.user
    });
    
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    // Nếu là agency, chỉ lấy departure dates của tour agency sở hữu
    if (req.user && req.user.role === 'agency') {
      const { Agency } = require("../models");
      const agency = await Agency.findOne({ where: { user_id: req.user.id } });
      console.log('[DEBUG-DEPARTURE] Agency found for user_id', req.user.id, ':', agency?.id);
      
      if (agency) {
        const tours = await Tour.findAll({ where: { agency_id: agency.id }, attributes: ['id'] });
        whereClause.tour_id = tours.map(t => t.id);
        console.log('[DEBUG-DEPARTURE] Tours for agency:', whereClause.tour_id);
      } else {
        // Nếu không tìm thấy agency, trả về rỗng
        console.log('[DEBUG-DEPARTURE] No agency found for user_id:', req.user.id);
        return res.json({ data: [], pagination: { total: 0, page: Number(page), limit: Number(limit) } });
      }
    } else if (req.query.tour_id) {
      whereClause.tour_id = req.query.tour_id;
    }

    const { count, rows } = await DepartureDate.findAndCountAll({
      where: whereClause,
      order: [["departure_date", "ASC"]],
      limit: Number(limit),
      offset: Number(offset),
      include: [{ model: Tour, as: "tour", attributes: ["id", "name", "agency_id"] }]
    });
    res.json({
      data: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi lấy danh sách ngày khởi hành', details: err.message });
  }
};

// Custom create với phân quyền agency
const create = async (req, res) => {
  try {
    console.log('[CREATE DEPARTURE] Request received:', req.body);
    console.log('[CREATE DEPARTURE] User:', req.user);

    if (!req.user) {
      console.log('[CREATE DEPARTURE] No user found, returning 401');
      return res.status(401).json({ error: 'Bạn chưa đăng nhập' });
    }
    
    console.log('[CREATE DEPARTURE] User role:', req.user.role);
    
    // Kiểm tra quyền: agency chỉ có thể tạo departure date cho tour mình sở hữu
    if (req.user.role === 'agency') {
      if (!req.body.tour_id) {
        console.log('[CREATE DEPARTURE] Missing tour_id');
        return res.status(400).json({ error: 'tour_id là bắt buộc' });
      }

      console.log('[CREATE DEPARTURE] Finding tour:', req.body.tour_id);
      const tour = await Tour.findByPk(req.body.tour_id);
      if (!tour) {
        console.log('[CREATE DEPARTURE] Tour not found');
        return res.status(404).json({ error: 'Tour không tồn tại' });
      }

      // Lấy agency_id từ user - cần tìm agency record
      console.log('[CREATE DEPARTURE] Finding agency for user:', req.user.id);
      const { Agency } = require("../models");
      const agency = await Agency.findOne({ where: { user_id: req.user.id } });
      
      if (!agency) {
        console.log('[CREATE DEPARTURE] Agency not found for user');
        return res.status(403).json({ error: 'Không tìm thấy agency cho user này' });
      }

      console.log('[CREATE DEPARTURE] Tour agency_id:', tour.agency_id, 'User agency_id:', agency.id);
      if (tour.agency_id !== agency.id) {
        console.log('[CREATE DEPARTURE] Permission denied');
        console.log('[CREATE DEPARTURE] Sending 403 response...');
        const errorResponse = { error: 'Bạn không có quyền tạo ngày khởi hành cho tour này' };
        console.log('[CREATE DEPARTURE] Response data:', errorResponse);
        return res.status(403).json(errorResponse);
      }
    }

    console.log('[CREATE DEPARTURE] Creating departure date:', req.body);
    const departureDate = await DepartureDate.create(req.body);
    console.log('[CREATE DEPARTURE] Created successfully:', departureDate.id);
    res.status(201).json(departureDate);
  } catch (err) {
    console.error('[CREATE DEPARTURE] Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Custom update với phân quyền agency
const update = async (req, res) => {
  try {
    const departureDate = await DepartureDate.findByPk(req.params.id, {
      include: [{ model: Tour, as: 'tour', attributes: ['agency_id'] }]
    });

    if (!departureDate) {
      return res.status(404).json({ error: 'Ngày khởi hành không tồn tại' });
    }

    // Kiểm tra quyền: agency chỉ có thể update departure date của tour mình sở hữu
    if (req.user.role === 'agency') {
      const { Agency } = require("../models");
      const agency = await Agency.findOne({ where: { user_id: req.user.id } });
      
      if (!agency) {
        return res.status(403).json({ error: 'Không tìm thấy agency cho user này' });
      }

      if (departureDate.tour.agency_id !== agency.id) {
        return res.status(403).json({ error: 'Bạn không có quyền sửa ngày khởi hành này' });
      }
    }

    await departureDate.update(req.body);
    const updatedDepartureDate = await DepartureDate.findByPk(req.params.id);
    res.json(updatedDepartureDate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Custom delete với phân quyền agency
const deleteDepartureDate = async (req, res) => {
  try {
    const departureDate = await DepartureDate.findByPk(req.params.id, {
      include: [{ model: Tour, as: 'tour', attributes: ['agency_id'] }]
    });

    if (!departureDate) {
      return res.status(404).json({ error: 'Ngày khởi hành không tồn tại' });
    }

    // Kiểm tra quyền: agency chỉ có thể xóa departure date của tour mình sở hữu
    if (req.user.role === 'agency') {
      const { Agency } = require("../models");
      const agency = await Agency.findOne({ where: { user_id: req.user.id } });
      console.log(`[DELETE DEPARTURE] agency_id from user: ${agency ? agency.id : 'null'}`);
      console.log(`[DELETE DEPARTURE] agency_id from tour: ${departureDate.tour.agency_id}`);
      if (!agency) {
        return res.status(403).json({ error: 'Không tìm thấy agency cho user này' });
      }
      if (departureDate.tour.agency_id !== agency.id) {
        return res.status(403).json({ error: 'Bạn không có quyền xóa ngày khởi hành này',
          debug: {
            agency_id_user: agency.id,
            agency_id_tour: departureDate.tour.agency_id
          }
        });
      }
    }

    await departureDate.destroy();
    res.json({ message: "Đã xoá thành công" });
  } catch (err) {
    console.error("Lỗi delete:", err);
    res.status(500).json({ message: "Xoá thất bại", error: err.message });
  }
};

// Định nghĩa lại hàm getBookingsByDepartureDate cho export
const getBookingsByDepartureDate = async (req, res) => {
  try {
    console.log('[DEBUG-BOOKINGS] getBookingsByDepartureDate called with:', {
      id: req.params.id,
      userId: req.user?.id,
      userRole: req.user?.role,
      userEmail: req.user?.email
    });
    
    const { id } = req.params;
    // Kiểm tra quyền: agency chỉ có thể xem booking của departure date thuộc tour mình sở hữu
    if (req.user && req.user.role === 'agency') {
      console.log('[DEBUG-BOOKINGS] Agency user detected, checking permissions...');
      
      const departureDate = await DepartureDate.findByPk(id, {
        include: [{ model: Tour, as: 'tour', attributes: ['agency_id'] }]
      });
      if (!departureDate) {
        console.log('[DEBUG-BOOKINGS] Departure date not found:', id);
        return res.status(404).json({ error: 'Ngày khởi hành không tồn tại' });
      }
      
      console.log('[DEBUG-BOOKINGS] Found departure date:', {
        id: departureDate.id,
        tourId: departureDate.tour_id,
        tourAgencyId: departureDate.tour?.agency_id
      });
      
      const { Agency } = require("../models");
      const agency = await Agency.findOne({ where: { user_id: req.user.id } });
      
      console.log('[DEBUG-BOOKINGS] Found agency for user:', {
        userId: req.user.id,
        agencyId: agency?.id,
        agencyName: agency?.name
      });
      
      if (!agency) {
        console.log('[DEBUG-BOOKINGS] No agency found for user');
        return res.status(403).json({ error: 'Không tìm thấy agency cho user này' });
      }

      console.log('[DEBUG-BOOKINGS] Permission check:', {
        tourAgencyId: departureDate.tour.agency_id,
        userAgencyId: agency.id,
        match: departureDate.tour.agency_id === agency.id
      });

      if (departureDate.tour.agency_id !== agency.id) {
        console.log('[DEBUG-BOOKINGS] Permission denied - agency mismatch');
        return res.status(403).json({ error: 'Bạn không có quyền xem booking này' });
      }
      
      console.log('[DEBUG-BOOKINGS] Permission granted, fetching bookings...');
    }
    const bookings = await Booking.findAll({
      where: { departure_date_id: id },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: InformationBookingTour, as: 'guests', attributes: ['id', 'name', 'email'] }
      ]
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy danh sách booking theo ngày khởi hành' });
  }
};

// Hàm getById cho departure date
const getById = async (req, res) => {
  try {
    const departureDate = await DepartureDate.findByPk(req.params.id, {
      include: [{ model: Tour, as: "tour", attributes: ["id", "name", "agency_id"] }]
    });
    if (!departureDate) {
      return res.status(404).json({ error: 'Ngày khởi hành không tồn tại' });
    }
    // Nếu là agency, chỉ trả về nếu tour thuộc agency đó
    if (req.user && req.user.role === 'agency') {
      const { Agency } = require("../models");
      const agency = await Agency.findOne({ where: { user_id: req.user.id } });
      if (!agency || departureDate.tour.agency_id !== agency.id) {
        return res.status(403).json({ error: 'Bạn không có quyền xem ngày khởi hành này' });
      }
    }
    res.json(departureDate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllDepartureDates,
  getById,
  create,
  update,
  delete: deleteDepartureDate,
  getBookingsByDepartureDate
};

