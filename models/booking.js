module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false },
    tour_id: { 
      type: DataTypes.UUID, 
      allowNull: false,
      field: 'tour_schedule_id' // Map to actual database column name
    }, 
    departure_date_id: { type: DataTypes.UUID, allowNull: false},
    promotion_id: { type: DataTypes.UUID, allowNull: true },
    original_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    discount_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    total_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    booking_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'), defaultValue: 'pending' },
    
    // Các trường hoa hồng
    commission_rate: { 
      type: DataTypes.DECIMAL(5, 2), 
      allowNull: true,
      comment: 'Tỷ lệ hoa hồng admin (%) - VD: 15.00 = 15%'
    },
    admin_commission: { 
      type: DataTypes.DECIMAL(12, 2), 
      allowNull: true,
      comment: 'Số tiền hoa hồng admin nhận được'
    },
    agency_amount: { 
      type: DataTypes.DECIMAL(12, 2), 
      allowNull: true,
      comment: 'Số tiền agency nhận được sau khi trừ hoa hồng'
    },
    commission_calculated_at: { 
      type: DataTypes.DATE, 
      allowNull: true,
      comment: 'Thời điểm tính hoa hồng'
    },
    number_of_adults: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    number_of_children: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

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
    
    Booking.belongsTo(models.Promotion, {
      foreignKey: 'promotion_id',
      as: 'promotion'
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
