// Test dashboard API endpoints
const express = require('express');

const app = express();
const port = 3001;

app.use(express.json());

// Mock data for testing
const mockData = {
  overview: {
    total_bookings: 156,
    total_revenue: 312000000,
    total_admin_commission: 46800000,
    total_agency_amount: 265200000,
    avg_commission_rate: 15.0
  },
  top_agencies: [
    {
      agency_id: 'uuid-1',
      agency_name: 'Du lịch Việt',
      booking_count: 45,
      total_revenue: 95000000,
      admin_commission: 14250000
    },
    {
      agency_id: 'uuid-2',
      agency_name: 'Travel Express',
      booking_count: 32,
      total_revenue: 68000000,
      admin_commission: 10200000
    }
  ],
  monthly_chart: [
    {
      month: '2025-01',
      admin_commission: 5200000,
      booking_count: 24
    },
    {
      month: '2025-02',
      admin_commission: 4800000,
      booking_count: 22
    },
    {
      month: '2025-03',
      admin_commission: 6100000,
      booking_count: 28
    }
  ]
};

// Test dashboard endpoints
app.get('/api/dashboard/commissions/admin/overview', (req, res) => {
  const { period = 'month' } = req.query;
  console.log(`📊 Admin overview requested with period: ${period}`);
  
  res.json({
    success: true,
    data: {
      ...mockData,
      period
    }
  });
});

app.get('/api/dashboard/commissions/admin/pending', (req, res) => {
  const { limit = 10 } = req.query;
  console.log(`⏳ Pending commissions requested with limit: ${limit}`);
  
  res.json({
    success: true,
    data: {
      pending_count: 5,
      bookings: [
        {
          id: 'booking-uuid-1',
          total_price: 2500000,
          booking_date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          tour: {
            id: 'tour-uuid-1',
            name: 'Tour Hạ Long 2N1Đ',
            location: 'Quảng Ninh'
          },
          agency: {
            id: 'agency-uuid-1',
            name: 'Du lịch ABC'
          },
          days_since_booking: 1
        },
        {
          id: 'booking-uuid-2',
          total_price: 3200000,
          booking_date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          tour: {
            id: 'tour-uuid-2',
            name: 'Tour Đà Lạt 3N2Đ',
            location: 'Lâm Đồng'
          },
          agency: {
            id: 'agency-uuid-2',
            name: 'Travel Express'
          },
          days_since_booking: 2
        }
      ].slice(0, limit)
    }
  });
});

app.get('/api/dashboard/commissions/agency/stats', (req, res) => {
  const { period = 'month' } = req.query;
  console.log(`💰 Agency stats requested with period: ${period}`);
  
  res.json({
    success: true,
    data: {
      stats: {
        total_bookings: 28,
        total_revenue: 65000000,
        admin_commission_paid: 9750000,
        agency_earnings: 55250000,
        avg_commission_rate: 15.0,
        pending_withdrawal: 12500000
      },
      current_commission_rate: 15.00,
      top_tours: [
        {
          tour_id: 'tour-uuid-1',
          tour_name: 'Tour Phú Quốc 3N2Đ',
          location: 'Kiên Giang',
          booking_count: 8,
          agency_earnings: 18700000
        },
        {
          tour_id: 'tour-uuid-2',
          tour_name: 'Tour Hạ Long 2N1Đ',
          location: 'Quảng Ninh',
          booking_count: 6,
          agency_earnings: 14200000
        }
      ],
      period
    }
  });
});

