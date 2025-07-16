module.exports = (sequelize, DataTypes) => {
  const ExcludedService = sequelize.define('ExcludedService', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    service_name: { type: DataTypes.STRING, allowNull: false }
  }, {
    tableName: 'excluded_service',
    timestamps: false
  });

  ExcludedService.associate = models => {
    ExcludedService.belongsToMany(models.Tour, {
      through: models.TourExcludedService,
      foreignKey: 'excluded_service_id',
      otherKey: 'tour_id',
      as: 'tours'
    });
  };

  return ExcludedService;
};
