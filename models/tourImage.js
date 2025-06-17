module.exports = (sequelize, DataTypes) => {
  const TourImage = sequelize.define('TourImage', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tour_id: { type: DataTypes.UUID, allowNull: false },
    image_url: { type: DataTypes.STRING, allowNull: false },
    is_main: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'tour_image',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return TourImage;
};
