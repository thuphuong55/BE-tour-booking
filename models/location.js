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
      }
    },
    {
      tableName: "location",
      timestamps: false
    }
  );

  Location.associate = (models) => {
    Location.hasMany(models.Destination, {
      foreignKey: "location_id",
      as: "destinations"
    });
  };

  return Location;
};