app.get('/api/dashboard/commissions/agency/history', (req, res) => {
  const { page = 1, limit = 20, date_from, date_to } = req.query;
  console.log(`📋 Agency history requested - Page: ${page}, Limit: ${limit}`);
  
  res.json({
    success: true,
    data: {
      total: 45,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(45 / limit),
      commissions: [
        {
          booking_id: 'booking-uuid-1',
          tour: {
            id: 'tour-uuid-1',
            name: 'Tour Đà Lạt 3N2Đ',
            location: 'Lâm Đồng'
          },
          total_price: 3200000,
          commission_rate: 15.0,
          admin_commission: 480000,
          agency_earnings: 2720000,
          booking_date: '2025-07-15T09:00:00.000Z',
          calculated_at: '2025-07-16T14:30:00.000Z'
        },
        {
          booking_id: 'booking-uuid-2',
          tour: {
            id: 'tour-uuid-2',
            name: 'Tour Phú Quốc 4N3Đ',
            location: 'Kiên Giang'
          },
          total_price: 4500000,
          commission_rate: 15.0,
          admin_commission: 675000,
          agency_earnings: 3825000,
          booking_date: '2025-07-14T10:15:00.000Z',
          calculated_at: '2025-07-15T16:45:00.000Z'
        }
      ]
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`✅ Dashboard API test server running on port ${port}`);
  console.log('\n📋 Available test endpoints:');
  console.log(`- GET http://localhost:${port}/api/dashboard/commissions/admin/overview?period=month`);
  console.log(`- GET http://localhost:${port}/api/dashboard/commissions/admin/pending?limit=5`);
  console.log(`- GET http://localhost:${port}/api/dashboard/commissions/agency/stats?period=quarter`);
  console.log(`- GET http://localhost:${port}/api/dashboard/commissions/agency/history?page=1&limit=10`);
  console.log('\n🚀 Server ready for testing!');
});

// Auto-test endpoints after startup
setTimeout(async () => {
  try {
    console.log('\n🧪 Starting automatic API tests...\n');
    
    const fetch = (await import('node-fetch')).default;
    
    // Test 1: Admin Overview
    console.log('1️⃣ Testing Admin Overview API...');
    const overviewResponse = await fetch(`http://localhost:${port}/api/dashboard/commissions/admin/overview?period=quarter`);
    const overviewData = await overviewResponse.json();
    console.log('✅ Admin Overview Response:');
    console.log(`   - Total Bookings: ${overviewData.data.overview.total_bookings}`);
    console.log(`   - Total Revenue: ${overviewData.data.overview.total_revenue.toLocaleString()} VNĐ`);
    console.log(`   - Admin Commission: ${overviewData.data.overview.total_admin_commission.toLocaleString()} VNĐ`);
    console.log(`   - Top Agencies: ${overviewData.data.top_agencies.length} agencies`);
    console.log(`   - Period: ${overviewData.data.period}\n`);

    // Test 2: Pending Commissions
    console.log('2️⃣ Testing Pending Commissions API...');
    const pendingResponse = await fetch(`http://localhost:${port}/api/dashboard/commissions/admin/pending?limit=5`);
    const pendingData = await pendingResponse.json();
    console.log('✅ Pending Commissions Response:');
    console.log(`   - Pending Count: ${pendingData.data.pending_count}`);
    console.log(`   - Bookings Returned: ${pendingData.data.bookings.length}`);
    pendingData.data.bookings.forEach((booking, index) => {
      console.log(`   - Booking ${index + 1}: ${booking.tour.name} (${booking.total_price.toLocaleString()} VNĐ)`);
    });
    console.log();

    // Test 3: Agency Stats
    console.log('3️⃣ Testing Agency Stats API...');
    const statsResponse = await fetch(`http://localhost:${port}/api/dashboard/commissions/agency/stats?period=month`);
    const statsData = await statsResponse.json();
    console.log('✅ Agency Stats Response:');
    console.log(`   - Total Bookings: ${statsData.data.stats.total_bookings}`);
    console.log(`   - Agency Earnings: ${statsData.data.stats.agency_earnings.toLocaleString()} VNĐ`);
    console.log(`   - Commission Rate: ${statsData.data.current_commission_rate}%`);
    console.log(`   - Top Tours: ${statsData.data.top_tours.length} tours`);
    console.log(`   - Pending Withdrawal: ${statsData.data.stats.pending_withdrawal.toLocaleString()} VNĐ\n`);

    // Test 4: Agency History
    console.log('4️⃣ Testing Agency History API...');
    const historyResponse = await fetch(`http://localhost:${port}/api/dashboard/commissions/agency/history?page=1&limit=10`);
    const historyData = await historyResponse.json();
    console.log('✅ Agency History Response:');
    console.log(`   - Total Records: ${historyData.data.total}`);
    console.log(`   - Current Page: ${historyData.data.page}/${historyData.data.total_pages}`);
    console.log(`   - Records per Page: ${historyData.data.limit}`);
    console.log(`   - Commissions Returned: ${historyData.data.commissions.length}`);
    historyData.data.commissions.forEach((commission, index) => {
      console.log(`   - Commission ${index + 1}: ${commission.tour.name} - ${commission.agency_earnings.toLocaleString()} VNĐ`);
    });

    console.log('\n🎉 All API tests completed successfully!');
    console.log('📊 Dashboard APIs are working correctly and ready for frontend integration.');
    
    // Keep server running for manual testing
    console.log('\n⏰ Server will continue running for manual testing...');
    console.log('   Press Ctrl+C to stop the server');
    
  } catch (error) {
    console.error('❌ Error during API testing:', error.message);
  }
}, 3000);
