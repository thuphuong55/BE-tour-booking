module.exports = (sequelize, DataTypes) => {
  const TourIncludedService = sequelize.define('TourIncludedService', {
    tour_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    included_service_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    tableName: 'tour_included_service',
    timestamps: false
  });

  return TourIncludedService;
};
