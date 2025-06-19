module.exports = (sequelize, DataTypes) => {
  const DepartureDate = sequelize.define('DepartureDate', {
    ngaykhoihanh_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tour_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    ngay_khoi_hanh: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    ghi_chu: {
      type: DataTypes.STRING,
    },
  });

  DepartureDate.associate = (models) => {
    DepartureDate.belongsTo(models.Tour, {
      foreignKey: 'tour_id',
      as: 'tour',
      onDelete: 'CASCADE',
    });
  };

  return DepartureDate;
};
