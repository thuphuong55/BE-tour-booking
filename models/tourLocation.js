module.exports = (sequelize, DataTypes) => {
  const TourLocation = sequelize.define('TourLocation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tour_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    location_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    tableName: 'tour_location',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return TourLocation;
};
