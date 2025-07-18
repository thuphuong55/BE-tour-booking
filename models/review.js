module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    booking_id: { type: DataTypes.UUID, allowNull: false },
    tour_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
    rating: { type: DataTypes.INTEGER, allowNull: false },
    comment: { type: DataTypes.TEXT },
    review_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'review',
    timestamps: false
  });

  Review.associate = models => {
    Review.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });

    Review.belongsTo(models.Tour, {
      foreignKey: 'tour_id',
      as: 'tour',
      onDelete: 'CASCADE'
    });
  };

  return Review;
};
