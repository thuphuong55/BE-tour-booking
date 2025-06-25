module.exports = (sequelize, DataTypes) => {
  const InformationBookingTour = sequelize.define('InformationBookingTour', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    booking_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isEmail: true }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cccd: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'information_booking_tour',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  InformationBookingTour.associate = (models) => {
    InformationBookingTour.belongsTo(models.Booking, {
      foreignKey: 'booking_id',
      as: 'booking'
    });
  };

  return InformationBookingTour;
};
