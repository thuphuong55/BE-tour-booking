const { Booking, Commission, User, Tour, Agency, sequelize } = require('./models');

async function createCommissionData() {
  try {
    console.log('🔍 Đang tìm các booking để tạo commission...');

    // Lấy agency ID từ commission_settings
    const commissionSetting = await sequelize.query(
      'SELECT user_id FROM commission_settings LIMIT 1',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (!commissionSetting.length) {
      console.log('❌ Không tìm thấy commission settings');
      return;
    }

    const agencyId = commissionSetting[0].user_id;
    console.log('📍 Sử dụng agency_id:', agencyId);

    // Lấy các booking đã confirmed
    const confirmedBookings = await Booking.findAll({
      where: { status: 'confirmed' },
      include: [
        {
          model: Tour,
          as: 'tour'
        }
      ]
    });

    console.log(`📊 Tìm thấy ${confirmedBookings.length} booking đã confirmed`);

    for (const booking of confirmedBookings) {
      // Kiểm tra xem đã có commission chưa
      const existingCommission = await Commission.findOne({
        where: { booking_id: booking.id }
      });

      if (existingCommission) {
        console.log(`⏩ Booking ${booking.id} đã có commission, bỏ qua`);
        continue;
      }

      // Tính commission (15%)
      const commissionRate = 15.00; // 15%
      const commissionAmount = (booking.total_price * commissionRate) / 100;
      const agencyAmount = booking.total_price - commissionAmount;

      // Tạo commission record
      const commission = await Commission.create({
        booking_id: booking.id,
        agency_id: agencyId, // Sử dụng agency_id từ commission_settings
        amount: commissionAmount,
        rate: commissionRate,
        status: 'paid'
      });

      // Cập nhật booking với thông tin commission
      await booking.update({
        commission_rate: commissionRate,
        admin_commission: commissionAmount,
        agency_amount: agencyAmount,
        commission_calculated_at: new Date()
      });

      console.log(`✅ Tạo commission cho booking ${booking.id}:`);
      console.log(`   - Commission: ${commissionAmount.toFixed(2)} VND`);
      console.log(`   - Agency amount: ${agencyAmount.toFixed(2)} VND`);
    }

    console.log('🎉 Hoàn thành tạo commission data!');
    
    // Hiển thị tổng quan
    const totalCommissions = await Commission.count();
    console.log(`📈 Tổng số commission: ${totalCommissions}`);

  } catch (error) {
    console.error('❌ Lỗi khi tạo commission data:', error);
  }
}

// Chạy script
createCommissionData()
  .then(() => {
    console.log('✨ Script hoàn thành');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script thất bại:', error);
    process.exit(1);
  });
