module.exports = (sequelize, DataTypes) => {
  const IncludedService = sequelize.define('IncludedService', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false }
  }, {
    tableName: 'included_service',
    timestamps: false
  });

  IncludedService.associate = models => {
    IncludedService.belongsToMany(models.Tour, {
      through: models.TourIncludedService,
      foreignKey: 'included_service_id',
      otherKey: 'tour_id',
      as: 'tours'
    });
  };

  return IncludedService;
};
