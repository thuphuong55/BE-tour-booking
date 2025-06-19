module.exports = (sequelize, DataTypes) => {
  const ItineraryLocation = sequelize.define('ItineraryLocation', {
    itinerary_id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
    location_id: { type: DataTypes.UUID, allowNull: false, primaryKey: true }
  }, {
    tableName: 'itinerary_location',
    timestamps: false
  });
  ItineraryLocation.associate = (models) => {
  ItineraryLocation.belongsTo(models.Itinerary, {
    foreignKey: "itinerary_id",
    as: "itinerary"
  });

  ItineraryLocation.belongsTo(models.Location, {
    foreignKey: "location_id",
    as: "location"
  });
};


  return ItineraryLocation;
};
