module.exports = (sequelize, DataTypes) => {
  const ItineraryLocation = sequelize.define('ItineraryLocation', {
    itinerary_id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
    location_id: { type: DataTypes.UUID, allowNull: false, primaryKey: true }
  }, {
    tableName: 'itinerary_location',
    timestamps: false
  });

  return ItineraryLocation;
};
