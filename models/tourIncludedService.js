module.exports = (sequelize, DataTypes) => {
  const TourIncludedService = sequelize.define('TourIncludedService', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tour_id: { type: DataTypes.UUID, allowNull: false },
    service_name: { type: DataTypes.STRING, allowNull: false }
  }, {
    tableName: 'tour_included_service',
    timestamps: false
  });

  return TourIncludedService;
};
