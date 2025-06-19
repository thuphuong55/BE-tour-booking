module.exports = (sequelize, DataTypes) => {
  const Tour = sequelize.define('Tour', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    agency_id: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    location: { type: DataTypes.STRING },
    destination: { type: DataTypes.STRING },
    duration_days: { type: DataTypes.INTEGER, allowNull: false },
    duration_nights: { type: DataTypes.INTEGER, defaultValue: 0 },
    departure_location: { type: DataTypes.STRING },
    tour_type: { type: DataTypes.ENUM('Domestic', 'International'), defaultValue: 'Domestic' },
    max_participants: { type: DataTypes.INTEGER, allowNull: false },
    min_participants: { type: DataTypes.INTEGER, defaultValue: 1 },
    status: { type: DataTypes.ENUM('draft', 'active', 'inactive', 'cancelled'), defaultValue: 'draft' }
  }, {
    tableName: 'tour',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  Tour.associate = (models) => {
    Tour.hasMany(models.DepartureDate, {
      foreignKey: "tour_id",
      as: "departureDates",
    });

    Tour.belongsToMany(models.Hotel, {
      through: "tour_hotel",
      foreignKey: "tour_id",
      otherKey: "id_hotel",
      as: "hotels",
    });
  };



  return Tour;
};
