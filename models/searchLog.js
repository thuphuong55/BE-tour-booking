module.exports = (sequelize, DataTypes) => {
  const SearchLog = sequelize.define('SearchLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    keyword: {
      type: DataTypes.STRING,
      allowNull: false
    },
    searched_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'search_logs',
    timestamps: false
  });

  return SearchLog;
};
