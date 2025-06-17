module.exports = (sequelize, DataTypes) => {
  const TourPricing = sequelize.define('TourPricing', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tour_id: { type: DataTypes.UUID, allowNull: false },
    price_type: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(10), defaultValue: 'VND' }
  }, {
    tableName: 'tour_pricing',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return TourPricing;
};
