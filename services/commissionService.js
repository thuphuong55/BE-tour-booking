const { Booking, Tour, User, CommissionSetting, TourCategory, Agency } = require('../models');

class CommissionService {
  
  /**
   * Tính toán hoa hồng cho một booking
   * @param {string} bookingId - ID của booking
   * @param {boolean} force - Có buộc tính lại không (mặc định false)
   * @returns {Object} Kết quả tính hoa hồng
   */
  static async calculateCommission(bookingId, force = false) {
    try {
      // Lấy thông tin booking với tour và agency
      const booking = await Booking.findByPk(bookingId, {
        include: [
          {
            model: Tour,
            as: 'tour',
            include: [
              {
                model: Agency,
                as: 'agency',
                attributes: ['id', 'name'],
                include: [{
                  model: User,
                  as: 'user',
                  attributes: ['id', 'name', 'role']
                }]
              },
              {
                model: TourCategory,
                as: 'categories',
                through: { attributes: [] }
                // Bỏ limit và separate vì belongsToMany không hỗ trợ
              }
            ]
          }
        ]
      });

      if (!booking) {
        throw new Error('Không tìm thấy booking');
      }

      // Kiểm tra xem đã tính hoa hồng chưa
      if (!force && booking.commission_calculated_at) {
        return {
          success: true,
          message: 'Hoa hồng đã được tính trước đó',
          data: {
            booking_id: booking.id,
            commission_rate: booking.commission_rate,
            admin_commission: booking.admin_commission,
            agency_amount: booking.agency_amount,
            calculated_at: booking.commission_calculated_at
          }
        };
      }

      // Chỉ tính hoa hồng cho booking đã confirmed
      if (booking.status !== 'confirmed') {
        throw new Error('Chỉ tính hoa hồng cho booking đã được xác nhận');
      }

      const agencyId = booking.tour?.agency?.user?.id;
      if (!agencyId) {
        throw new Error('Không tìm thấy thông tin user agency cho tour này');
      }

      // Tìm tỷ lệ hoa hồng phù hợp
      const tourCategoryId = booking.tour?.categories?.[0]?.id || null;
      const commissionRate = await CommissionSetting.findCommissionRate(
        agencyId, 
        parseFloat(booking.total_price), 
        tourCategoryId
      );

      // Tính toán số tiền
      const totalPrice = parseFloat(booking.total_price);
      const adminCommission = Math.round(totalPrice * (commissionRate / 100));
      const agencyAmount = totalPrice - adminCommission;

      // Cập nhật booking
      await booking.update({
        commission_rate: commissionRate,
        admin_commission: adminCommission,
        agency_amount: agencyAmount,
        commission_calculated_at: new Date()
      });

      return {
        success: true,
        message: 'Tính hoa hồng thành công',
        data: {
          booking_id: booking.id,
          total_price: totalPrice,
          commission_rate: commissionRate,
          admin_commission: adminCommission,
          agency_amount: agencyAmount,
          agency_name: booking.tour?.agency?.name,
          tour_name: booking.tour?.name,
          calculated_at: booking.commission_calculated_at
        }
      };

    } catch (error) {
      console.error('Lỗi tính hoa hồng:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Tính hoa hồng cho nhiều booking cùng lúc
   * @param {Array<string>} bookingIds - Mảng ID các booking
   * @param {boolean} force - Có buộc tính lại không
   * @returns {Object} Kết quả tính hoa hồng
   */
  static async calculateMultipleCommissions(bookingIds, force = false) {
    const results = {
      success: 0,
      failed: 0,
      details: []
    };

    for (const bookingId of bookingIds) {
      const result = await this.calculateCommission(bookingId, force);
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
      }
      results.details.push({
        booking_id: bookingId,
        ...result
      });
    }

    return results;
  }

  /**
   * Lấy báo cáo hoa hồng cho admin
   * @param {Object} filters - Bộ lọc (date_from, date_to, agency_id)
   * @returns {Object} Báo cáo hoa hồng
   */
  static async getCommissionReport(filters = {}) {
    try {
      const { date_from, date_to, agency_id } = filters;
      
      const whereCondition = {
        commission_calculated_at: { [require('sequelize').Op.not]: null }
      };

      if (date_from && date_to) {
        whereCondition.commission_calculated_at = {
          [require('sequelize').Op.between]: [new Date(date_from), new Date(date_to)]
        };
      }

      const includeCondition = {
        model: Tour,
        as: 'tour',
        include: [
          {
            model: Agency,
            as: 'agency',
            attributes: ['id', 'name'],
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }]
          }
        ]
      };

      if (agency_id) {
        includeCondition.include[0].include[0].where = { id: agency_id };
      }

      const bookings = await Booking.findAll({
        where: whereCondition,
        include: [includeCondition],
        attributes: [
          'id', 'total_price', 'commission_rate', 'admin_commission', 
          'agency_amount', 'commission_calculated_at', 'booking_date'
        ],
        order: [['commission_calculated_at', 'DESC']]
      });

      // Tính tổng kết
      const summary = bookings.reduce((acc, booking) => {
        acc.total_bookings++;
        acc.total_revenue += parseFloat(booking.total_price);
        acc.total_admin_commission += parseFloat(booking.admin_commission || 0);
        acc.total_agency_amount += parseFloat(booking.agency_amount || 0);
        return acc;
      }, {
        total_bookings: 0,
        total_revenue: 0,
        total_admin_commission: 0,
        total_agency_amount: 0
      });

      // Nhóm theo agency
      const byAgency = {};
      bookings.forEach(booking => {
        const agencyUserId = booking.tour?.agency?.user?.id;
        const agencyName = booking.tour?.agency?.name;
        
        if (!byAgency[agencyUserId]) {
          byAgency[agencyUserId] = {
            agency_id: agencyUserId,
            agency_name: agencyName,
            booking_count: 0,
            total_revenue: 0,
            admin_commission: 0,
            agency_amount: 0
          };
        }
        
        byAgency[agencyUserId].booking_count++;
        byAgency[agencyUserId].total_revenue += parseFloat(booking.total_price);
        byAgency[agencyUserId].admin_commission += parseFloat(booking.admin_commission || 0);
        byAgency[agencyUserId].agency_amount += parseFloat(booking.agency_amount || 0);
      });

      return {
        success: true,
        data: {
          summary,
          by_agency: Object.values(byAgency),
          bookings: bookings.map(b => ({
            id: b.id,
            total_price: b.total_price,
            commission_rate: b.commission_rate,
            admin_commission: b.admin_commission,
            agency_amount: b.agency_amount,
            booking_date: b.booking_date,
            calculated_at: b.commission_calculated_at,
            agency: {
              id: b.tour?.agency?.user?.id,
              name: b.tour?.agency?.name,
              email: b.tour?.agency?.user?.email
            }
          }))
        }
      };

    } catch (error) {
      console.error('Lỗi tạo báo cáo hoa hồng:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Tính hoa hồng cho tất cả booking chưa được tính
   * @returns {Object} Kết quả xử lý
   */
  static async calculatePendingCommissions() {
    try {
      const pendingBookings = await Booking.findAll({
        where: {
          status: 'confirmed',
          commission_calculated_at: null
        },
        attributes: ['id']
      });

      if (pendingBookings.length === 0) {
        return {
          success: true,
          message: 'Không có booking nào cần tính hoa hồng'
        };
      }

      const bookingIds = pendingBookings.map(b => b.id);
      const results = await this.calculateMultipleCommissions(bookingIds);

      return {
        success: true,
        message: `Đã xử lý ${bookingIds.length} booking`,
        results
      };

    } catch (error) {
      console.error('Lỗi tính hoa hồng pending:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = CommissionService;
