const { Op } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const DepartureDate = sequelize.define('DepartureDate', {
    id: {type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true  },
    tour_id: { type: DataTypes.UUID, allowNull: false },
    itinerary_id: { type: DataTypes.UUID },
    departure_date: { type: DataTypes.DATEONLY, allowNull: false },
    number_of_days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    number_of_nights: { type: DataTypes.INTEGER, defaultValue: 0 },
    end_date: { type: DataTypes.DATEONLY }, // ngày kết thúc, tự tính
   
  }, {
    tableName: 'departure_date',
    timestamps: false,
    hooks: {
      beforeCreate: (departure) => {
        if (departure.departure_date && departure.number_of_days) {
          const date = new Date(departure.departure_date);
          date.setDate(date.getDate() + departure.number_of_days);
          departure.end_date = date.toISOString().split('T')[0];
        }
      },
      beforeUpdate: (departure) => {
        if (departure.departure_date && departure.number_of_days) {
          const date = new Date(departure.departure_date);
          date.setDate(date.getDate() + departure.number_of_days);
          departure.end_date = date.toISOString().split('T')[0];
        }
      }
    }
  });

  DepartureDate.associate = (models) => {
    DepartureDate.belongsTo(models.Tour, {
      foreignKey: 'tour_id',
      as: 'tour'
    });

    DepartureDate.belongsTo(models.Itinerary, {
      foreignKey: 'itinerary_id',
      as: 'itinerary'
    });
  };

  return DepartureDate;
};
