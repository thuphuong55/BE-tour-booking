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
app.use("/api/payments", require("./routes/paymentRoutes"));
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
