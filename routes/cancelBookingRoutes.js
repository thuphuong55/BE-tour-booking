const express = require("express");
const router = express.Router();
const cancelBookingController = require("../controllers/cancelBookingController");
const { protect } = require("../middlewares/auth");

// TEST endpoint - Siêu đơn giản để debug JSON
router.get("/test-json", (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  res.end('{"success": true, "message": "Simple test"}');
});

// TEST endpoint - Mock cancel-info success response
router.get("/mock/cancel-info", (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  
  const response = {
    success: true,
    data: {
      booking: {
        id: "mock-booking-id",
        tour_name: "Mock Tour - Đà Lạt 3N2Đ",
        status: "confirmed",
        total_price: "5000000.00",
        departure_date: "2025-08-15"
      },
      cancelPolicy: {
        days_until_departure: 16,
        refund_percentage: 80,
        refund_amount: 4000000,
        can_cancel: true
      }
    }
  };
router.put("/:id", cancelBookingController.cancelBooking);
  res.end(JSON.stringify(response));
});

// TEST endpoint - Simple health check
router.get("/health", (req, res) => {
  console.log(`🏥 Health check endpoint hit`);
  console.log(`🏥 Request method: ${req.method}`);
  console.log(`🏥 Request URL: ${req.url}`);
  
  try {
    res.setHeader('Content-Type', 'application/json');
    res.status(200);
    
    const response = {
      success: true,
      message: "Cancel booking API is working",
      timestamp: new Date().toISOString(),
      server: "OK"
    };
    
    console.log(`🏥 Sending response:`, response);
    res.end(JSON.stringify(response));
  } catch (error) {
    console.error(`🏥 Health check error:`, error);
    res.status(500).json({ error: error.message });
  }
});

// TEST endpoint - Debug request
router.all("/debug-request", (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  
  const response = {
    success: true,
    debug: {
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
      url: req.url,
      originalUrl: req.originalUrl,
      contentType: req.get('Content-Type'),
      bodySize: req.body ? JSON.stringify(req.body).length : 0
    }
  };
  
  res.end(JSON.stringify(response));
});

// TEST endpoint - Lấy danh sách booking để test
router.get("/test-list", async (req, res) => {
  try {
    const { Booking, Tour, DepartureDate } = require("../models");
    
    const bookings = await Booking.findAll({
      limit: 10,
      include: [
        { 
          model: Tour, 
          as: 'tour',
          attributes: ['id', 'name'],
          required: false
        },
        { 
          model: DepartureDate, 
          as: 'departureDate',
          attributes: ['departure_date'],
          required: false
        }
      ],
      attributes: ['id', 'status', 'total_price', 'tour_id', 'departure_date_id']
    });

    return res.json({
      success: true,
      data: bookings.map(booking => ({
        id: booking.id,
        status: booking.status,
        total_price: booking.total_price,
        tour_id: booking.tour_id,
        departure_date_id: booking.departure_date_id,
        has_tour: !!booking.tour,
        has_departure_date: !!booking.departureDate,
        tour_name: booking.tour?.name,
        departure_date: booking.departureDate?.departure_date
      }))
    });

  } catch (error) {
    return res.json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
});

// TEST endpoint - Kiểm tra booking tồn tại (không cần auth)
router.get("/:id/test", async (req, res) => {
  try {
    const { Booking, Tour, DepartureDate } = require("../models");
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Tour, as: 'tour', attributes: ['id', 'name'] },
        { model: DepartureDate, as: 'departureDate', attributes: ['departure_date'] }
      ]
    });
    
    if (!booking) {
      return res.json({
        success: false,
        message: "Booking không tồn tại",
        booking_id: req.params.id
      });
    }
    
    return res.json({
      success: true,
      message: "Booking tồn tại",
      data: {
        booking_id: booking.id,
        tour_name: booking.tour?.name,
        status: booking.status,
        departure_date: booking.departureDate?.departure_date
      }
    });
  } catch (error) {
    return res.json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
});

