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
    }
  }, {
    tableName: "destination",
    timestamps: false
  });

  Destination.associate = (models) => {
    Destination.hasMany(models.Location, {
      foreignKey: "destination_id",
      as: "locations"
    });
  };

  return Destination;
};
