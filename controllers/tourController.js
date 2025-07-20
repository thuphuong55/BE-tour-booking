const { Tour, DepartureDate, TourImage, IncludedService, TourCategory, Hotel, ExcludedService, Itinerary, Location, Promotion, Agency, Destination, User } = require("../models");
const { paginatedResponse, errorResponse } = require("../utils/responseOptimizer");

// 🚀 OPTIMIZATION: Predefined field selections
const TOUR_LIST_FIELDS = [
  'id', 'name', 'location', 'destination', 'price', 
  'tour_type', 'status', 'created_at'
];

const TOUR_LIST_INCLUDES = [
  {
    model: DepartureDate,
    as: 'departureDates',
    attributes: ['id', 'departure_date', 'number_of_days'],
    limit: 3, // Chỉ lấy 3 departure dates gần nhất
    order: [['departure_date', 'ASC']]
  },
  {
    model: TourImage,
    as: 'images',
    attributes: ['id', 'image_url', 'is_main'],
    limit: 1, // Chỉ lấy main image cho list view
    where: { is_main: true },
    required: false
  },
  {
    model: Agency,
    as: 'agency',
    attributes: ['id', 'name'],
    include: [{
      model: User,
      as: 'user',
      attributes: ['email'] // Chỉ lấy email
    }]
  }
];

