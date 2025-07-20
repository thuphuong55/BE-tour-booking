const axios = require('axios');

async function testAdminUpdateTour() {
    const baseURL = 'http://localhost:5008';
    
    // 1. Login admin để lấy token
    console.log('1. Đăng nhập admin...');
    try {
        const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
            email: 'admin@test.com',
            password: 'admin123'
        });
        
        const adminToken = loginResponse.data.token;
        console.log('✅ Đăng nhập admin thành công');
        
        // 2. Lấy danh sách tours để test
        console.log('\n2. Lấy danh sách tours...');
        const toursResponse = await axios.get(`${baseURL}/api/admin/tours?page=1&limit=5`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        console.log('📊 Tours response:', JSON.stringify(toursResponse.data, null, 2));
        
        const tours = toursResponse.data.tours || toursResponse.data.data || [];
        console.log(`✅ Tìm thấy ${tours.length} tours`);
        
        if (tours.length === 0) {
            console.log('❌ Không có tour nào để test');
            return;
        }
        
        const testTour = tours[0];
        console.log(`📋 Sẽ test update tour: ${testTour.name} (ID: ${testTour.id})`);
        
        // 3. Test update tour với admin
        console.log('\n3. Test update tour với admin...');
        const updateData = {
            name: `${testTour.name} - Updated by Admin ${new Date().getTime()}`,
            description: 'Mô tả đã được cập nhật bởi admin',
            price: (testTour.price || 1000000) + 100000, // Tăng giá 100k
            maxParticipants: 20,
            duration: '3 ngày 2 đêm',
            startLocation: 'TP.HCM',
            endLocation: 'Đà Lạt',
            hotel_ids: [1, 2], // Test thêm hotel
            included_service_ids: [1], // Test thêm service
            category_ids: [1], // Test thêm category
            departure_dates: [
                {
                    startDate: '2024-12-01',
                    endDate: '2024-12-03',
                    availableSlots: 15
                },
                {
                    startDate: '2024-12-15',
                    endDate: '2024-12-17',
                    availableSlots: 20
                }
            ]
        };
        
        const updateResponse = await axios.put(`${baseURL}/api/admin/tours/${testTour.id}`, updateData, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        console.log('✅ Admin update tour thành công!');
        console.log('📊 Response data:', {
            id: updateResponse.data.tour.id,
            name: updateResponse.data.tour.name,
            price: updateResponse.data.tour.price,
            maxParticipants: updateResponse.data.tour.maxParticipants,
            hotelsCount: updateResponse.data.tour.TourHotels?.length || 0,
            servicesCount: updateResponse.data.tour.TourIncludedServices?.length || 0,
            categoriesCount: updateResponse.data.tour.TourTourCategories?.length || 0,
            departureDatesCount: updateResponse.data.tour.DepartureDates?.length || 0
        });
        
        // 4. Verify bằng cách get lại tour
        console.log('\n4. Verify tour đã được update...');
        const verifyResponse = await axios.get(`${baseURL}/api/admin/tours/${testTour.id}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        const updatedTour = verifyResponse.data.tour;
        console.log('✅ Verify thành công!');
        console.log('📊 Updated tour details:', {
            name: updatedTour.name,
            price: updatedTour.price,
            description: updatedTour.description,
            maxParticipants: updatedTour.maxParticipants,
            hotels: updatedTour.TourHotels?.map(th => th.Hotel?.name).join(', ') || 'None',
            services: updatedTour.TourIncludedServices?.map(ts => ts.IncludedService?.name).join(', ') || 'None',
            categories: updatedTour.TourTourCategories?.map(tc => tc.TourCategory?.name).join(', ') || 'None',
            departureDates: updatedTour.DepartureDates?.length || 0
        });
        
        console.log('\n🎉 THÀNH CÔNG: Admin có thể update đầy đủ tour và relationships!');
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response?.status === 404) {
            console.log('📌 Endpoint chưa tồn tại, cần check routes');
        }
        if (error.response?.status === 401) {
            console.log('📌 Token không hợp lệ hoặc hết hạn');
        }
    }
}

// Chạy test
testAdminUpdateTour();
