const { Booking, Tour, Agency, CommissionSetting, User } = require('../models');
const { Op } = require('sequelize');

const dashboardCommissionController = {
  /**
   * Dashboard Admin - Tổng quan hoa hồng
   * GET /api/admin/dashboard/commission-overview
   */
  async getAdminCommissionOverview(req, res) {
    try {
      const { period = 'month' } = req.query; // month, quarter, year
      
      let dateFilter = {};
      const now = new Date();
      
      switch (period) {
        case 'month':
          dateFilter = {
            commission_calculated_at: {
              [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1),
              [Op.lte]: now
            }
          };
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          dateFilter = {
            commission_calculated_at: {
              [Op.gte]: new Date(now.getFullYear(), quarter * 3, 1),
              [Op.lte]: now
            }
          };
          break;
        case 'year':
          dateFilter = {
            commission_calculated_at: {
              [Op.gte]: new Date(now.getFullYear(), 0, 1),
              [Op.lte]: now
            }
          };
          break;
      }

      // Tổng quan hoa hồng
      const commissionOverview = await Booking.findOne({
        where: {
          status: 'confirmed',
          commission_calculated_at: { [Op.not]: null },
          ...dateFilter
        },
        attributes: [
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total_bookings'],
          [require('sequelize').fn('SUM', require('sequelize').col('total_price')), 'total_revenue'],
          [require('sequelize').fn('SUM', require('sequelize').col('admin_commission')), 'total_admin_commission'],
          [require('sequelize').fn('SUM', require('sequelize').col('agency_amount')), 'total_agency_amount'],
          [require('sequelize').fn('AVG', require('sequelize').col('commission_rate')), 'avg_commission_rate']
        ],
        raw: true
      });

      // Top 5 agencies theo hoa hồng
      const topAgencies = await Booking.findAll({
        where: {
          status: 'confirmed',
          commission_calculated_at: { [Op.not]: null },
          ...dateFilter
        },
        include: [{
          model: Tour,
          as: 'tour',
          include: [{
            model: Agency,
            as: 'agency',
            attributes: ['id', 'name']
          }]
        }],
        attributes: [
          [require('sequelize').fn('COUNT', require('sequelize').col('Booking.id')), 'booking_count'],
          [require('sequelize').fn('SUM', require('sequelize').col('total_price')), 'total_revenue'],
          [require('sequelize').fn('SUM', require('sequelize').col('admin_commission')), 'admin_commission']
        ],
        group: ['tour.agency.id', 'tour.agency.name'],
        order: [[require('sequelize').fn('SUM', require('sequelize').col('admin_commission')), 'DESC']],
        limit: 5,
        raw: false
      });

      // Biểu đồ hoa hồng theo tháng (12 tháng gần nhất)
      const monthlyCommissions = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthData = await Booking.findOne({
          where: {
            status: 'confirmed',
            commission_calculated_at: {
              [Op.gte]: monthStart,
              [Op.lte]: monthEnd
            }
          },
          attributes: [
            [require('sequelize').fn('SUM', require('sequelize').col('admin_commission')), 'admin_commission'],
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'booking_count']
          ],
          raw: true
        });

        monthlyCommissions.push({
          month: monthStart.toISOString().slice(0, 7), // YYYY-MM
          admin_commission: parseFloat(monthData.admin_commission || 0),
          booking_count: parseInt(monthData.booking_count || 0)
        });
      }

      res.status(200).json({
        success: true,
        data: {
          overview: {
            total_bookings: parseInt(commissionOverview.total_bookings || 0),
            total_revenue: parseFloat(commissionOverview.total_revenue || 0),
            total_admin_commission: parseFloat(commissionOverview.total_admin_commission || 0),
            total_agency_amount: parseFloat(commissionOverview.total_agency_amount || 0),
            avg_commission_rate: parseFloat(commissionOverview.avg_commission_rate || 15)
          },
          top_agencies: topAgencies.map(item => ({
            agency_id: item.tour?.agency?.id,
            agency_name: item.tour?.agency?.name,
            booking_count: parseInt(item.dataValues.booking_count),
            total_revenue: parseFloat(item.dataValues.total_revenue),
            admin_commission: parseFloat(item.dataValues.admin_commission)
          })),
          monthly_chart: monthlyCommissions,
          period: period
        }
      });

    } catch (error) {
      console.error('Lỗi admin commission overview:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy tổng quan hoa hồng',
        error: error.message
      });
    }
  },

  /**
   * Dashboard Agency - Thống kê hoa hồng agency
   * GET /api/agency/dashboard/commission-stats
   */
  async getAgencyCommissionStats(req, res) {
    try {
      const agencyId = req.user.id; // Từ JWT token
      const { period = 'month' } = req.query;

      let dateFilter = {};
      const now = new Date();
      
      switch (period) {
        case 'month':
          dateFilter = {
            commission_calculated_at: {
              [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1),
              [Op.lte]: now
            }
          };
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          dateFilter = {
            commission_calculated_at: {
              [Op.gte]: new Date(now.getFullYear(), quarter * 3, 1),
              [Op.lte]: now
            }
          };
          break;
      }

      // Thống kê cho agency
      const agencyStats = await Booking.findOne({
        include: [{
          model: Tour,
          as: 'tour',
          where: { agency_id: agencyId }
        }],
        where: {
          status: 'confirmed',
          commission_calculated_at: { [Op.not]: null },
          ...dateFilter
        },
        attributes: [
          [require('sequelize').fn('COUNT', require('sequelize').col('Booking.id')), 'total_bookings'],
          [require('sequelize').fn('SUM', require('sequelize').col('total_price')), 'total_revenue'],
          [require('sequelize').fn('SUM', require('sequelize').col('admin_commission')), 'admin_commission_paid'],
          [require('sequelize').fn('SUM', require('sequelize').col('agency_amount')), 'agency_earnings'],
          [require('sequelize').fn('AVG', require('sequelize').col('commission_rate')), 'avg_commission_rate']
        ],
        raw: true
      });

      // Top tours của agency theo earnings
      const topTours = await Booking.findAll({
        include: [{
          model: Tour,
          as: 'tour',
          where: { agency_id: agencyId },
          attributes: ['id', 'name', 'location']
        }],
        where: {
          status: 'confirmed',
          commission_calculated_at: { [Op.not]: null },
          ...dateFilter
        },
        attributes: [
          [require('sequelize').fn('COUNT', require('sequelize').col('Booking.id')), 'booking_count'],
          [require('sequelize').fn('SUM', require('sequelize').col('agency_amount')), 'agency_earnings']
        ],
        group: ['tour.id', 'tour.name', 'tour.location'],
        order: [[require('sequelize').fn('SUM', require('sequelize').col('agency_amount')), 'DESC']],
        limit: 5,
        raw: false
      });

      // Lịch sử thanh toán (pending withdrawals)
      const pendingEarnings = await Booking.findOne({
        include: [{
          model: Tour,
          as: 'tour',
          where: { agency_id: agencyId }
        }],
        where: {
          status: 'confirmed',
          commission_calculated_at: { [Op.not]: null },
          // Giả định có trường withdrawal_status
          // withdrawal_status: 'pending'
        },
        attributes: [
          [require('sequelize').fn('SUM', require('sequelize').col('agency_amount')), 'pending_amount']
        ],
        raw: true
      });

      // Commission rate hiện tại của agency
      const currentCommissionSetting = await CommissionSetting.findOne({
        where: {
          user_id: agencyId,
          is_active: true,
          effective_from: { [Op.lte]: now },
          [Op.or]: [
            { effective_to: null },
            { effective_to: { [Op.gte]: now } }
          ]
        },
        order: [['effective_from', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: {
          stats: {
            total_bookings: parseInt(agencyStats.total_bookings || 0),
            total_revenue: parseFloat(agencyStats.total_revenue || 0),
            admin_commission_paid: parseFloat(agencyStats.admin_commission_paid || 0),
            agency_earnings: parseFloat(agencyStats.agency_earnings || 0),
            avg_commission_rate: parseFloat(agencyStats.avg_commission_rate || 15),
            pending_withdrawal: parseFloat(pendingEarnings.pending_amount || 0)
          },
          current_commission_rate: currentCommissionSetting ? 
            parseFloat(currentCommissionSetting.commission_rate) : 15.00,
          top_tours: topTours.map(item => ({
            tour_id: item.tour?.id,
            tour_name: item.tour?.name,
            location: item.tour?.location,
            booking_count: parseInt(item.dataValues.booking_count),
            agency_earnings: parseFloat(item.dataValues.agency_earnings)
          })),
          period: period
        }
      });

    } catch (error) {
      console.error('Lỗi agency commission stats:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thống kê hoa hồng agency',
        error: error.message
      });
    }
  },

  /**
   * Dashboard Admin - Danh sách bookings gần đây cần tính hoa hồng
   * GET /api/admin/dashboard/pending-commissions
   */
  async getPendingCommissions(req, res) {
    try {
      const { limit = 10 } = req.query;

      const pendingBookings = await Booking.findAll({
        where: {
          status: 'confirmed',
          commission_calculated_at: null
        },
        include: [{
          model: Tour,
          as: 'tour',
          include: [{
            model: Agency,
            as: 'agency',
            attributes: ['id', 'name']
          }],
          attributes: ['id', 'name', 'location']
        }],
        attributes: ['id', 'total_price', 'booking_date', 'created_at'],
        order: [['booking_date', 'DESC']],
        limit: parseInt(limit)
      });

      res.status(200).json({
        success: true,
        data: {
          pending_count: pendingBookings.length,
          bookings: pendingBookings.map(booking => ({
            id: booking.id,
            total_price: parseFloat(booking.total_price),
            booking_date: booking.booking_date,
            tour: {
              id: booking.tour?.id,
              name: booking.tour?.name,
              location: booking.tour?.location
            },
            agency: {
              id: booking.tour?.agency?.id,
              name: booking.tour?.agency?.name
            },
            days_since_booking: Math.floor((new Date() - new Date(booking.booking_date)) / (1000 * 60 * 60 * 24))
          }))
        }
      });

    } catch (error) {
      console.error('Lỗi pending commissions:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy bookings cần tính hoa hồng',
        error: error.message
      });
    }
  },

  /**
   * Dashboard Agency - Lịch sử hoa hồng của agency
   * GET /api/agency/dashboard/commission-history
   */
  async getAgencyCommissionHistory(req, res) {
    try {
      const agencyId = req.user.id;
      const { page = 1, limit = 20, date_from, date_to } = req.query;

      let dateFilter = {};
      if (date_from && date_to) {
        dateFilter = {
          commission_calculated_at: {
            [Op.between]: [new Date(date_from), new Date(date_to)]
          }
        };
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: commissions } = await Booking.findAndCountAll({
        include: [{
          model: Tour,
          as: 'tour',
          where: { agency_id: agencyId },
          attributes: ['id', 'name', 'location']
        }],
        where: {
          status: 'confirmed',
          commission_calculated_at: { [Op.not]: null },
          ...dateFilter
        },
        attributes: [
          'id', 'total_price', 'commission_rate', 'admin_commission', 
          'agency_amount', 'booking_date', 'commission_calculated_at'
        ],
        order: [['commission_calculated_at', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      res.status(200).json({
        success: true,
        data: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(count / parseInt(limit)),
          commissions: commissions.map(booking => ({
            booking_id: booking.id,
            tour: {
              id: booking.tour?.id,
              name: booking.tour?.name,
              location: booking.tour?.location
            },
            total_price: parseFloat(booking.total_price),
            commission_rate: parseFloat(booking.commission_rate),
            admin_commission: parseFloat(booking.admin_commission),
            agency_earnings: parseFloat(booking.agency_amount),
            booking_date: booking.booking_date,
            calculated_at: booking.commission_calculated_at
          }))
        }
      });

    } catch (error) {
      console.error('Lỗi agency commission history:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy lịch sử hoa hồng agency',
        error: error.message
      });
    }
  },

  // Lấy lịch sử hoa hồng cho admin
  getAdminCommissionHistory: async (req, res) => {
    try {
      const { page = 1, limit = 20, sort = 'desc', agency_id, period } = req.query;
      const offset = (page - 1) * limit;

      let whereConditions = {
        status: 'confirmed',
        commission_calculated_at: { [Op.ne]: null }
      };

      // Filter by agency if provided
      if (agency_id) {
        whereConditions['$tour.agency_id$'] = agency_id;
      }

      // Filter by period if provided
      if (period) {
        const now = new Date();
        let startDate;
        
        switch (period) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'quarter':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        }
        
        if (startDate) {
          whereConditions.commission_calculated_at = {
            [Op.gte]: startDate,
            [Op.lte]: now
          };
        }
      }

      // Get total count
      const total = await Booking.count({
        where: whereConditions,
        include: [{
          model: Tour,
          as: 'tour',
          include: [{ model: Agency, as: 'agency' }]
        }]
      });

      // Get paginated results
      const bookings = await Booking.findAll({
        where: whereConditions,
        include: [
          {
            model: Tour,
            as: 'tour',
            include: [{ 
              model: Agency, 
              as: 'agency',
              attributes: ['id', 'name', 'email']
            }],
            attributes: ['id', 'name', 'location', 'agency_id']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ],
        attributes: [
          'id', 'total_price', 'commission_rate', 'admin_commission', 
          'agency_amount', 'booking_date', 'commission_calculated_at', 
          'status'
        ],
        order: [['commission_calculated_at', sort.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset),
        raw: false
      });

      // Get summary statistics
      const summary = await Booking.findOne({
        where: whereConditions,
        include: [{
          model: Tour,
          as: 'tour',
          include: [{ model: Agency, as: 'agency' }]
        }],
        attributes: [
          [require('sequelize').fn('COUNT', require('sequelize').col('Booking.id')), 'total_bookings'],
          [require('sequelize').fn('SUM', require('sequelize').col('total_price')), 'total_revenue'],
          [require('sequelize').fn('SUM', require('sequelize').col('admin_commission')), 'total_admin_commission'],
          [require('sequelize').fn('SUM', require('sequelize').col('agency_amount')), 'total_agency_amount'],
          [require('sequelize').fn('AVG', require('sequelize').col('commission_rate')), 'avg_commission_rate']
        ],
        raw: true
      });

      res.status(200).json({
        success: true,
        message: 'Lấy lịch sử hoa hồng admin thành công',
        data: {
          bookings: bookings.map(booking => ({
            id: booking.id,
            id_booking: booking.id, // compatibility
            total_amount: parseFloat(booking.total_price || 0),
            commission_rate: parseFloat(booking.commission_rate || 0),
            admin_commission: parseFloat(booking.admin_commission || 0),
            agency_amount: parseFloat(booking.agency_amount || 0),
            booking_date: booking.booking_date,
            calculated_at: booking.commission_calculated_at,
            status: booking.status,
            tour: booking.tour ? {
              id: booking.tour.id,
              name: booking.tour.name,
              location: booking.tour.location,
              agency: booking.tour.agency ? {
                id: booking.tour.agency.id,
                name: booking.tour.agency.name,
                email: booking.tour.agency.email
              } : null
            } : null,
            user: booking.user ? {
              id: booking.user.id,
              name: booking.user.name,
              email: booking.user.email
            } : null
          })),
          pagination: {
            current_page: parseInt(page),
            per_page: parseInt(limit),
            total: total,
            total_pages: Math.ceil(total / limit)
          },
          summary: {
            total_bookings: parseInt(summary?.total_bookings || 0),
            total_revenue: parseFloat(summary?.total_revenue || 0),
            total_admin_commission: parseFloat(summary?.total_admin_commission || 0),
            total_agency_amount: parseFloat(summary?.total_agency_amount || 0),
            avg_commission_rate: parseFloat(summary?.avg_commission_rate || 0)
          }
        }
      });

    } catch (error) {
      console.error('Lỗi admin commission history:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy lịch sử hoa hồng admin',
        error: error.message
      });
    }
  }
};

module.exports = dashboardCommissionController;
