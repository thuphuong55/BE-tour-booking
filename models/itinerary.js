module.exports = (sequelize, DataTypes) => {
  const Itinerary = sequelize.define('Itinerary', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tour_id: { type: DataTypes.UUID, allowNull: false },
    day_number: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT }
  }, {
    tableName: 'itinerary',
    timestamps: false
  });

  Itinerary.associate = (models) => {
    Itinerary.belongsTo(models.Tour, {
      foreignKey: 'tour_id',
      as: 'tour'
    });

    Itinerary.belongsToMany(models.Location, {
      through: models.ItineraryLocation,
      foreignKey: 'itinerary_id',
      otherKey: 'location_id',
      as: 'locations'
    });
  };

  return Itinerary;
};
