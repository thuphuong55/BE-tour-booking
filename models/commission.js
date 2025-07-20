module.exports = (sequelize, DataTypes) => {
  const Commission = sequelize.define('Commission', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    booking_id: { type: DataTypes.UUID, allowNull: false },
    agency_id: { type: DataTypes.UUID, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    rate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    status: { type: DataTypes.ENUM('pending', 'paid', 'cancelled', 'reversal'), defaultValue: 'pending' },
    note: { type: DataTypes.STRING, allowNull: true }
  }, {
    tableName: 'commission',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Commission.associate = (models) => {
    Commission.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking' });
    Commission.belongsTo(models.User, { foreignKey: 'agency_id', as: 'agency' });
  };

  return Commission;
};
