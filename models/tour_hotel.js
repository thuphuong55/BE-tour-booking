module.exports = (sequelize, DataTypes) => {
  const TourHotel = sequelize.define("tour_hotel", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tour_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_hotel: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  });

  TourHotel.associate = (models) => {
    TourHotel.belongsTo(models.Tour, {
      foreignKey: "tour_id",
      as: "tour",
    });

    TourHotel.belongsTo(models.Hotel, {
      foreignKey: "id_hotel",
      as: "hotel",
    });
  };

  return TourHotel;
};
