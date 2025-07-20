const axios = require('axios');

async function testAdminCreateTour() {
    const baseURL = 'http://localhost:5000';
    
    try {
        // 1. Login admin
        console.log('1. Đăng nhập admin...');
        const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
            email: 'admin@test.com',
            password: 'admin123'
        });
        
        const adminToken = loginResponse.data.token;
        console.log('✅ Đăng nhập admin thành công');
        
        // 2. Lấy danh sách agencies
        console.log('\n2. Lấy danh sách agencies...');
        const agenciesResponse = await axios.get(`${baseURL}/api/agencies`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        const agencies = agenciesResponse.data;
        console.log(`✅ Tìm thấy ${agencies.length} agencies`);
        
        if (agencies.length === 0) {
            console.log('❌ Không có agency nào để test');
            return;
        }
        
        // Tìm agency approved đầu tiên
        const approvedAgency = agencies.find(a => a.status === 'approved');
        if (!approvedAgency) {
            console.log('❌ Không có agency nào được approved');
            return;
        }
        
        console.log(`📋 Sẽ tạo tour cho agency: ${approvedAgency.name} (${approvedAgency.id})`);
        
        // 3. Tạo tour mới
        console.log('\n3. Tạo tour mới...');
        const newTourData = {
            agency_id: approvedAgency.id,
            name: `Tour được tạo bởi Admin - ${Date.now()}`,
            description: 'Tour mô tả được tạo bởi admin cho test',
            location: 'TP.HCM',
            destination: 'Đà Lạt',
            departure_location: 'Sài Gòn',
            price: 2500000,
            tour_type: 'Trong nước',
            max_participants: 25,
            min_participants: 5,
            status: 'Chờ duyệt',
            hotel_ids: [1, 2], // Test hotel IDs
            category_ids: [1], // Test category IDs
            included_service_ids: [1], // Test service IDs
            images: [
                {
                    image_url: 'https://example.com/test-image1.jpg',
                    is_main: true
                },
                {
                    image_url: 'https://example.com/test-image2.jpg',
                    is_main: false
                }
            ],
            departureDates: [
                {
                    departure_date: '2025-08-01',
                    end_date: '2025-08-04',
                    number_of_days: 4,
                    number_of_nights: 3
                },
                {
                    departure_date: '2025-08-15',
                    end_date: '2025-08-18',
                    number_of_days: 4,
                    number_of_nights: 3
                }
            ]
        };
        
        const createResponse = await axios.post(`${baseURL}/api/admin/tours`, newTourData, {
            headers: { 
                Authorization: `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Admin tạo tour thành công!');
        console.log('📊 Response data:', {
            success: createResponse.data.success,
            message: createResponse.data.message,
            tourId: createResponse.data.data.tour.id,
            tourName: createResponse.data.data.tour.name,
            agencyName: createResponse.data.data.tour.agency.name,
            imagesCount: createResponse.data.data.tour.images?.length || 0,
            departureDatesCount: createResponse.data.data.tour.departureDates?.length || 0,
            categoriesCount: createResponse.data.data.tour.categories?.length || 0,
            servicesCount: createResponse.data.data.tour.includedServices?.length || 0
        });
        
        // 4. Verify bằng cách lấy tour vừa tạo
        console.log('\n4. Verify tour đã được tạo...');
        const tourId = createResponse.data.data.tour.id;
        const verifyResponse = await axios.get(`${baseURL}/api/admin/tours`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            params: { search: newTourData.name.substring(0, 20) }
        });
        
        const foundTour = verifyResponse.data.data.tours.find(t => t.id === tourId);
        if (foundTour) {
            console.log('✅ Verify thành công! Tour đã được tạo và xuất hiện trong danh sách');
            console.log('📊 Tour info:', {
                id: foundTour.id,
                name: foundTour.name,
                status: foundTour.status,
                agencyName: foundTour.agency?.name
            });
        } else {
            console.log('❌ Không tìm thấy tour vừa tạo trong danh sách');
        }
        
        console.log('\n🎉 THÀNH CÔNG: Admin có thể tạo tour cho agency!');
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response?.status === 404) {
            console.log('📌 Endpoint có thể chưa tồn tại hoặc server chưa chạy');
        }
        if (error.response?.status === 401) {
            console.log('📌 Token không hợp lệ hoặc hết hạn');
        }
        if (error.response?.status === 400) {
            console.log('📌 Dữ liệu request không hợp lệ');
        }
    }
}

// Chạy test
testAdminCreateTour();
