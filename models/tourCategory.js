module.exports = (sequelize, DataTypes) => {
  const TourCategory = sequelize.define('TourCategory', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false }
  }, {
    tableName: 'tour_category',
    timestamps: false
  });

  return TourCategory;
};
