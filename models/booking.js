module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false },
    tour_id: { type: DataTypes.UUID, allowNull: false }, 
    departure_date_id: { type: DataTypes.UUID, allowNull: false},
    total_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    booking_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'), defaultValue: 'pending' },
  
  }, {
    tableName: 'booking',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Booking.associate = (models) => {
    Booking.belongsTo(models.Tour, {
      foreignKey: 'tour_id',
      as: 'tour'
    });

    Booking.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    Booking.belongsTo(models.DepartureDate, {
      foreignKey: 'departure_date_id',
      as: 'departureDate'
    });
    Booking.hasMany(models.InformationBookingTour, {
      foreignKey: 'booking_id',
      as: 'guests'
    });
     Booking.hasOne(models.Payment, {
      foreignKey: 'booking_id',
      as: 'payment'
    });

};

  return Booking;
};
