module.exports = (sequelize, DataTypes) => {
  const FAQ = sequelize.define('FAQ', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    question: { type: DataTypes.TEXT, allowNull: false },
    answer: { type: DataTypes.TEXT, allowNull: false },
    category: { 
      type: DataTypes.STRING(50), 
      allowNull: true,
      comment: 'Phân loại FAQ: booking, tour, payment, general'
    },
    keywords: { 
      type: DataTypes.JSON, 
      allowNull: true,
      comment: 'Keywords để search FAQ: ["đặt tour", "thanh toán", "hủy"]'
    },
    order_priority: { 
      type: DataTypes.INTEGER, 
      defaultValue: 0,
      comment: 'Thứ tự ưu tiên hiển thị (số càng cao càng ưu tiên)'
    },
    is_active: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: true,
      comment: 'FAQ có đang active không'
    },
    view_count: { 
      type: DataTypes.INTEGER, 
      defaultValue: 0,
      comment: 'Số lần FAQ được xem/click'
    }
  }, {
    tableName: 'faq',
    timestamps: true, // Thêm created_at, updated_at
    underscored: true
  });

  return FAQ;
};
