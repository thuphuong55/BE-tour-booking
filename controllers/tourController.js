const { Tour, DepartureDate, TourImage, IncludedService, TourCategory, Hotel, ExcludedService, Itinerary, Location, Promotion, Agency, Destination } = require("../models");

// Lấy tất cả tour kèm các ngày khởi hành và ảnh
const getAll = async (req, res) => {
  try {
    // Phân quyền: admin xem tất cả, agency chỉ xem tour của mình
    let where = {};
    if (req.user && req.user.role === 'agency') {
      // Tìm agency_id từ user_id
      const agency = await Agency.findOne({
        where: { user_id: req.user.id }
      });
      
      if (agency) {
        where.agency_id = agency.id;
      } else {
        // Nếu không tìm thấy agency, trả về mảng rỗng
        return res.json([]);
      }
    }
    // Nếu có query agency_id thì filter đúng agency_id
    if (req.query.agency_id) {
      where.agency_id = req.query.agency_id;
    }
    const tours = await Tour.findAll({
      where,
      include: [
        {
          model: DepartureDate,
          as: 'departureDates',
          attributes: [
            ['id', 'departureDates_id'],
            'departure_date',
            'end_date',
            'number_of_days',
            'number_of_nights'
          ]
        },
        {
          model: TourImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_main']
        },
        {
          model: Promotion,
          as: 'promotion',
          attributes: ['id', 'code', 'description', 'discount_amount'],
          required: false
        }
      ]
    });
    res.json(tours);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách tour:", err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy 1 tour theo ID kèm ảnh và ngày khởi hành
const getById = async (req, res) => {
  try {
    const tour = await Tour.findByPk(req.params.id, {
      include: [
        {
          model: DepartureDate,
          as: 'departureDates',
          attributes: [
            ['id', 'departureDates_id'],
            'departure_date',
            'end_date',
            'number_of_days',
            'number_of_nights'
          ]
        },
        {
          model: TourImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_main']
        }
      ]
    });

    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }

    res.json(tour);
  } catch (err) {
    console.error("Lỗi khi lấy tour theo ID:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Tạo tour mới
const create = async (req, res) => {
  try {

    const tour = await Tour.create(req.body);

    // Thêm images
    if (req.body.images) {
      for (const img of req.body.images) {
        await TourImage.create({ ...img, tour_id: tour.id });
      }
    }

    // Thêm ngày khởi hành
    if (req.body.departureDates) {
      for (const date of req.body.departureDates) {
        await DepartureDate.create({ ...date, tour_id: tour.id });
      }
    }

    // Thêm dịch vụ bao gồm
    if (req.body.selectedIncludedServices && req.body.selectedIncludedServices.length > 0) {
      // Validate service IDs exist first
      const existingServices = await IncludedService.findAll({
        where: { id: req.body.selectedIncludedServices }
      });
      
      if (existingServices.length !== req.body.selectedIncludedServices.length) {
        console.log('Some included services not found:', req.body.selectedIncludedServices);
        console.log('Existing services:', existingServices.map(s => s.id));
      }
      
      if (existingServices.length > 0) {
        await tour.setIncludedServices(existingServices.map(s => s.id));
      }
    }

    // Thêm danh mục
    if (req.body.selectedCategories && req.body.selectedCategories.length > 0) {
      // Validate category IDs exist first
      const existingCategories = await TourCategory.findAll({
        where: { id: req.body.selectedCategories }
      });
      
      if (existingCategories.length !== req.body.selectedCategories.length) {
        console.log('Some categories not found:', req.body.selectedCategories);
        console.log('Existing categories:', existingCategories.map(c => c.id));
      }
      
      if (existingCategories.length > 0) {
        await tour.setCategories(existingCategories.map(c => c.id));
      }
    }

    const {
      hotel_ids = [],
      category_ids = [],
      included_service_ids = [],
      ...tourData
    } = req.body;

    //Gán các quan hệ Nhiều-Nhiều
    if (hotel_ids.length > 0) await tour.setHotels(hotel_ids);
    if (category_ids.length > 0) await tour.setCategories(category_ids);
    if (included_service_ids.length > 0) await tour.setIncludedServices(included_service_ids);

    res.status(201).json(tour);
  } catch (err) {
    console.error("Lỗi khi tạo tour:", err);
    res.status(400).json({ message: "Dữ liệu không hợp lệ", error: err.message });
  }
};


// Cập nhật tour
const update = async (req, res) => {
  try {

    console.log("Dữ liệu nhận được khi update tour:", req.body); // Log dữ liệu gửi lên

    const {
      hotel_ids = [],
      category_ids = [],
      included_service_ids = [],
      ...tourData
    } = req.body;

    const tour = await Tour.findByPk(req.params.id);
    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }
    await tour.update(req.body);

    // Cập nhật images
    if (req.body.images) {
      await TourImage.destroy({ where: { tour_id: tour.id } });
      for (const img of req.body.images) {
        await TourImage.create({ ...img, tour_id: tour.id });
      }
    }

    // Cập nhật ngày khởi hành
    if (req.body.departureDates) {
      await DepartureDate.destroy({ where: { tour_id: tour.id } });
      for (const date of req.body.departureDates) {
        await DepartureDate.create({ ...date, tour_id: tour.id });
      }
    }

    // Cập nhật dịch vụ bao gồm
    if (req.body.selectedIncludedServices && req.body.selectedIncludedServices.length > 0) {
      // Validate service ID exist first
      const existingServices = await IncludedService.findAll({
        where: { id: req.body.selectedIncludedServices }
      });
      
      if (existingServices.length !== req.body.selectedIncludedServices.length) {
        console.log('Some included services not found:', req.body.selectedIncludedServices);
        console.log('Existing services:', existingServices.map(s => s.id));
      }
      
      if (existingServices.length > 0) {
        await tour.setIncludedServices(existingServices.map(s => s.id));
      }
    }

    // Cập nhật danh mục
    if (req.body.selectedCategories && req.body.selectedCategories.length > 0) {
      // Validate category IDs exist first
      const existingCategories = await TourCategory.findAll({
        where: { id: req.body.selectedCategories }
      });
      
      if (existingCategories.length !== req.body.selectedCategories.length) {
        console.log('Some categories not found:', req.body.selectedCategories);
        console.log('Existing categories:', existingCategories.map(c => c.id));
      }
      
      if (existingCategories.length > 0) {
        await tour.setCategories(existingCategories.map(c => c.id));
      }
    }

    console.log("Tour sau khi update:", tour); // Log kết quả update


    await tour.update(tourData);

    //Cập nhật lại quan hệ Nhiều-Nhiều
    if (hotel_ids.length > 0) await tour.setHotels(hotel_ids);
    else await tour.setHotels([]); // clear nếu bỏ chọn hết

    if (category_ids.length > 0) await tour.setCategories(category_ids);
    else await tour.setCategories([]);

    if (included_service_ids.length > 0) await tour.setIncludedServices(included_service_ids);
    else await tour.setIncludedServices([]);

    res.json(tour);
  } catch (err) {
    console.error("Lỗi khi cập nhật tour:", err);
    res.status(400).json({ message: "Dữ liệu cập nhật không hợp lệ", error: err.message });
  }
};


// Xoá tour
const remove = async (req, res) => {
  try {
    const tour = await Tour.findByPk(req.params.id);
    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }

    await tour.destroy();
    res.json({ message: "Đã xoá tour" });
  } catch (err) {
    console.error("Lỗi khi xoá tour:", err);
    res.status(500).json({ message: "Xoá thất bại" });
  }
};

// Lấy tour + ngày khởi hành (API riêng)
const getTourWithDepartures = async (req, res) => {
  try {
    const tour = await Tour.findByPk(req.params.id, {
      include: [
        {
          model: DepartureDate,
          as: 'departureDates',
          attributes: [
            ['id', 'departureDates_id'],
            'departure_date',
            'end_date',
            'number_of_days',
            'number_of_nights'
          ]
        }
      ]
    });

    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }

    res.json(tour);
  } catch (err) {
    console.error("Lỗi khi lấy tour + departureDates:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy tour + danh mục (categories)
const getTourWithCategories = async (req, res) => {
  try {
    const tour = await Tour.findByPk(req.params.id, {
      include: [
        {
          model: TourCategory,
          as: "categories"
        }
      ]
    });

    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour!" });
    }

    res.json(tour);
  } catch (err) {
    console.error("Lỗi khi lấy tour + categories:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy tour + các dịch vụ bao gồm
const getTourWithIncludedServices = async (req, res) => {
  try {
    const tour = await Tour.findByPk(req.params.id, {
      include: [
        {
          model: IncludedService,
          as: "includedServices"
        }
      ]
    });

    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour!" });
    }

    res.json(tour);
  } catch (err) {
    console.error("Lỗi khi lấy tour + included services:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Gán dịch vụ cho tour
const assignIncludedServiceToTour = async (req, res) => {
  const { tourId, serviceId } = req.params;
  try {
    const tour = await Tour.findByPk(tourId);
    const service = await IncludedService.findByPk(serviceId);

    if (!tour || !service) {
      return res.status(404).json({ message: "Không tìm thấy tour hoặc dịch vụ" });
    }

    await tour.addIncludedService(service);
    res.json({ message: "Đã gắn dịch vụ vào tour thành công" });
  } catch (err) {
    console.error("Lỗi khi gắn dịch vụ vào tour:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy tour + khách sạn
const getTourWithHotels = async (req, res) => {
  try {
    const tour = await Tour.findByPk(req.params.id, {
      include: [
        {
          model: Hotel,
          as: "hotels",
          attributes: ['id_hotel', 'ten_khach_san', 'ten_phong', 'star_rating']
        }
      ]
    });

    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour!" });
    }

    res.json(tour);
  } catch (err) {
    console.error("Lỗi khi lấy tour + hotels:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy tour + dịch vụ loại trừ
const getTourWithExcludedServices = async (req, res) => {
  try {
    const tour = await Tour.findByPk(req.params.id, {
      include: [
        {
          model: ExcludedService,
          as: "excludedServices",
          attributes: ['id', 'service_name']
        }
      ]
    });

    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour!" });
    }

    res.json(tour);
  } catch (err) {
    console.error("Lỗi khi lấy tour + excluded services:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy tour + hành trình
const getTourWithItineraries = async (req, res) => {
  try {
    const tour = await Tour.findByPk(req.params.id, {
      include: [
        {
          model: Itinerary,
          as: "itineraries",
          attributes: ['id', 'day_number', 'title', 'description', 'tour_id']
        }
      ]
    });

    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour!" });
    }

    res.json(tour);
  } catch (err) {
    console.error("Lỗi khi lấy tour + itineraries:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy tour với tất cả thông tin liên quan (comprehensive)
const getTourComplete = async (req, res) => {
  try {
    const tour = await Tour.findByPk(req.params.id, {
      include: [
        {
          model: DepartureDate,
          as: 'departureDates',
          attributes: [
            ['id', 'departureDates_id'],
            'departure_date',
            'end_date',
            'number_of_days',
            'number_of_nights'
          ]
        },
        {
          model: TourImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_main']
        },
        {
          model: Promotion,
          as: 'promotion',
          attributes: ['id', 'code', 'description', 'discount_amount'],
          required: false
        },
        {
          model: IncludedService,
          as: "includedServices",
          attributes: ['id', 'name']
        },
        {
          model: ExcludedService,
          as: "excludedServices",
          attributes: ['id', 'service_name']
        },
        {
          model: TourCategory,
          as: "categories",
          attributes: ['id', 'name']
        },
        {
          model: Hotel,
          as: "hotels",
          attributes: ['id_hotel', 'ten_khach_san', 'ten_phong', 'star_rating']
        },
        {
          model: Itinerary,
          as: "itineraries",
          attributes: ['id', 'day_number', 'title', 'description'],
          include: [
            {
              model: Location,
              as: "locations",
              attributes: ['id', 'name'],
              through: { attributes: [] } // Ẩn bảng trung gian
            }
          ]
        }
      ],
      order: [
        [{ model: Itinerary, as: "itineraries" }, 'day_number', 'ASC']
      ]
    });

    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour!" });
    }

    res.json(tour);
  } catch (err) {
    console.error("Lỗi khi lấy tour complete:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Gán khách sạn cho tour
const assignHotelToTour = async (req, res) => {
  const { tourId, hotelId } = req.params;
  try {
    const tour = await Tour.findByPk(tourId);
    const hotel = await Hotel.findByPk(hotelId);

    if (!tour || !hotel) {
      return res.status(404).json({ message: "Không tìm thấy tour hoặc khách sạn" });
    }

    await tour.addHotel(hotel);
    res.json({ message: "Đã gắn khách sạn vào tour thành công" });
  } catch (err) {
    console.error("Lỗi khi gắn khách sạn vào tour:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Gán dịch vụ loại trừ cho tour
const assignExcludedServiceToTour = async (req, res) => {
  const { tourId, serviceId } = req.params;
  try {
    const tour = await Tour.findByPk(tourId);
    const service = await ExcludedService.findByPk(serviceId);

    if (!tour || !service) {
      return res.status(404).json({ message: "Không tìm thấy tour hoặc dịch vụ loại trừ" });
    }

    await tour.addExcludedService(service);
    res.json({ message: "Đã gắn dịch vụ loại trừ vào tour thành công" });
  } catch (err) {
    console.error("Lỗi khi gắn dịch vụ loại trừ vào tour:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy tours theo location (qua destinations hoặc itinerary)
const getToursByLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { Op } = require("sequelize");
    const { sequelize } = require("../config/db");
    
    // Lấy thông tin location
    const { Location } = require("../models");
    const location = await Location.findByPk(locationId);
    
    if (!location) {
      return res.status(404).json({ message: "Không tìm thấy location" });
    }
    
    console.log(`Searching tours for location: ${location.name}`);
    
    // Tìm tours có location hoặc destination trùng với location name
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
        // Removed status filter to see all tours
      },
      include: [
        {
          model: DepartureDate,
          as: 'departureDates',
          attributes: [
            ['id', 'departureDates_id'],
            'departure_date',
            'end_date',
            'number_of_days',
            'number_of_nights'
          ]
        },
        {
          model: TourImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_main']
        },
        {
          model: Promotion,
          as: 'promotion',
          attributes: ['id', 'code', 'description', 'discount_amount'],
          required: false
        }
      ]
    });
    
    console.log(`Found ${tours.length} tours for location ${location.name}`);
    res.json(tours);
    
  } catch (err) {
    console.error("Lỗi khi lấy tours theo location:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Lấy tours theo destination
const getToursByDestination = async (req, res) => {
  try {
    const { destinationId } = req.params;
    const { Op } = require("sequelize");
    const { sequelize } = require("../config/db");
    const { Destination } = require("../models");
    
    // Tìm destination để lấy tên
    const destination = await Destination.findByPk(destinationId);
    if (!destination) {
      return res.status(404).json({ message: "Không tìm thấy destination" });
    }
    
    console.log(`Searching tours for destination: ${destination.name}`);
    
    // Tìm tours có location hoặc destination trùng với destination name
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
          model: DepartureDate,
          as: 'departureDates',
          attributes: [
            ['id', 'departureDates_id'],
            'departure_date',
            'end_date',
            'number_of_days',
            'number_of_nights'
          ]
        },
        {
          model: TourImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_main']
        },
        {
          model: Promotion,
          as: 'promotion',
          attributes: ['id', 'code', 'description', 'discount_amount'],
          required: false
        }
      ]
    });
    
    console.log(`Found ${tours.length} tours for destination ${destination.name}`);
    res.json(tours);
  } catch (err) {
    console.error("Lỗi khi lấy tours theo destination:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Alias cho getTourComplete (tên khác)
const getCompleteTour = getTourComplete;

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
  getTourWithDepartures,
  getTourWithCategories,
  getTourWithIncludedServices,
  assignIncludedServiceToTour,
  getTourWithHotels,
  getTourWithExcludedServices,
  getTourWithItineraries,
  getTourComplete,
  assignHotelToTour,
  assignExcludedServiceToTour,
  getToursByLocation,
  getToursByDestination,
  getCompleteTour
};
