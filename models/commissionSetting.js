module.exports = (sequelize, DataTypes) => {
  const CommissionSetting = sequelize.define('CommissionSetting', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'ID của agency'
    },
    commission_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 15.00,
      comment: 'Tỷ lệ hoa hồng admin (%) - VD: 15.00 = 15%'
    },
    min_booking_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Giá trị booking tối thiểu để áp dụng tỷ lệ này'
    },
    max_booking_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Giá trị booking tối đa để áp dụng tỷ lệ này'
    },
    tour_category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Áp dụng cho danh mục tour cụ thể (null = áp dụng chung)'
    },
    effective_from: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Ngày bắt đầu có hiệu lực'
    },
    effective_to: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Ngày kết thúc hiệu lực'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'commission_settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  CommissionSetting.associate = (models) => {
    // Quan hệ với User (Agency)
    CommissionSetting.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'agency'
    });

    // Quan hệ với TourCategory
    CommissionSetting.belongsTo(models.TourCategory, {
      foreignKey: 'tour_category_id',
      as: 'tourCategory'
    });
  };

  // Static method để tìm tỷ lệ hoa hồng phù hợp
  CommissionSetting.findCommissionRate = async function(userId, bookingValue, tourCategoryId = null) {
    const now = new Date();
    
    // Tìm cấu hình hoa hồng phù hợp theo độ ưu tiên
    const setting = await this.findOne({
      where: {
        user_id: userId,
        is_active: true,
        effective_from: { [sequelize.Sequelize.Op.lte]: now },
        [sequelize.Sequelize.Op.or]: [
          { effective_to: null },
          { effective_to: { [sequelize.Sequelize.Op.gte]: now } }
        ],
        [sequelize.Sequelize.Op.and]: [
          sequelize.Sequelize.where(
            sequelize.Sequelize.literal(`
              (min_booking_value IS NULL OR min_booking_value <= ${bookingValue}) AND
              (max_booking_value IS NULL OR max_booking_value >= ${bookingValue})
            `), true
          )
        ]
      },
      order: [
        // Ưu tiên cấu hình có tour_category_id trước
        [sequelize.Sequelize.literal('tour_category_id IS NOT NULL'), 'DESC'],
        // Sau đó ưu tiên cấu hình có min/max value cụ thể
        [sequelize.Sequelize.literal('min_booking_value IS NOT NULL OR max_booking_value IS NOT NULL'), 'DESC'],
        ['effective_from', 'DESC']
      ]
    });

    return setting ? parseFloat(setting.commission_rate) : 15.00; // Default 15%
  };

  return CommissionSetting;
};
