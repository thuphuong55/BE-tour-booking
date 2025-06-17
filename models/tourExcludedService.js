module.exports = (sequelize, DataTypes) => {
  const TourExcludedService = sequelize.define('TourExcludedService', {
    tour_id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
    excluded_service_id: { type: DataTypes.UUID, allowNull: false, primaryKey: true }
  }, {
    tableName: 'tour_excluded_service',
    timestamps: false
  });

  return TourExcludedService;
};