// TEST endpoint - Kiểm tra chính sách hủy (không cần auth)
router.get("/:id/cancel-info", async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { Booking, Tour, DepartureDate } = require("../models");
    
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { 
          model: Tour, 
          as: 'tour',
          attributes: ['id', 'name'],
          required: false // Cho phép null
        },
        { 
          model: DepartureDate, 
          as: 'departureDate',
          attributes: ['departure_date'],
          required: false // Cho phép null
        }
      ]
    });

    if (!booking) {
      const errorResponse = {
        success: false,
        message: "Booking không tồn tại"
      };
      res.status(200);
      return res.end(JSON.stringify(errorResponse));
    }

    if (booking.status === 'cancelled') {
      const errorResponse = {
        success: false,
        message: "Booking đã bị hủy trước đó"
      };
      res.status(200);
      return res.end(JSON.stringify(errorResponse));
    }

    if (!booking.tour) {
      const errorResponse = {
        success: false,
        message: "Tour không tồn tại hoặc đã bị xóa",
        debug: {
          booking_id: booking.id,
          tour_id: booking.tour_id,
          status: booking.status
        }
      };
      res.status(200);
      return res.end(JSON.stringify(errorResponse));
    }

    if (!booking.departureDate) {
      const errorResponse = {
        success: false,
        message: "Ngày khởi hành không tồn tại",
        debug: {
          booking_id: booking.id,
          departure_date_id: booking.departure_date_id,
          tour_name: booking.tour?.name
        }
      };
      res.status(200);
      return res.end(JSON.stringify(errorResponse));
    }

    // Tính toán refund percentage
    const departureDate = new Date(booking.departureDate.departure_date);
    const currentDate = new Date();
    const daysUntilDeparture = Math.ceil((departureDate - currentDate) / (1000 * 60 * 60 * 24));
    
    let refundPercentage = 0;
    if (daysUntilDeparture >= 7) {
      refundPercentage = 80;
    } else if (daysUntilDeparture >= 3) {
      refundPercentage = 50;
    } else {
      refundPercentage = 0;
    }

    const refundAmount = Math.round((booking.total_price * refundPercentage) / 100);

    const successResponse = {
      success: true,
      data: {
        booking: {
          id: booking.id,
          tour_name: booking.tour.name,
          status: booking.status,
          total_price: booking.total_price,
          departure_date: booking.departureDate.departure_date
        },
        cancelPolicy: {
          days_until_departure: daysUntilDeparture,
          refund_percentage: refundPercentage,
          refund_amount: refundAmount,
          can_cancel: daysUntilDeparture >= 0
        }
      }
    };
    
    res.status(200);
    res.end(JSON.stringify(successResponse));

  } catch (error) {
    const errorResponse = {
      success: false,
      message: "Lỗi server",
      error: error.message,
      stack: error.stack
    };
    res.status(500);
    res.end(JSON.stringify(errorResponse));
  }
});

// TEST endpoint - Thực hiện hủy booking (không cần auth)
router.put("/:id/test-cancel", async (req, res) => {
  try {
    const { Booking, Tour, DepartureDate, Refund, sequelize } = require("../models");
    
    const transaction = await sequelize.transaction();
    
    try {
      // Tìm booking
      const booking = await Booking.findByPk(req.params.id, {
        include: [
          { 
            model: Tour, 
            as: 'tour',
            attributes: ['id', 'name']
          },
          { 
            model: DepartureDate, 
            as: 'departureDate',
            attributes: ['departure_date']
          }
        ],
        transaction
      });

      if (!booking) {
        await transaction.rollback();
        return res.json({
          success: false,
          message: "Booking không tồn tại"
        });
      }

      if (booking.status === 'cancelled') {
        await transaction.rollback();
        return res.json({
          success: false,
          message: "Booking đã bị hủy trước đó"
        });
      }

      // Tính toán refund
      const departureDate = new Date(booking.departureDate.departure_date);
      const currentDate = new Date();
      const daysUntilDeparture = Math.ceil((departureDate - currentDate) / (1000 * 60 * 60 * 24));
      
      let refundPercentage = 0;
      if (daysUntilDeparture >= 7) {
        refundPercentage = 80;
      } else if (daysUntilDeparture >= 3) {
        refundPercentage = 50;
      } else {
        refundPercentage = 0;
      }

      const refundAmount = Math.round((booking.total_price * refundPercentage) / 100);

      // Cập nhật booking status
      await booking.update({
        status: 'cancelled'
      }, { transaction });

      // Tạo refund record
      const refund = await Refund.create({
        booking_id: booking.id,
        user_id: booking.user_id,
        amount: refundAmount,
        status: 'pending',
        reason: req.body.reason || 'Test cancel booking',
        created_by: 'system', 
        admin_notes: `Auto refund: ${refundPercentage}% - ${daysUntilDeparture} days before departure`
      }, { transaction });

      await transaction.commit();

      return res.json({
        success: true,
        message: "Booking đã được hủy thành công",
        data: {
          booking_id: booking.id,
          tour_name: booking.tour.name,
          original_amount: booking.total_price,
          refund_amount: refundAmount,
          refund_percentage: refundPercentage,
          refund_id: refund.id,
          status: 'cancelled'
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    return res.json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
});


// PUT /api/cancel-booking/:id - Hủy booking
 router.put("/:id", cancelBookingController.cancelBooking);

module.exports = router;