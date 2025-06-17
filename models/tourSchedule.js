module.exports = (sequelize, DataTypes) => {
  const TourSchedule = sequelize.define('TourSchedule', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tour_id: { type: DataTypes.UUID, allowNull: false },
    start_date: { type: DataTypes.DATE, allowNull: false },
    end_date: { type: DataTypes.DATE, allowNull: false },
    available_slots: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM('available', 'full', 'cancelled'), defaultValue: 'available' }
  }, {
    tableName: 'tour_schedule',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return TourSchedule;
};
