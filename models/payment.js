module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    booking_id: { type: DataTypes.UUID, allowNull: false },
    order_id: { type: DataTypes.STRING, allowNull: true }, // lưu orderId từ MoMo
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    payment_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    payment_method: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'completed', 'failed'), defaultValue: 'pending' }
  }, {
    tableName: 'payment',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

    Payment.associate = (models) => {
    Payment.belongsTo(models.Booking, {
      foreignKey: 'booking_id',
      as: 'booking'
    });
  };

  return Payment;
};
