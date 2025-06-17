module.exports = (sequelize, DataTypes) => {
  const ExcludedService = sequelize.define('ExcludedService', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    service_name: { type: DataTypes.STRING, allowNull: false }
  }, {
    tableName: 'excluded_service',
    timestamps: false
  });

  return ExcludedService;
};
