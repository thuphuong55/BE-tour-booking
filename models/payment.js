module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    booking_id: { type: DataTypes.UUID, allowNull: true }, // Allow null for direct payments
    order_id: { type: DataTypes.STRING, allowNull: true }, // lưu orderId từ MoMo và VNPay
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    payment_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    payment_method: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'completed', 'failed'), defaultValue: 'pending' },
    
    // Additional fields for VNPay/MoMo integration
    user_id: { type: DataTypes.UUID, allowNull: true }, // For guest payments
    transaction_id: { type: DataTypes.STRING, allowNull: true }, // Payment gateway transaction ID  
    paid_at: { type: DataTypes.DATE, allowNull: true }, // When payment was completed
    vnpay_response: { type: DataTypes.TEXT, allowNull: true }, // Store VNPay response for debugging
    momo_response: { type: DataTypes.TEXT, allowNull: true } // Store MoMo response for debugging
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
