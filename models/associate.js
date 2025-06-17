const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
require('dotenv').config();

const basename = path.basename(__filename);
const db = {};

// Khởi tạo Sequelize connection
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  }
);

// Load toàn bộ models tự động
fs.readdirSync(__dirname)
  .filter(file => file.endsWith('.js') && file !== basename)
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Associations
const {
  User, Tour, TourSchedule, TourPricing, Booking, Review, TourImage, Payment, FAQ,
  Promotion, TourCategory, TourTourCategory, Location, Itinerary, ItineraryLocation,
  TourIncludedService, ExcludedService, TourExcludedService
} = db;

// Booking - User
User.hasMany(Booking, { foreignKey: 'user_id' });
Booking.belongsTo(User, { foreignKey: 'user_id' });

// Booking - TourSchedule
TourSchedule.hasMany(Booking, { foreignKey: 'tour_schedule_id' });
Booking.belongsTo(TourSchedule, { foreignKey: 'tour_schedule_id' });

// Review - Booking
Booking.hasMany(Review, { foreignKey: 'booking_id' });
Review.belongsTo(Booking, { foreignKey: 'booking_id' });

// Payment - Booking
Booking.hasMany(Payment, { foreignKey: 'booking_id' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id' });

// Tour - TourSchedule
Tour.hasMany(TourSchedule, { foreignKey: 'tour_id' });
TourSchedule.belongsTo(Tour, { foreignKey: 'tour_id' });

// Tour - TourPricing
Tour.hasMany(TourPricing, { foreignKey: 'tour_id' });
TourPricing.belongsTo(Tour, { foreignKey: 'tour_id' });

// Tour - TourImage
Tour.hasMany(TourImage, { foreignKey: 'tour_id' });
TourImage.belongsTo(Tour, { foreignKey: 'tour_id' });

// Tour - IncludedService
Tour.hasMany(TourIncludedService, { foreignKey: 'tour_id' });
TourIncludedService.belongsTo(Tour, { foreignKey: 'tour_id' });

// Tour - ExcludedService (many-to-many)
Tour.belongsToMany(ExcludedService, {
  through: TourExcludedService,
  foreignKey: 'tour_id',
  otherKey: 'excluded_service_id'
});
ExcludedService.belongsToMany(Tour, {
  through: TourExcludedService,
  foreignKey: 'excluded_service_id',
  otherKey: 'tour_id'
});

// Tour - TourCategory (many-to-many)
Tour.belongsToMany(TourCategory, {
  through: TourTourCategory,
  foreignKey: 'tour_id',
  otherKey: 'category_id'
});
TourCategory.belongsToMany(Tour, {
  through: TourTourCategory,
  foreignKey: 'category_id',
  otherKey: 'tour_id'
});

// Itinerary - Tour
Tour.hasMany(Itinerary, { foreignKey: 'tour_id' });
Itinerary.belongsTo(Tour, { foreignKey: 'tour_id' });

// Itinerary - Location (many-to-many)
Itinerary.belongsToMany(Location, {
  through: ItineraryLocation,
  foreignKey: 'itinerary_id',
  otherKey: 'location_id'
});
Location.belongsToMany(Itinerary, {
  through: ItineraryLocation,
  foreignKey: 'location_id',
  otherKey: 'itinerary_id'
});

// Export
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
