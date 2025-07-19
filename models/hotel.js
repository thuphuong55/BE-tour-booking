module.exports = (sequelize, DataTypes) => {
  const Hotel = sequelize.define("Hotel", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'id_hotel' // Map to database column name
    },
    ten_khach_san: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ten_phong: {
      type: DataTypes.STRING,
    },
    loai_phong: {
      type: DataTypes.STRING,
    },
    location_id: {
      type: DataTypes.UUID,
      allowNull: true,
    }
  }, {
    tableName: "hotels",
    timestamps: true, // Database có createdAt/updatedAt
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  Hotel.associate = (models) => {
    // Quan hệ với Tour (nhiều-nhiều)
    Hotel.belongsToMany(models.Tour, {
      through: "tour_hotel",
      foreignKey: "id_hotel",
      otherKey: "tour_id",
    });

    // Quan hệ với Location (nhiều-một)
    Hotel.belongsTo(models.Location, {
      foreignKey: "location_id",
      as: "location"
    });
  };

  return Hotel;
};
