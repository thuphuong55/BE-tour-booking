module.exports = (sequelize, DataTypes) => {
  const Tour = sequelize.define('Tour', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    agency_id: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    location: { type: DataTypes.STRING },
    destination: { type: DataTypes.STRING },
    departure_location: { type: DataTypes.STRING },
    price: { type: DataTypes.FLOAT, allowNull: true },
    promotion_id: { type: DataTypes.UUID, allowNull: true },
    tour_type: { type: DataTypes.ENUM('Trong nước', 'Quốc tế'), defaultValue: 'Trong nước' },
    max_participants: { type: DataTypes.INTEGER, allowNull: false },
    min_participants: { type: DataTypes.INTEGER, defaultValue: 1 },
    status: { type: DataTypes.ENUM('Chờ duyệt', 'Đang hoạt động', 'Ngừng hoạt động', 'Đã hủy'), defaultValue: 'Chờ duyệt' }
  }, {
    tableName: 'tour',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Tour.associate = (models) => {
    Tour.hasMany(models.DepartureDate, {
      foreignKey: "tour_id",
      as: "departureDates",
    });

    Tour.belongsToMany(models.Hotel, {
      through: "tour_hotel",
      foreignKey: "tour_id",
      otherKey: "id_hotel",
      as: "hotels",
    });

    Tour.belongsToMany(models.TourCategory, {
      through: models.TourTourCategory,
      foreignKey: 'tour_id',
      otherKey: 'category_id',
      as: 'categories'
    });

    Tour.belongsToMany(models.IncludedService, {
      through: models.TourIncludedService,
      foreignKey: 'tour_id',
      otherKey: 'included_service_id',
      as: 'includedServices'
    });

    Tour.hasMany(models.TourImage, {
      foreignKey: 'tour_id',
      as: 'images'
    });

     Tour.hasMany(models.Review, {
    foreignKey: 'tour_id',
    as: 'reviews'
  });

  Tour.belongsTo(models.Agency, {
    foreignKey: 'agency_id',
    as: 'agency'
  });

  Tour.belongsTo(models.Promotion, {
  foreignKey: 'promotion_id',
  as: 'promotion'
  });

 };
return Tour;
};
