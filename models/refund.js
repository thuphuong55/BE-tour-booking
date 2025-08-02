module.exports = (sequelize, DataTypes) => {
  const Refund = sequelize.define("Refund", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    booking_id: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'booking_id'
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Số tiền hoàn lại'
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'pending, approved, rejected, completed'
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Lý do hoàn tiền'
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Thời gian xử lý hoàn tiền'
    },
    processed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Admin/User ID đã xử lý'
    }
  }, {
    tableName: "refunds",
    timestamps: true,
    underscored: true
  });

  Refund.associate = function(models) {
    Refund.belongsTo(models.Booking, { 
      foreignKey: "booking_id", 
      as: "booking" 
    });
    Refund.belongsTo(models.User, { 
      foreignKey: "user_id", 
      as: "user" 
    });
    Refund.belongsTo(models.User, { 
      foreignKey: "processed_by", 
      as: "processor" 
    });
  };

  return Refund;
};