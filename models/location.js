module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define('Location', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    image_url: { type: DataTypes.STRING }
  }, {
    tableName: 'location',
    timestamps: false
  });

  return Location;
};
