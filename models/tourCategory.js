module.exports = (sequelize, DataTypes) => {
  const TourCategory = sequelize.define('TourCategory', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    image: { type: DataTypes.STRING, allowNull: true }
  }, {
    tableName: 'tour_category',
    timestamps: false
  });

  TourCategory.associate = (models) => {
    // ✅ Quan hệ nhiều-nhiều với Tour
    TourCategory.belongsToMany(models.Tour, {
      through: models.TourTourCategory,
      foreignKey: 'category_id',
      otherKey: 'tour_id',
      as: 'tours'
    });
  };

  return TourCategory;
};
