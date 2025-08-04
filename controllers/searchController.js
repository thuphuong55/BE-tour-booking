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
    console.log("🔍 Getting all locations with tours...");
    
    // Lấy TẤT CẢ locations thay vì chỉ top search keywords
    const locations = await Location.findAll({
      attributes: ["id", "name", "image_url", "description"],
      order: [['name', 'ASC']] // Sắp xếp theo tên
    });

    console.log(`📍 Found ${locations.length} total locations`);

    // Lấy tours cho mỗi location và chỉ giữ location có ít nhất 1 tour
    const locationsWithTours = [];
    for (const location of locations) {
      const tours = await Tour.findAll({
        where: {
          [Op.and]: [
            // Lấy tours đang hoạt động HOẶC status rỗng/null (có thể là tours chưa set status)
            {
              [Op.or]: [
                { status: 'Đang hoạt động' },
                { status: '' },
                { status: null }
              ]
            },
            // Match location hoặc destination
            {
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
            }
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
        limit: 10, // Tăng từ 5 lên 10 tours mỗi location để đảm bảo lấy đủ
        order: [['created_at', 'DESC']]
      });

      // Chỉ thêm location nếu có ít nhất 1 tour
      if (tours && tours.length > 0) {
        locationsWithTours.push({
          ...location.toJSON(),
          tours: tours
        });
      }
    }

    console.log(`✅ Final result: ${locationsWithTours.length} locations with tours`);

    res.json({ locations: locationsWithTours });
  } catch (err) {
    console.error("❌ Lỗi lấy top tỉnh thành nổi bật:", err);
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

    // Lấy tours cho mỗi destination và chỉ giữ destination có ít nhất 1 tour
    const destinationsWithTours = [];
    for (const destination of destinations) {
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
        limit: 3,
        order: [['created_at', 'DESC']]
      });

      // Chỉ thêm destination nếu có ít nhất 1 tour
      if (tours && tours.length > 0) {
        destinationsWithTours.push({
          ...destination.toJSON(),
          tours: tours
        });
      }
    }

    res.json({ destinations: destinationsWithTours });
  } catch (err) {
    console.error("Lỗi lấy top điểm đến nổi bật:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * API gợi ý tìm kiếm (autocomplete/suggestions)
 * GET /api/search/suggestions?q=da
 */
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 1) {
      return res.json({ suggestions: [] });
    }

    const keyword = q.trim().toLowerCase();
    console.log(`🔍 Getting search suggestions for: "${keyword}"`);

    // Tìm kiếm trong các trường: name, location, destination của Tour
    const tourSuggestions = await Tour.findAll({
      where: {
        [Op.and]: [
          // Chỉ lấy tours đang hoạt động
          {
            [Op.or]: [
              { status: 'Đang hoạt động' },
              { status: '' },
              { status: null }
            ]
          },
          // Tìm kiếm theo từ khóa
          {
            [Op.or]: [
              sequelize.where(
                sequelize.fn('LOWER', sequelize.col('name')), 
                'LIKE', 
                `%${keyword}%`
              ),
              sequelize.where(
                sequelize.fn('LOWER', sequelize.col('location')), 
                'LIKE', 
                `%${keyword}%`
              ),
              sequelize.where(
                sequelize.fn('LOWER', sequelize.col('destination')), 
                'LIKE', 
                `%${keyword}%`
              )
            ]
          }
        ]
      },
      attributes: ['id', 'name', 'location', 'destination', 'price'],
      include: [
        {
          model: TourImage,
          as: 'images',
          attributes: ['image_url'],
          where: { is_main: true },
          required: false,
          limit: 1
        }
      ],
      limit: 8,
      order: [
        // Ưu tiên tour có tên bắt đầu với từ khóa
        [sequelize.fn('CASE', 
          sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'LIKE', `${keyword}%`), 1,
          sequelize.where(sequelize.fn('LOWER', sequelize.col('location')), 'LIKE', `${keyword}%`), 2,
          sequelize.where(sequelize.fn('LOWER', sequelize.col('destination')), 'LIKE', `${keyword}%`), 3,
          4
        ), 'ASC'],
        ['name', 'ASC']
      ]
    });

    // Tìm kiếm trong Location
    const locationSuggestions = await Location.findAll({
      where: {
        [Op.or]: [
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('name')), 
            'LIKE', 
            `%${keyword}%`
          ),
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('description')), 
            'LIKE', 
            `%${keyword}%`
          )
        ]
      },
      attributes: ['id', 'name', 'image_url', 'description'],
      limit: 5,
      order: [
        [sequelize.fn('CASE', 
          sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'LIKE', `${keyword}%`), 1,
          2
        ), 'ASC'],
        ['name', 'ASC']
      ]
    });

    // Tìm kiếm trong Destination
    const destinationSuggestions = await Destination.findAll({
      where: {
        [Op.or]: [
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('name')), 
            'LIKE', 
            `%${keyword}%`
          )
        ]
      },
      attributes: ['id', 'name', 'image'],
      include: [
        {
          model: Location,
          as: "location",
          attributes: ["name"]
        }
      ],
      limit: 5,
      order: [
        [sequelize.fn('CASE', 
          sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'LIKE', `${keyword}%`), 1,
          2
        ), 'ASC'],
        ['name', 'ASC']
      ]
    });

    // Format kết quả
    const suggestions = {
      tours: tourSuggestions.map(tour => ({
        id: tour.id,
        name: tour.name,
        location: tour.location,
        destination: tour.destination,
        price: tour.price,
        image: tour.images?.[0]?.image_url || null,
        type: 'tour'
      })),
      locations: locationSuggestions.map(location => ({
        id: location.id,
        name: location.name,
        image: location.image_url,
        description: location.description,
        type: 'location'
      })),
      destinations: destinationSuggestions.map(destination => ({
        id: destination.id,
        name: destination.name,
        image: destination.image,
        location: destination.location?.name,
        type: 'destination'
      }))
    };

    console.log(`✅ Found ${suggestions.tours.length} tours, ${suggestions.locations.length} locations, ${suggestions.destinations.length} destinations`);

    res.json({ 
      keyword: q,
      suggestions 
    });

  } catch (err) {
    console.error("❌ Lỗi lấy gợi ý tìm kiếm:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};
