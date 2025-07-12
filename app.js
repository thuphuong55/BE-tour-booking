const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const db = require("./models");

db.sequelize.sync();

app.use(cors());
app.use(express.json());

// Import tất cả routes
app.use("/api/agencies", require("./routes/agencyRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));  
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/tours", require("./routes/tourRoutes"));
app.use("/api/tour-schedules", require("./routes/tourScheduleRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
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
app.use("/api/tour-hotels", require("./routes/tourHotelRoutes"));
app.use("/api/tour-images", require("./routes/tourImageRoutes"));
app.use("/api/provinces", require ("./routes/provinceRoutes"));
app.use("/api/included-services", require("./routes/includedServiceRoutes"));
app.use("/api/tour-images", require("./routes/tourImageRoutes"));
app.use("/api/information-booking", require("./routes/informationBookingRoutes"));
app.use("/api/destinations", require("./routes/destinationRoutes"));
app.use("/api/auth", require ("./routes/authRoutes"));
<<<<<<< HEAD
app.use("/api/momo", require("./routes/momoRoutes"));
=======
>>>>>>> UpdateRieng
app.use("/api/payments", require("./routes/paymentRoutes"));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;
