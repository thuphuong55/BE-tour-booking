module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'inactive'
    },
    temp_password_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true // tên người/công ty đăng ký
    },
    isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
}

  }, {
    timestamps: true, // ⚠️ Bật timestamps
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'users'
  });
    
  User.associate = models => {
  User.hasMany(models.Review, {
    foreignKey: 'user_id',
    as: 'reviews'
  });
};

  return User;
};
