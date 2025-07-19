const { SearchLog, sequelize, Location, Tour, TourImage, DepartureDate, Promotion, Destination } = require("../models");
const { Op } = require("sequelize");



exports.logSearch = async (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword || keyword.trim() === "") {
      return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });
    }

    await SearchLog.create({ keyword: keyword.trim() });

    res.status(201).json({ message: "Đã ghi log tìm kiếm" });
  } catch (error) {
    console.error("Lỗi ghi log:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getTopSearchLocations = async (req, res) => {
  try {
    const [topKeywords] = await sequelize.query(`
      SELECT keyword, COUNT(*) as count
      FROM search_logs
      GROUP BY keyword
      ORDER BY count DESC
      LIMIT 5;
    `);

    const keywords = topKeywords.map(k => k.keyword);

    const locations = await Location.findAll({
      where: {
        [Op.or]: keywords.map(k => ({
          name: { [Op.like]: `%${k}%` }
        }))
      },
      attributes: ["id", "name", "image_url", "description"]
    });

    // Lấy tours cho mỗi location
    const locationsWithTours = await Promise.all(
      locations.map(async (location) => {
        const tours = await Tour.findAll({
          where: {
            [Op.or]: [
              sequelize.where(
                sequelize.fn('LOWER', sequelize.col('location')), 
                'LIKE', 
                `%${location.name.toLowerCase()}%`
              ),
              sequelize.where(
                sequelize.fn('LOWER', sequelize.col('destination')), 
                'LIKE', 
                `%${location.name.toLowerCase()}%`
              )
            ]
          },
          include: [
            {
              model: TourImage,
              as: 'images',
              attributes: ['id', 'image_url', 'is_main']
            },
            {
              model: DepartureDate,
              as: 'departureDates',
              attributes: ['id', 'departure_date', 'end_date', 'number_of_days', 'number_of_nights']
            },
            {
              model: Promotion,
              as: 'promotion',
              attributes: ['id', 'code', 'description', 'discount_amount'],
              required: false
            }
          ],
          limit: 3, // Giới hạn 3 tours mỗi location
          order: [['created_at', 'DESC']]
        });

        return {
          ...location.toJSON(),
          tours: tours
        };
      })
    );

    res.json({ locations: locationsWithTours });
  } catch (err) {
    console.error("Lỗi lấy top tỉnh thành nổi bật:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getTopSearchDestinations = async (req, res) => {
  try {
    const [topKeywords] = await sequelize.query(`
      SELECT keyword, COUNT(*) as count
      FROM search_logs
      GROUP BY keyword
      ORDER BY count DESC
      LIMIT 5;
    `);

    const keywords = topKeywords.map(k => k.keyword);

    const destinations = await Destination.findAll({
      where: {
        [Op.or]: keywords.map(k => ({
          name: { [Op.like]: `%${k}%` }
        }))
      },
      attributes: ["id", "name", "image"],
      include: [
        {
          model: Location,
          as: "location",
          attributes: ["id", "name", "image_url", "description"]
        }
      ]
    });

    // Lấy tours cho mỗi destination
    const destinationsWithTours = await Promise.all(
      destinations.map(async (destination) => {
        const tours = await Tour.findAll({
          where: {
            [Op.or]: [
              sequelize.where(
                sequelize.fn('LOWER', sequelize.col('location')), 
                'LIKE', 
                `%${destination.name.toLowerCase()}%`
              ),
              sequelize.where(
                sequelize.fn('LOWER', sequelize.col('destination')), 
                'LIKE', 
                `%${destination.name.toLowerCase()}%`
              )
            ]
          },
          include: [
            {
              model: TourImage,
              as: 'images',
              attributes: ['id', 'image_url', 'is_main']
            },
            {
              model: DepartureDate,
              as: 'departureDates',
              attributes: ['id', 'departure_date', 'end_date', 'number_of_days', 'number_of_nights']
            },
            {
              model: Promotion,
              as: 'promotion',
              attributes: ['id', 'code', 'description', 'discount_amount'],
              required: false
            }
          ],
          limit: 3, // Giới hạn 3 tours mỗi destination
          order: [['created_at', 'DESC']]
        });

        return {
          ...destination.toJSON(),
          tours: tours
        };
      })
    );

    res.json({ destinations: destinationsWithTours });
  } catch (err) {
    console.error("Lỗi lấy top điểm đến nổi bật:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};
