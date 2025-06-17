module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false },
    tour_schedule_id: { type: DataTypes.UUID, allowNull: false },
    total_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    booking_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'), defaultValue: 'pending' },
    number_of_adults: { type: DataTypes.INTEGER, defaultValue: 1 },
    number_of_children: { type: DataTypes.INTEGER, defaultValue: 0 }
  }, {
    tableName: 'booking',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Booking;
};
