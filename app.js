const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const db = require("./models");

// Import optimization middleware
const optimizationMiddleware = require("./middleware/optimizationMiddleware");

// Apply database sync
db.sequelize.sync();

// Apply optimization middleware FIRST (includes compression, security, monitoring)
app.use(optimizationMiddleware);

// CORS và JSON parsing (sau optimization middleware)
app.use(cors());
app.use(express.json());

// Import tất cả routes
// Agency Management Routes (phải đặt trước /api/agency)  
app.use("/api/agency/bookings", require("./routes/agencyBookingRoutes"));
app.use("/api/agency/payments", require("./routes/agencyPaymentRoutes"));

// Admin Management Routes
app.use("/api/admin/tours", require("./routes/adminTourRoutes"));

app.use("/api/agencies", require("./routes/agencyRoutes"));
app.use("/api/agency", require("./routes/agencyRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));  
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/tours", require("./routes/tourRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/guest", require("./routes/guestRoutes")); // Guest booking routes
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/locations", require("./routes/locationRoutes"));
app.use("/api/itineraries", require("./routes/itineraryRoutes"));
app.use("/api/tour-included-services", require("./routes/tourIncludedServiceRoutes"));
app.use("/api/excluded-services", require("./routes/excludedServiceRoutes"));
app.use("/api/tour-excluded-services", require("./routes/tourExcludedServiceRoutes"));
app.use("/api/promotions", require("./routes/promotionRoutes"));
app.use("/api/faqs", require("./routes/faqRoutes"));
app.use("/api/tour-categories", require("./routes/tourCategoryRoutes"));
app.use("/api/tour-tour-categories", require("./routes/tourTourCategoryRoutes"));
app.use("/api/itinerary-locations", require("./routes/itineraryLocationRoutes"));
app.use("/api/departure-dates", require("./routes/departureDateRoutes"));
app.use("/api/hotels", require("./routes/hotelRoutes"));
app.use("/api/hotel-locations", require("./routes/hotelLocationRoutes"));
app.use("/api/tour-hotels", require("./routes/tourHotelRoutes"));
app.use("/api/tour-images", require("./routes/tourImageRoutes"));
app.use("/api/provinces", require ("./routes/provinceRoutes"));
app.use("/api/included-services", require("./routes/includedServiceRoutes"));
app.use("/api/tour-images", require("./routes/tourImageRoutes"));
app.use("/api/information-booking", require("./routes/informationBookingRoutes"));
app.use("/api/destinations", require("./routes/destinationRoutes"));
app.use("/api/auth", require ("./routes/authRoutes"));
app.use("/api/momo", require("./routes/momoRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/data', require('./routes/dataRoutes'));

// Admin Management Routes
app.use("/api/admin/bookings", require("./routes/adminBookingRoutes"));
app.use("/api/admin/payments", require("./routes/adminPaymentRoutes"));
app.use("/api/admin/commissions", require("./routes/commissionRoutes"));
app.use("/api/dashboard/commissions", require("./routes/dashboardCommissionRoutes"));
app.use('/api/commissions', require('./routes/commissionRoutes'));

// Global error handling middleware for JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('📝 JSON Parsing Error:');
    console.error('URL:', req.method, req.url);
    console.error('Content-Type:', req.headers['content-type']);
    console.error('Error:', err.message);
    console.error('Raw body preview:', err.body?.substring(0, 200) || 'No body');
    
    return res.status(400).json({ 
      message: 'Invalid JSON format',
      error: 'Request body contains invalid JSON',
      details: err.message
    });
  }
  
  // Pass to next error handler
  next(err);
});

const PORT = process.env.PORT || 5001;

// Performance monitoring endpoint
app.get('/api/health', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = app;
