module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define(
    "Location",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      image_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      destination_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: "location",
      timestamps: false
    }
  );


  Location.associate = (models) => {
    Location.belongsTo(models.Destination, {
      foreignKey: "destination_id",
      as: "destination",
    });
  };

  return Location;
};