// Lấy tất cả tour kèm các ngày khởi hành và ảnh (với phân trang - OPTIMIZED)
const getAll = async (req, res) => {
  try {
    // Extract pagination parameters với limits hợp lý
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 items
    const offset = (page - 1) * limit;
    
    // Extract filter parameters
    const status = req.query.status;
    const search = req.query.search;
    
    // 🚀 OPTIMIZATION: Build optimized where clause
    let where = {};
    
    // Phân quyền: admin xem tất cả, agency chỉ xem tour của mình
    if (req.user && req.user.role === 'agency') {
      const agency = await Agency.findOne({
        where: { user_id: req.user.id },
        attributes: ['id'] // Chỉ lấy id
      });
      
      if (agency) {
        where.agency_id = agency.id;
      } else {
        return res.json(paginatedResponse([], {
          page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false
        }));
      }
    }
    
    // Nếu có query agency_id thì filter đúng agency_id
    if (req.query.agency_id) {
      where.agency_id = req.query.agency_id;
    }
    
    // Filter by status if provided
    if (status) {
      where.status = status;
    }
    
    // 🚀 OPTIMIZATION: Optimized search query
    if (search) {
      const { Op } = require("sequelize");
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { destination: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // 🚀 OPTIMIZATION: Optimized query with specific fields
    const { count, rows: tours } = await Tour.findAndCountAll({
      attributes: TOUR_LIST_FIELDS, // Chỉ select fields cần thiết
      where,
      include: TOUR_LIST_INCLUDES,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      
      // 🚀 OPTIMIZATION: Sequelize performance options
      subQuery: false, // Faster joins
      distinct: true   // Avoid duplicates
    });

    const totalPages = Math.ceil(count / limit);

    // 🚀 OPTIMIZATION: Use optimized response format
    const response = paginatedResponse(tours, {
      page,
      limit,
      total: count,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }, 'tour_list');

    res.json(response);
    
  } catch (err) {
    console.error("❌ Error getting tours:", err);
    res.status(500).json(errorResponse('Lỗi server khi lấy danh sách tour', 500, err.message));
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
    console.log("=== TOUR CREATE DEBUG ===");
    console.log("📝 Raw request body:", JSON.stringify(req.body, null, 2));

    // Destructure để tách core tour data vs relations
    const {
      hotel_ids = [],
      category_ids = [],
      included_service_ids = [],
      selectedIncludedServices = [],
      selectedCategories = [],
      images = [],
      departureDates = [],
      service = [], // Thêm service từ request
      ...tourData
    } = req.body;

    console.log("🔍 Destructured relations:");
    console.log("- hotel_ids:", hotel_ids, "Type:", typeof hotel_ids, "IsArray:", Array.isArray(hotel_ids));
    console.log("- service:", service, "Type:", typeof service, "IsArray:", Array.isArray(service));
    console.log("- category_ids:", category_ids);
    console.log("- selectedCategories:", selectedCategories);

    // Thêm agency_id từ user đăng nhập nếu chưa có
    if (!tourData.agency_id && req.user) {
      const userAgency = await Agency.findOne({ where: { user_id: req.user.id } });
      if (userAgency) {
        tourData.agency_id = userAgency.id;
      }
    }

    console.log("🎯 Core tour data sẽ lưu:", tourData);

    // Tạo tour với core data (bao gồm location, destination)
    const tour = await Tour.create(tourData);
    console.log("✅ Tour đã tạo với ID:", tour.id);

    // Thêm images
    if (images && images.length > 0) {
      console.log("📷 Thêm", images.length, "images");
      for (const img of images) {
        await TourImage.create({ ...img, tour_id: tour.id });
      }
    }

    // Thêm ngày khởi hành
    if (departureDates && departureDates.length > 0) {
      console.log("📅 Thêm", departureDates.length, "departure dates");
      for (const date of departureDates) {
        await DepartureDate.create({ ...date, tour_id: tour.id });
      }
    }

    // Xử lý included services (cả selectedIncludedServices và included_service_ids)
    const servicesToAdd = [...selectedIncludedServices, ...included_service_ids].filter(Boolean);
    if (servicesToAdd.length > 0) {
      console.log("🔧 Thêm included services:", servicesToAdd);
      const existingServices = await IncludedService.findAll({
        where: { id: servicesToAdd }
      });
      
      if (existingServices.length !== servicesToAdd.length) {
        console.log('⚠️ Some included services not found:', servicesToAdd);
        console.log('✅ Existing services:', existingServices.map(s => s.id));
      }
      
      if (existingServices.length > 0) {
        await tour.setIncludedServices(existingServices.map(s => s.id));
      }
    }

    // Xử lý categories (cả selectedCategories và category_ids)
    const categoriesToAdd = [...selectedCategories, ...category_ids].filter(Boolean);
    if (categoriesToAdd.length > 0) {
      console.log("📂 Thêm categories:", categoriesToAdd);
      const existingCategories = await TourCategory.findAll({
        where: { id: categoriesToAdd }
      });
      
      if (existingCategories.length !== categoriesToAdd.length) {
        console.log('⚠️ Some categories not found:', categoriesToAdd);
        console.log('✅ Existing categories:', existingCategories.map(c => c.id));
      }
      
      if (existingCategories.length > 0) {
        await tour.setCategories(existingCategories.map(c => c.id));
      }
    }

    // Xử lý hotels
    if (hotel_ids.length > 0) {
      console.log("🏨 Processing hotels:", hotel_ids);
      console.log("🏨 Hotel IDs type:", typeof hotel_ids[0]);
      
      // Kiểm tra hotels có tồn tại không
      const existingHotels = await Hotel.findAll({
        where: { id_hotel: hotel_ids }
      });
      console.log("🏨 Found existing hotels:", existingHotels.map(h => ({ id: h.id_hotel, name: h.ten_khach_san })));
      
      if (existingHotels.length > 0) {
        const hotelIds = existingHotels.map(h => h.id_hotel);
        console.log("🏨 Setting hotels with IDs:", hotelIds);
        await tour.setHotels(hotelIds);
        console.log("🏨 Hotels set successfully");
      } else {
        console.log("🏨 No valid hotels found to set");
      }
    } else {
      console.log("🏨 No hotel_ids provided");
    }

    // Reload tour với relations để return đầy đủ
    const fullTour = await Tour.findByPk(tour.id, {
      include: [
        { model: TourImage, as: 'images' },
        { model: DepartureDate, as: 'departureDates' },
        { model: TourCategory, as: 'categories' },
        { model: IncludedService, as: 'includedServices' },
        { model: Hotel, as: 'hotels' }
      ]
    });

    console.log("🎉 Tour tạo thành công:", {
      id: tour.id,
      name: tour.name,
      location: tour.location,
      destination: tour.destination,
      status: tour.status
    });

    res.status(201).json(fullTour);
  } catch (err) {
    console.error("❌ Lỗi khi tạo tour:", err);
    res.status(400).json({ message: "Dữ liệu không hợp lệ", error: err.message });
  }
};


// Cập nhật tour
const update = async (req, res) => {
  try {
    console.log("📝 Dữ liệu nhận được khi update tour:", req.body);

    const {
      hotel_ids = [],
      category_ids = [],
      included_service_ids = [],
      selectedIncludedServices = [],
      selectedCategories = [],
      images,
      departureDates,
      ...tourData
    } = req.body;

    const tour = await Tour.findByPk(req.params.id);
    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }

    console.log("🎯 Core tour data sẽ update:", tourData);
    console.log("📍 Location/Destination trong data:", {
      location: tourData.location,
      destination: tourData.destination
    });

    // Update core tour data (bao gồm location, destination)
    await tour.update(tourData);
    console.log("✅ Core tour data đã update");

    // Cập nhật images nếu có
    if (images) {
      console.log("📷 Cập nhật images");
      await TourImage.destroy({ where: { tour_id: tour.id } });
      for (const img of images) {
        await TourImage.create({ ...img, tour_id: tour.id });
      }
    }

    // Cập nhật ngày khởi hành nếu có
    if (departureDates) {
      console.log("📅 Cập nhật departure dates");
      await DepartureDate.destroy({ where: { tour_id: tour.id } });
      for (const date of departureDates) {
        await DepartureDate.create({ ...date, tour_id: tour.id });
      }
    }

    // Xử lý included services (cả selectedIncludedServices và included_service_ids)
    const servicesToUpdate = [...selectedIncludedServices, ...included_service_ids].filter(Boolean);
    if (servicesToUpdate.length > 0) {
      console.log("🔧 Cập nhật included services:", servicesToUpdate);
      const existingServices = await IncludedService.findAll({
        where: { id: servicesToUpdate }
      });
      
      if (existingServices.length !== servicesToUpdate.length) {
        console.log('⚠️ Some included services not found:', servicesToUpdate);
        console.log('✅ Existing services:', existingServices.map(s => s.id));
      }
      
      await tour.setIncludedServices(existingServices.map(s => s.id));
    } else if (servicesToUpdate.length === 0 && (selectedIncludedServices.length === 0 || included_service_ids.length === 0)) {
      // Clear nếu gửi mảng rỗng
      await tour.setIncludedServices([]);
    }

    // Xử lý categories (cả selectedCategories và category_ids)
    const categoriesToUpdate = [...selectedCategories, ...category_ids].filter(Boolean);
    if (categoriesToUpdate.length > 0) {
      console.log("📂 Cập nhật categories:", categoriesToUpdate);
      const existingCategories = await TourCategory.findAll({
        where: { id: categoriesToUpdate }
      });
      
      if (existingCategories.length !== categoriesToUpdate.length) {
        console.log('⚠️ Some categories not found:', categoriesToUpdate);
        console.log('✅ Existing categories:', existingCategories.map(c => c.id));
      }
      
      await tour.setCategories(existingCategories.map(c => c.id));
    } else if (categoriesToUpdate.length === 0 && (selectedCategories.length === 0 || category_ids.length === 0)) {
      // Clear nếu gửi mảng rỗng
      await tour.setCategories([]);
    }

    // Xử lý hotels
    if (hotel_ids.length > 0) {
      console.log("🏨 Cập nhật hotels:", hotel_ids);
      await tour.setHotels(hotel_ids);
    } else if (hotel_ids.length === 0) {
      // Clear nếu gửi mảng rỗng
      await tour.setHotels([]);
    }

    // Reload tour để lấy data mới nhất
    await tour.reload();
    
    console.log("🎉 Tour update thành công:", {
      id: tour.id,
      name: tour.name,
      location: tour.location,
      destination: tour.destination,
      status: tour.status
    });

    res.json(tour);
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật tour:", err);
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

// Cập nhật trạng thái tour (dành cho admin/agency)
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    // Validate status
    const validStatuses = ['Chờ duyệt', 'Đang hoạt động', 'Ngừng hoạt động', 'Đã hủy'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: "Trạng thái không hợp lệ", 
        validStatuses 
      });
    }

    const tour = await Tour.findByPk(id, {
      include: [{ model: Agency, as: 'agency', include: [{ model: User, as: 'user' }] }]
    });
    
    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }

    // Check permissions
    if (req.user.role === 'agency') {
      // Agency chỉ có thể sửa tours của mình
      const userAgency = await Agency.findOne({ where: { user_id: req.user.id } });
      if (!userAgency || tour.agency_id !== userAgency.id) {
        return res.status(403).json({ message: "Không có quyền sửa tour này" });
      }
      
      // Agency có giới hạn về status change
      const allowedChanges = {
        'Chờ duyệt': ['Ngừng hoạt động'],
        'Đang hoạt động': ['Ngừng hoạt động'],
        'Ngừng hoạt động': ['Chờ duyệt']
      };
      
      if (!allowedChanges[tour.status]?.includes(status)) {
        return res.status(400).json({ 
          message: `Agency không thể chuyển từ '${tour.status}' sang '${status}'`,
          allowedStatuses: allowedChanges[tour.status] || []
        });
      }
    }
    // Admin có thể thay đổi bất kỳ status nào (đã check role ở middleware)

    const oldStatus = tour.status;
    await tour.update({ status });

    // Gửi notification nếu cần
    if (req.user.role === 'admin' && tour.agency?.user?.email) {
      const { sendEmail } = require("../config/mailer");
      let emailSubject = "";
      let emailContent = "";
      
      switch(status) {
        case 'Đang hoạt động':
          emailSubject = "Tour đã được duyệt";
          emailContent = `<p>Tour <strong>${tour.name}</strong> đã được admin phê duyệt và đang hoạt động.</p>`;
          break;
        case 'Đã hủy':
          emailSubject = "Tour bị từ chối";
          emailContent = `<p>Tour <strong>${tour.name}</strong> đã bị từ chối.</p>
                         ${reason ? `<p><strong>Lý do:</strong> ${reason}</p>` : ''}`;
          break;
        case 'Ngừng hoạt động':
          emailSubject = "Tour bị tạm ngừng";
          emailContent = `<p>Tour <strong>${tour.name}</strong> đã bị tạm ngừng hoạt động.</p>
                         ${reason ? `<p><strong>Lý do:</strong> ${reason}</p>` : ''}`;
          break;
      }
      
      if (emailSubject) {
        try {
          await sendEmail(tour.agency.user.email, emailSubject, emailContent);
        } catch (emailError) {
          console.error("Lỗi gửi email notification:", emailError);
        }
      }
    }

    console.log(`✅ Tour ${id} status: ${oldStatus} → ${status} by ${req.user.role}`);
    
    res.json({
      message: `Đã cập nhật trạng thái tour từ '${oldStatus}' sang '${status}'`,
      tour: {
        id: tour.id,
        name: tour.name,
        oldStatus,
        newStatus: status,
        reason: reason || null
      }
    });
    
  } catch (err) {
    console.error("Lỗi khi cập nhật trạng thái tour:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
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

// Test function để debug location/destination
const debugTourData = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tour = await Tour.findByPk(id, {
      attributes: ['id', 'name', 'location', 'destination', 'departure_location', 'status', 'created_at'],
      raw: true
    });
    
    if (!tour) {
      return res.status(404).json({ message: "Tour không tồn tại" });
    }
    
    res.json({
      message: "Debug tour data",
      tour,
      checks: {
        hasLocation: !!tour.location,
        hasDestination: !!tour.destination,
        locationLength: tour.location ? tour.location.length : 0,
        destinationLength: tour.destination ? tour.destination.length : 0
      }
    });
  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Debug function for hotels and included services
const debugTourRelations = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get tour with all relations
    const tour = await Tour.findByPk(id, {
      include: [
        {
          model: Hotel,
          as: 'hotels',
          attributes: ['id_hotel', 'ten_khach_san', 'ten_phong'],
          through: { attributes: [] } // Loại bỏ junction table data
        },
        {
          model: IncludedService,
          as: 'includedServices',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        },
        {
          model: TourCategory,
          as: 'categories',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ]
    });
    
    if (!tour) {
      return res.status(404).json({ message: "Tour không tồn tại" });
    }
    
    // Raw query để check junction tables
    const { sequelize } = require('../models');
    
    const hotelJunction = await sequelize.query(
      'SELECT * FROM tour_hotel WHERE tour_id = ?',
      { replacements: [id], type: sequelize.QueryTypes.SELECT }
    );
    
    const serviceJunction = await sequelize.query(
      'SELECT * FROM tour_included_service WHERE tour_id = ?',
      { replacements: [id], type: sequelize.QueryTypes.SELECT }
    );
    
    const categoryJunction = await sequelize.query(
      'SELECT * FROM tour_tour_category WHERE tour_id = ?',
      { replacements: [id], type: sequelize.QueryTypes.SELECT }
    );
    
    res.json({
      message: "Debug tour relations",
      tour: {
        id: tour.id,
        name: tour.name,
        hotels: tour.hotels,
        includedServices: tour.includedServices,
        categories: tour.categories
      },
      junctionTables: {
        hotels: hotelJunction,
        includedServices: serviceJunction,
        categories: categoryJunction
      },
      counts: {
        hotels: tour.hotels ? tour.hotels.length : 0,
        includedServices: tour.includedServices ? tour.includedServices.length : 0,
        categories: tour.categories ? tour.categories.length : 0
      }
    });
    
  } catch (err) {
    console.error("Debug relations error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  updateStatus,
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
  getCompleteTour,
  debugTourData,
  debugTourRelations
};
