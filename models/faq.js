module.exports = (sequelize, DataTypes) => {
  const FAQ = sequelize.define('FAQ', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    question: { type: DataTypes.TEXT, allowNull: false },
    answer: { type: DataTypes.TEXT, allowNull: false }
  }, {
    tableName: 'faq',
    timestamps: false
  });

  return FAQ;
};
