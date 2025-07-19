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
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      image_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      destination_id: {
        type: DataTypes.UUID,
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
      as: "destinations",
      onDelete: "CASCADE"
    });
    
    Location.belongsToMany(models.Itinerary, {
      through: models.ItineraryLocation,
      foreignKey: "location_id",
      as: "itineraries",
      onDelete: "CASCADE"
    });

    // Quan hệ với Hotel (một-nhiều)
    Location.hasMany(models.Hotel, {
      foreignKey: "location_id",
      as: "hotels"
    });
  };

  return Location;
};
