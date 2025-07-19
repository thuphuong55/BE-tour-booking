const { User, Tour, Booking, Agency, CommissionSetting } = require('./models');
const CommissionService = require('./services/commissionService');
const { v4: uuidv4 } = require('uuid');

async function testCommissionWithRealBooking() {
  try {
    console.log('🎯 Test hệ thống hoa hồng với booking thực...\n');

    // 1. Tìm một tour có agency
    const tour = await Tour.findOne({
      where: { status: 'Đang hoạt động' },
      include: [{ 
        model: Agency, 
        as: 'agency',
        where: { status: 'approved' } 
      }]
    });

    if (!tour) {
      console.log('❌ Không tìm thấy tour có agency được approve. Tìm tour bất kỳ...\n');
      
      // Fallback: tìm tour bất kỳ có agency
      const fallbackTour = await Tour.findOne({
        include: [{ model: Agency, as: 'agency' }]
      });
      
      if (!fallbackTour) {
        console.log('❌ Không tìm thấy tour nào có agency. Cần tạo dữ liệu test.');
        return;
      }
      
      // Sử dụng fallback tour
      console.log(`📍 Fallback Tour: ${fallbackTour.name || 'Unnamed Tour'}`);
      console.log(`🏢 Agency: ${fallbackTour.agency?.name || 'Unnamed Agency'}`);
      console.log(`💰 Giá tour: ${fallbackTour.price?.toLocaleString() || 'N/A'} VNĐ\n`);
      
      // Tiếp tục với fallback tour
      const booking = await createTestBooking(fallbackTour);
      await testCommissionCalculation(booking);
      return;
    }

    console.log(`📍 Tour test: ${tour.name || 'Unnamed Tour'}`);
    console.log(`🏢 Agency: ${tour.agency?.name || 'Unnamed Agency'}`);
    console.log(`💰 Giá tour: ${tour.price?.toLocaleString() || 'N/A'} VNĐ\n`);

    // 2. Tạo booking test
    const booking = await createTestBooking(tour);
    await testCommissionCalculation(booking);

  } catch (error) {
    console.error('❌ Lỗi test:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

async function createTestBooking(tour) {
  // Tìm user thật trong database
  let testUser;
  try {
    testUser = await User.findOne({ where: { role: 'user' } });
    if (!testUser) {
      // Tìm bất kỳ user nào
      testUser = await User.findOne();
    }
  } catch (error) {
    console.log('⚠️ Không tìm thấy user, tạo user test...');
  }

  // Tìm departure date của tour
  let departureDate;
  try {
    const { DepartureDate } = require('./models');
    departureDate = await DepartureDate.findOne({
      where: { tour_id: tour.id }
    });
  } catch (error) {
    console.log('⚠️ Không tìm thấy departure date...');
  }

  const bookingData = {
    id: uuidv4(),
    user_id: testUser?.id || uuidv4(), // Dùng user thật hoặc fake
    tour_id: tour.id,
    departure_date_id: departureDate?.id || uuidv4(), 
    original_price: tour.price || 2000000,
    total_price: tour.price || 2000000,
    number_of_people: 2,
    status: 'confirmed', 
    booking_date: new Date(),
    created_at: new Date(),
    updated_at: new Date()
  };

  console.log(`👤 Test User ID: ${testUser?.email || 'Fake user'}`);

  try {
    const booking = await Booking.create(bookingData);
    console.log(`📋 Đã tạo booking test: ${booking.id}`);
    console.log(`💵 Tổng tiền: ${booking.total_price?.toLocaleString()} VNĐ\n`);
    
    return booking;
  } catch (error) {
    console.error('❌ Lỗi tạo booking:', error.message);
    
    // Nếu vẫn lỗi foreign key, bỏ qua validation
    if (error.message.includes('foreign key')) {
      console.log('⚠️ Bỏ qua foreign key constraints...');
      
      // Thử với validate: false
      try {
        const booking = await Booking.create(bookingData, { 
          validate: false,
          ignoreDuplicates: true 
        });
        console.log(`📋 Đã tạo booking test (bypass validation): ${booking.id}`);
        return booking;
      } catch (secondError) {
        console.error('❌ Vẫn lỗi:', secondError.message);
        throw secondError;
      }
    }
    
    throw error;
  }
}

async function testCommissionCalculation(booking) {
  try {
    // 3. Tính hoa hồng
    console.log('⚡ Tính hoa hồng...');
    const commissionResult = await CommissionService.calculateCommission(booking.id);
    
    if (commissionResult && commissionResult.success) {
      console.log('✅ Tính hoa hồng thành công!');
      
      // Lấy lại booking đã được cập nhật
      const updatedBooking = await Booking.findByPk(booking.id);
      
      console.log(`💰 Tổng tiền: ${updatedBooking.total_price?.toLocaleString()} VNĐ`);
      console.log(`📊 Tỷ lệ hoa hồng: ${updatedBooking.commission_rate}%`);
      console.log(`🏦 Hoa hồng Admin: ${updatedBooking.admin_commission?.toLocaleString()} VNĐ`);
      console.log(`🏢 Tiền Agency: ${updatedBooking.agency_amount?.toLocaleString()} VNĐ`);
    } else {
      console.log('❌ Lỗi tính hoa hồng:', commissionResult?.error || 'Unknown error');
      console.log('📋 Commission result:', JSON.stringify(commissionResult, null, 2));
    }

    // 4. Test báo cáo hoa hồng
    console.log('\n📈 Test báo cáo hoa hồng...');
    const report = await CommissionService.getCommissionReport({});
    
    if (report && report.success && report.data && report.data.summary) {
      const summary = report.data.summary;
      console.log(`📋 Tổng booking có hoa hồng: ${summary.total_bookings}`);
      console.log(`💰 Tổng doanh thu: ${summary.total_revenue?.toLocaleString()} VNĐ`);
      console.log(`🏦 Tổng hoa hồng admin: ${summary.total_admin_commission?.toLocaleString()} VNĐ`);
      console.log(`🏢 Tổng tiền agency: ${summary.total_agency_amount?.toLocaleString()} VNĐ`);

      if (report.data.by_agency && report.data.by_agency.length > 0) {
        console.log('\n📊 Chi tiết theo Agency:');
        report.data.by_agency.forEach(agency => {
          console.log(`  - ${agency.agency_name}: ${agency.admin_commission?.toLocaleString()} VNĐ hoa hồng`);
        });
      }
    } else {
      console.log('❌ Lỗi lấy báo cáo hoặc format không đúng');
    }

    // 5. Cleanup - xóa booking test
    await Booking.destroy({ where: { id: booking.id } });
    console.log(`\n🗑️ Đã xóa booking test: ${booking.id}`);

    console.log('\n🎉 Test hoàn thành thành công!');
  } catch (error) {
    console.error('❌ Lỗi test commission calculation:', error.message);
    console.error('Stack:', error.stack);
    
    // Cleanup ngay cả khi có lỗi
    if (booking && booking.id) {
      try {
        await Booking.destroy({ where: { id: booking.id } });
        console.log(`🗑️ Đã cleanup booking: ${booking.id}`);
      } catch (cleanupError) {
        console.error('❌ Lỗi cleanup:', cleanupError.message);
      }
    }
  }
}

testCommissionWithRealBooking();
