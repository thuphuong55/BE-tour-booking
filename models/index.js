require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: false
  } 
);


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Agency = require('./agency')(sequelize, DataTypes);
db.User = require('./user')(sequelize, DataTypes);
db.Tour = require('./tour')(sequelize, DataTypes);
db.TourSchedule = require('./tourSchedule')(sequelize, DataTypes);
db.TourPricing = require('./tourPricing')(sequelize, DataTypes);
db.Booking = require('./booking')(sequelize, DataTypes);
db.Review = require('./review')(sequelize, DataTypes);
db.TourImage = require('./tourImage')(sequelize, DataTypes);
db.Payment = require('./payment')(sequelize, DataTypes);
db.FAQ = require('./faq')(sequelize, DataTypes);
db.Promotion = require('./promotion')(sequelize, DataTypes);
db.TourCategory = require('./tourCategory')(sequelize, DataTypes);
db.TourTourCategory = require('./tourTourCategory')(sequelize, DataTypes);
db.Destination = require("./destination")(sequelize, DataTypes);
db.Location = require('./location')(sequelize, DataTypes);
db.Itinerary = require('./itinerary')(sequelize, DataTypes);
db.ItineraryLocation = require('./itineraryLocation')(sequelize, DataTypes);
db.TourIncludedService = require('./tourIncludedService')(sequelize, DataTypes);
db.ExcludedService = require('./excludedService')(sequelize, DataTypes);
db.TourExcludedService = require('./tourExcludedService')(sequelize, DataTypes);
db.DepartureDate = require('./departureDate')(sequelize, DataTypes);
db.Hotel = require('./hotel')(sequelize, DataTypes);
db.TourHotel = require('./tour_hotel')(sequelize, DataTypes);
db.IncludedService = require('./includedService')(sequelize, DataTypes);
db.InformationBookingTour = require('./informationBookingTour')(sequelize, DataTypes);
db.SearchLog = require('./searchLog')(sequelize, DataTypes);
db.CommissionSetting = require('./commissionSetting')(sequelize, DataTypes);

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});






module.exports = db;
