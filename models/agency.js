module.exports = (sequelize, DataTypes) => {
  const Agency = sequelize.define('Agency', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'User', key: 'id' } },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    phone: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.TEXT, allowNull: false },
    tax_code: { type: DataTypes.STRING, allowNull: false },
    business_license: { type: DataTypes.TEXT, allowNull: false },
    website: { type: DataTypes.STRING },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'), defaultValue: 'pending' }
  }, {
    tableName: 'agency',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Agency;
};
