module.exports = (sequelize, DataTypes) => {
  const Hotel = sequelize.define("Hotel", {
    id_hotel: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
  });

  Hotel.associate = (models) => {
    Hotel.belongsToMany(models.Tour, {
      through: "tour_hotel",
      foreignKey: "id_hotel",
      otherKey: "tour_id",
    });
  };

  return Hotel;
};
