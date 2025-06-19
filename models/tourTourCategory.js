module.exports = (sequelize, DataTypes) => {
  const TourTourCategory = sequelize.define('TourTourCategory', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tour_id: { type: DataTypes.UUID, allowNull: false },
    category_id: { type: DataTypes.UUID, allowNull: false }
  }, {
    tableName: 'tour_tour_category',
    timestamps: false
  });

  return TourTourCategory;
};
