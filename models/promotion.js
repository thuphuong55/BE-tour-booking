module.exports = (sequelize, DataTypes) => {
  const Promotion = sequelize.define('Promotion', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    discount_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    start_date: { type: DataTypes.DATE, allowNull: false },
    end_date: { type: DataTypes.DATE, allowNull: false }
  }, {
    tableName: 'promotion',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Promotion.associate = (models) => {
    Promotion.hasMany(models.Tour, {
      foreignKey: 'promotion_id',
      as: 'tours'
    });
  };

  return Promotion;
};
