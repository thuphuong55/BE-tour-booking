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

  return Itinerary;
};
