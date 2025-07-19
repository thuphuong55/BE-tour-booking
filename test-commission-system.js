const { Booking, Tour, User, CommissionSetting } = require('./models');
const CommissionService = require('./services/commissionService');

async function testCommissionSystem() {
  try {
    console.log('🏦 Test hệ thống hoa hồng...\n');

    // 1. Kiểm tra cấu trúc bảng
    console.log('1. Kiểm tra cấu trúc database:');
    
    const [bookingStructure] = await require('./models').sequelize.query('DESCRIBE booking');
    const commissionFields = bookingStructure.filter(field => 
      ['commission_rate', 'admin_commission', 'agency_amount', 'commission_calculated_at'].includes(field.Field)
    );
    
    console.log('   Trường hoa hồng trong booking:');
    commissionFields.forEach(field => {
      console.log(`   - ${field.Field}: ${field.Type}`);
    });

    // 2. Kiểm tra bảng commission_settings
    const settingsCount = await CommissionSetting.count();
    console.log(`\n   Số cấu hình hoa hồng: ${settingsCount}`);

    // 3. Tạo cấu hình hoa hồng test
    console.log('\n2. Tạo cấu hình hoa hồng test:');
    
    const [agencies] = await require('./models').sequelize.query(`
      SELECT id, name FROM users WHERE role LIKE '%agency%' LIMIT 1
    `);
    
    if (agencies.length > 0) {
      const agency = agencies[0];
      
      // Kiểm tra xem đã có cấu hình chưa
      let setting = await CommissionSetting.findOne({
        where: { user_id: agency.id }
      });
      
      if (!setting) {
        setting = await CommissionSetting.create({
          user_id: agency.id,
          commission_rate: 18.50, // 18.5%
          effective_from: new Date()
        });
        console.log(`   ✅ Tạo cấu hình hoa hồng 18.5% cho ${agency.name}`);
      } else {
        console.log(`   ✅ Đã có cấu hình hoa hồng cho ${agency.name}`);
      }

      // 4. Test tìm tỷ lệ hoa hồng
      console.log('\n3. Test tìm tỷ lệ hoa hồng:');
      const rate = await CommissionSetting.findCommissionRate(agency.id, 2000000);
      console.log(`   Tỷ lệ hoa hồng cho booking 2,000,000 VNĐ: ${rate}%`);

      // 5. Test với booking thực
      console.log('\n4. Test tính hoa hồng với booking thực:');
      
      const [bookings] = await require('./models').sequelize.query(`
        SELECT b.*, t.agency_id 
        FROM booking b 
        JOIN tour t ON b.tour_id = t.id 
        WHERE b.status = 'confirmed' 
        AND b.commission_calculated_at IS NULL
        AND t.agency_id = ?
        LIMIT 1
      `, {
        replacements: [agency.id]
      });

      if (bookings.length > 0) {
        const booking = bookings[0];
        console.log(`   Booking ID: ${booking.id}`);
        console.log(`   Tổng tiền: ${parseFloat(booking.total_price).toLocaleString()} VNĐ`);
        
        // Tính hoa hồng
        const result = await CommissionService.calculateCommission(booking.id);
        
        if (result.success) {
          console.log('   ✅ Tính hoa hồng thành công:');
          console.log(`   - Tỷ lệ hoa hồng: ${result.data.commission_rate}%`);
          console.log(`   - Hoa hồng admin: ${result.data.admin_commission.toLocaleString()} VNĐ`);
          console.log(`   - Số tiền agency: ${result.data.agency_amount.toLocaleString()} VNĐ`);
        } else {
          console.log('   ❌ Lỗi tính hoa hồng:', result.message);
        }
      } else {
        // Tạo ví dụ tính hoa hồng thủ công
        console.log('   Không có booking thực, tạo ví dụ:');
        const totalPrice = 2000000;
        const commissionRate = rate;
        const adminCommission = Math.round(totalPrice * (commissionRate / 100));
        const agencyAmount = totalPrice - adminCommission;
        
        console.log(`   - Tổng tiền tour: ${totalPrice.toLocaleString()} VNĐ`);
        console.log(`   - Tỷ lệ hoa hồng: ${commissionRate}%`);
        console.log(`   - Hoa hồng admin: ${adminCommission.toLocaleString()} VNĐ`);
        console.log(`   - Số tiền agency: ${agencyAmount.toLocaleString()} VNĐ`);
      }
    } else {
      console.log('   ⚠️ Không tìm thấy agency nào để test');
    }

    // 6. Test báo cáo hoa hồng
    console.log('\n5. Test báo cáo hoa hồng:');
    const report = await CommissionService.getCommissionReport();
    
    if (report.success) {
      console.log(`   - Tổng booking có hoa hồng: ${report.data.summary.total_bookings}`);
      console.log(`   - Tổng doanh thu: ${report.data.summary.total_revenue.toLocaleString()} VNĐ`);
      console.log(`   - Tổng hoa hồng admin: ${report.data.summary.total_admin_commission.toLocaleString()} VNĐ`);
      console.log(`   - Số agency: ${report.data.by_agency.length}`);
    }

    console.log('\n🎉 Test hệ thống hoa hồng hoàn thành!');

  } catch (error) {
    console.error('❌ Lỗi test:', error.message);
    console.error(error.stack);
  } finally {
    process.exit();
  }
}

testCommissionSystem();
