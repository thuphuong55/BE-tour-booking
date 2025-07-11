module.exports = (sequelize, DataTypes) => {
  const Destination = sequelize.define("Destination", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    location_id: {
      type: DataTypes.UUID,}
  },
  {
    tableName: "destination",
    timestamps: false
  });

  Destination.associate = (models) => {
    Destination.belongsTo(models.Location, {
      foreignKey: "location_id",
      as: "location"
    });
  };

  return Destination;
};
