// Agency submits a draft tour for approval
const submitForApproval = async (req, res) => {
  try {
    const tourId = req.params.id;
    const userId = req.user.id;
    // Find agency for user
    const agency = await Agency.findOne({ where: { user_id: userId } });
    if (!agency) {
      return res.status(403).json({ message: "Không tìm thấy thông tin agency cho user này" });
    }
    // Find tour, must belong to agency and be draft
    const tour = await Tour.findOne({ where: { id: tourId, agency_id: agency.id, status: 'draft' } });
    if (!tour) {
      return res.status(404).json({ message: "Tour không tồn tại, không thuộc agency, hoặc không ở trạng thái draft" });
    }
    // Validate required info
    const itineraries = await tour.getItineraries();
    const departureDates = await tour.getDepartureDates();
    const locations = await tour.getLocations();
    if (!tour.name || !tour.destination || !tour.price || !itineraries.length || !departureDates.length || !locations.length) {
      return res.status(400).json({
        message: "Tour chưa đủ thông tin để gửi duyệt. Yêu cầu: tên, điểm đến, giá, hành trình, ngày khởi hành, địa điểm.",
        missing: {
          name: !tour.name,
          destination: !tour.destination,
          price: !tour.price,
          itineraries: !itineraries.length,
          departureDates: !departureDates.length,
          locations: !locations.length
        }
      });
    }
    // Update status to 'Chờ duyệt'
    tour.status = 'Chờ duyệt';
    await tour.save();
    res.json({ message: "Tour đã gửi duyệt thành công", tour });
  } catch (err) {
    console.error("Lỗi khi gửi duyệt tour:", err);
    res.status(500).json({ message: "Lỗi server khi gửi duyệt tour", error: err.message });
  }
};
// Endpoint cập nhật lại bảng booking_summary từ bảng booking (status=confirmed)
const updateBookingSummary = async (req, res) => {
  try {
    const { sequelize } = require('../models');
    const sql = `
      INSERT INTO booking_summary (tour_id, departure_date_id, total_booked, last_updated)
      SELECT 
          tour_id, 
          departure_date_id, 
          SUM(COALESCE(number_of_adults, 0) + COALESCE(number_of_children, 0)) AS total_booked,
          NOW() AS last_updated
      FROM booking
      WHERE status = 'confirmed'
      GROUP BY tour_id, departure_date_id
      ON DUPLICATE KEY UPDATE 
          total_booked = VALUES(total_booked),
          last_updated = VALUES(last_updated);
    `;
    await sequelize.query(sql);
    res.json({ message: 'Đã cập nhật lại bảng booking_summary thành công!' });
  } catch (err) {
    console.error('Lỗi khi cập nhật booking_summary:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật booking_summary', error: err.message });
  }
};
const { Tour, DepartureDate, TourImage, IncludedService, TourCategory, Hotel, ExcludedService, Itinerary, Location, Promotion, Agency, Destination, User } = require("../models");
const { paginatedResponse, errorResponse } = require("../utils/responseOptimizer");
const { smartTransformForUpdate } = require("../utils/tourDataTransformer");

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
  },
  {
    model: Location,
    as: 'locations',
    attributes: ['id', 'name'],
    through: { attributes: [] } // Ẩn junction table data
  }
];

// Lấy tất cả tour kèm các ngày khởi hành và ảnh (với phân trang - OPTIMIZED)
const getAll = async (req, res) => {
  try {
    // Extract pagination parameters với limits hợp lý
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // Không giới hạn cứng 50
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
const { Op } = require("sequelize");
const { Booking } = require("../models");

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
        },
        {
          model: Agency,
          as: 'agency',
          attributes: ['id', 'name'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['email']
            }
          ]
        },
        {
          model: Location,
          as: 'locations',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ]
    });

    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }

    // Tính số chỗ còn trống cho từng ngày khởi hành
    const departureDatesWithSlots = await Promise.all(
      tour.departureDates.map(async (date) => {
        // Debug log to check date object
        console.log("🔍 Processing departure date:", {
          id: date.id,
          departureDates_id: date.departureDates_id,
          departure_date: date.departure_date
        });

        const departureId = date.id || date.departureDates_id;
        if (!departureId) {
          console.log("⚠️ No valid departure ID found, skipping booking calculation");
          return {
            ...date.toJSON(),
            available_slots: tour.max_participants || 0,
            booked: 0
          };
        }

        // Đếm tổng số người đã đặt cho ngày này (chỉ booking đã xác nhận)
        const bookings = await Booking.findAll({
          where: {
            tour_id: tour.id,
            departure_date_id: departureId,
            status: 'confirmed'
          },
          attributes: ['adult_count', 'child_count', 'infant_count']
        });
        const booked = bookings.reduce((sum, b) => sum + (b.adult_count || 0) + (b.child_count || 0) + (b.infant_count || 0), 0);
        const available_slots = (tour.max_participants || 0) - booked;
        return {
          ...date.toJSON(),
          id: departureId, // Ensure consistent id field
          available_slots: available_slots < 0 ? 0 : available_slots,
          booked
        };
      })
    );
    const tourJson = tour.toJSON();
    tourJson.departureDates = departureDatesWithSlots;
    res.json(tourJson);
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
    let {
      hotel_ids = [],
      category_ids = [],
      included_service_ids = [],
      excluded_service_ids = [],        // Added excluded services
      selectedIncludedServices = [],
      selectedCategories = [],
      excludedServices = [],            // Alternative field name
      selectedExcludedServices = [],    // Thêm dòng này để destructure đúng
      images = [],
      departureDates = [],
      service = [], // Thêm service từ request
      destination_id, // ID của destination để auto-populate name
      location_id,    // ID của location để auto-populate name (legacy single location)
      location_ids = [], // Multiple location IDs (new feature)
      locations = [], // Nhận từ FE nếu gửi locations là mảng id
      departure_date,
      number_of_days,
      ...tourData
    } = req.body;

    // Nếu FE gửi locations là mảng id, tự động merge vào location_ids
    if (Array.isArray(locations) && locations.length > 0) {
      location_ids = [...location_ids, ...locations];
      // Loại bỏ trùng lặp
      location_ids = [...new Set(location_ids)];
      console.log('[AUTO] Merged locations array from FE vào location_ids:', location_ids);
    }

    // Nếu FE gửi location là string (tên), tự động tìm Location theo tên và gán vào location_ids
    if (typeof tourData.location === 'string' && tourData.location.trim()) {
      const foundLocations = await Location.findAll({ where: { name: tourData.location.trim() } });
      if (foundLocations && foundLocations.length > 0) {
        location_ids = [...location_ids, ...foundLocations.map(l => l.id)];
        location_ids = [...new Set(location_ids)];
        console.log('[AUTO] Found location by name and merged to location_ids:', location_ids);
      } else {
        console.log('[WARN] Không tìm thấy Location với tên:', tourData.location);
      }
    }

    // Nếu FE gửi departure_date là mảng ngày, tự động chuyển thành departureDates mảng object
    if (Array.isArray(departure_date) && departure_date.length > 0 && (!departureDates || departureDates.length === 0)) {
      // Nếu có number_of_days thì dùng, không thì default 1
      const days = typeof number_of_days === 'number' ? number_of_days : 1;
      departureDates = departure_date.map(date => ({ departure_date: date, number_of_days: days }));
      console.log('[AUTO] Converted departure_date array to departureDates:', departureDates);
    }

    console.log("🔍 Destructured relations:");
    console.log("- hotel_ids:", hotel_ids, "Type:", typeof hotel_ids, "IsArray:", Array.isArray(hotel_ids));
    console.log("- service:", service, "Type:", typeof service, "IsArray:", Array.isArray(service));
    console.log("- category_ids:", category_ids);
    console.log("- selectedCategories:", selectedCategories);
    console.log("- included_service_ids:", included_service_ids);
    console.log("- excluded_service_ids:", excluded_service_ids);
    console.log("- excludedServices:", excludedServices);
    console.log("- destination_id:", destination_id);
    console.log("- location_id:", location_id);
    console.log("- location_ids:", location_ids, "Type:", typeof location_ids, "IsArray:", Array.isArray(location_ids));
    console.log("- departureDates:", departureDates?.length || 0, "dates");

    // 🌍 AUTO-POPULATE destination và location names từ IDs
    if (destination_id) {
      console.log("🎯 Auto-populating destination name from ID:", destination_id);
      const destination = await Destination.findByPk(destination_id);
      if (destination) {
        tourData.destination = destination.name;
        console.log("✅ Destination name set to:", destination.name);
      } else {
        return res.status(400).json({
          message: "Destination ID không tồn tại",
          destination_id: destination_id
        });
      }
    }

    if (location_id) {
      console.log("📍 Auto-populating location name from ID:", location_id);
      const location = await Location.findByPk(location_id);
      if (location) {
        tourData.location = location.name;
        console.log("✅ Location name set to:", location.name);
      } else {
        return res.status(400).json({
          message: "Location ID không tồn tại",
          location_id: location_id
        });
      }
    }

    // 🎯 LOGIC PHÂN QUYỀN: Admin vs Agency
    console.log("👤 User role:", req.user?.role);
    console.log("🏢 Agency_id from request:", tourData.agency_id);

    if (req.user?.role === 'admin') {
      // Admin: PHẢI cung cấp agency_id trong request
      if (!tourData.agency_id) {
        return res.status(400).json({
          message: "Admin phải chỉ định agency_id khi tạo tour",
          required_field: "agency_id"
        });
      }
      console.log("✅ Admin tạo tour cho agency:", tourData.agency_id);

    } else if (req.user?.role === 'agency') {
      // Agency: Tự động gán agency_id từ user đăng nhập, IGNORE agency_id từ request
      const userAgency = await Agency.findOne({ where: { user_id: req.user.id } });
      if (!userAgency) {
        return res.status(403).json({
          message: "Không tìm thấy thông tin agency cho user này"
        });
      }
      tourData.agency_id = userAgency.id; // Force gán agency_id của chính họ
      console.log("✅ Agency tự tạo tour cho chính mình:", tourData.agency_id);
    }

    // 🚀 AUTO-APPROVAL LOGIC: Admin vs Agency
    if (req.user?.role === 'admin') {
      // Admin: Tour được duyệt ngay, hoạt động luôn
      if (!tourData.status) {
        tourData.status = 'Đang hoạt động'; // Auto-approved and active
      }
      console.log("🔰 Admin tạo tour - AUTO APPROVED & ACTIVE");

    } else if (req.user?.role === 'agency') {
      // Agency: Tour bắt đầu ở trạng thái draft
      tourData.status = 'draft'; // Initial draft status
      console.log("⏳ Agency tạo tour - DRAFT");
    }

    console.log("🎯 Core tour data sẽ lưu:", tourData);
    console.log("📊 Status:", tourData.status);

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

    // 🚫 Xử lý excluded services (cả excludedServices và excluded_service_ids)
    const excludedServicesToAdd = [
      ...excludedServices,
      ...excluded_service_ids,
      ...selectedExcludedServices // Thêm dòng này
    ].filter(Boolean);
    if (excludedServicesToAdd.length > 0) {
      console.log("🚫 Thêm excluded services:", excludedServicesToAdd);
      const existingExcludedServices = await ExcludedService.findAll({
        where: { id: excludedServicesToAdd }
      });

      if (existingExcludedServices.length !== excludedServicesToAdd.length) {
        console.log('⚠️ Some excluded services not found:', excludedServicesToAdd);
        console.log('✅ Existing excluded services:', existingExcludedServices.map(s => s.id));
      }

      if (existingExcludedServices.length > 0) {
        await tour.setExcludedServices(existingExcludedServices.map(s => s.id));
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
        where: { id: hotel_ids }
      });
      console.log("🏨 Found existing hotels:", existingHotels.map(h => ({
        id: h.id,
        id_hotel_field: h.getDataValue('id_hotel'),
        name: h.ten_khach_san
      })));

      if (existingHotels.length > 0) {
        // Sử dụng primary key (id) thay vì field mapped
        const hotelIds = existingHotels.map(h => h.id);
        console.log("🏨 Setting hotels with IDs:", hotelIds);
        await tour.setHotels(hotelIds);
        console.log("🏨 Hotels set successfully");
      } else {
        console.log("🏨 No valid hotels found to set");
      }
    } else {
      console.log("🏨 No hotel_ids provided");
    }

    // Xử lý multiple locations (new feature)
    const locationsToProcess = [];

    // Support cả single location (legacy) và multiple locations (new)
    if (location_id) {
      locationsToProcess.push(location_id);
    }
    if (location_ids && location_ids.length > 0) {
      locationsToProcess.push(...location_ids);
    }

    // Remove duplicates
    const uniqueLocationIds = [...new Set(locationsToProcess)];

    if (uniqueLocationIds.length > 0) {
      console.log("📍 Processing locations:", uniqueLocationIds);
      console.log("📍 Location IDs type:", typeof uniqueLocationIds[0]);

      // Kiểm tra locations có tồn tại không
      const existingLocations = await Location.findAll({
        where: { id: uniqueLocationIds }
      });
      console.log("📍 Found existing locations:", existingLocations.map(l => ({
        id: l.id,
        name: l.name
      })));

      if (existingLocations.length > 0) {
        const locationIds = existingLocations.map(l => l.id);
        console.log("📍 Setting locations with IDs:", locationIds);
        await tour.setLocations(locationIds);
        console.log("📍 Locations set successfully");

        // Auto-populate location field với tên của location đầu tiên (backward compatibility)
        if (!tourData.location && existingLocations[0]) {
          await tour.update({ location: existingLocations[0].name });
          console.log("📍 Auto-populated location field with:", existingLocations[0].name);
        }
      } else {
        console.log("📍 No valid locations found to set");
      }
    } else {
      console.log("📍 No location_ids provided");
    }

    // Reload tour với relations để return đầy đủ
    const updatedTour = await Tour.findByPk(tour.id, {
      include: [
        { model: TourImage, as: 'images' },
        { model: DepartureDate, as: 'departureDates' },
        { model: TourCategory, as: 'categories' },
        { model: IncludedService, as: 'includedServices' },
        { model: Hotel, as: 'hotels' },
        { model: ExcludedService, as: 'excludedServices' },
        { model: Location, as: 'locations' }
      ]
    });
    console.log("🎉 Tour update thành công:", {
      id: updatedTour.id,
      name: updatedTour.name,
      location: updatedTour.location,
      destination: updatedTour.destination,
      status: updatedTour.status
    });
    // Đảm bảo luôn có trường excludedServices (mảng rỗng nếu không có)
    const tourJson = updatedTour.toJSON();
    if (!tourJson.excludedServices) tourJson.excludedServices = [];
    res.json(tourJson);
  } catch (err) {
    console.error("❌ Lỗi khi tạo tour:", err);
    res.status(400).json({ message: "Dữ liệu không hợp lệ", error: err.message });
  }
};


// Cập nhật tour
const update = async (req, res) => {
  console.log("🚀 NEW UPDATE FUNCTION CALLED - Version 2.0:", new Date().toISOString());
  try {
    console.log("🎬 === TOUR UPDATE FUNCTION STARTED ===");
    console.log("📝 Raw data nhận được khi update tour:", JSON.stringify(req.body, null, 2));

    // 🎯 LOGIC PHÂN QUYỀN: Admin vs Agency
    console.log("👤 User role:", req.user?.role);
    console.log("🏢 Tour agency_id:", req.body.agency_id);

    if (req.user?.role === 'admin') {
      console.log("✏️ Admin updating tour", req.params.id, "with data:", {
        id: req.body.id,
        name: req.body.name,
        updatedBy: req.user?.email || req.user?.id || 'unknown'
      });
    } else if (req.user?.role === 'agency') {
      console.log("🏢 Agency updating their own tour", req.params.id);
    }

    // 🔄 SMART TRANSFORM: Handle both request format and response format
    console.log("🔄 Starting smartTransformForUpdate...");
    let transformedData;
    try {
      transformedData = smartTransformForUpdate(req.body);
      console.log("🔄 smartTransformForUpdate completed successfully");
    } catch (transformError) {
      console.error("❌ smartTransformForUpdate failed:", transformError);
      return res.status(500).json({ message: "Transform error", error: transformError.message });
    }

    console.log("🔄 Transformed data for processing:", Object.keys(transformedData));
    console.log("🔄 Raw excluded_service_ids from req.body:", req.body.excluded_service_ids);
    console.log("🔄 Transformed excluded_service_ids:", transformedData.excluded_service_ids);

    console.log("🔍 Starting destructuring of transformedData...");
    const {
      hotel_ids = [],
      category_ids = [],
      included_service_ids = [],
      excluded_service_ids = [],        // Added excluded services
      selectedIncludedServices = [],
      selectedCategories = [],
      excludedServices = [],            // Alternative field name
      selectedExcludedServices = [],    // Thêm dòng này để destructure đúng
      images,
      departureDates,
      destination_id, // ID của destination để auto-populate name
      location_id,    // ID của location để auto-populate name (legacy single location)
      location_ids = [], // Multiple location IDs (new feature)
      ...tourData
    } = transformedData;
    console.log("✅ Destructuring completed successfully");

    console.log("🔍 Destructured relations:");
    console.log("- hotel_ids:", hotel_ids, "Type:", typeof hotel_ids, "IsArray:", Array.isArray(hotel_ids));
    console.log("- category_ids:", category_ids);
    console.log("- included_service_ids:", included_service_ids);
    console.log("- excluded_service_ids:", excluded_service_ids);
    console.log("- excludedServices:", excludedServices);
    console.log("- location_id:", location_id);
    console.log("- location_ids:", location_ids, "Type:", typeof location_ids, "IsArray:", Array.isArray(location_ids));
    console.log("🔍 DIRECT from req.body.excluded_service_ids:", req.body.excluded_service_ids);

    const tour = await Tour.findByPk(req.params.id);
    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }

    // 🌍 AUTO-POPULATE destination và location names từ IDs (cho UPDATE)
    if (destination_id) {
      console.log("🎯 Update: Auto-populating destination name from ID:", destination_id);
      const destination = await Destination.findByPk(destination_id);
      if (destination) {
        tourData.destination = destination.name;
        console.log("✅ Update: Destination name set to:", destination.name);
      } else {
        return res.status(400).json({
          message: "Destination ID không tồn tại",
          destination_id: destination_id
        });
      }
    }

    if (location_id) {
      console.log("📍 Update: Auto-populating location name from ID:", location_id);
      const location = await Location.findByPk(location_id);
      if (location) {
        tourData.location = location.name;
        console.log("✅ Update: Location name set to:", location.name);
      } else {
        return res.status(400).json({
          message: "Location ID không tồn tại",
          location_id: location_id
        });
      }
    }

    console.log("🎯 Core tour data sẽ update:", tourData);
    console.log("📍 Location/Destination trong data:", {
      location: tourData.location,
      destination: tourData.destination
    });

    // Kiểm tra nếu agency cập nhật tour đã có booking xác nhận ở bất kỳ ngày khởi hành nào
    let hasConfirmedBooking = false;
    if (req.user?.role === 'agency') {
      // Lấy tất cả ngày khởi hành của tour
      const departureDates = await DepartureDate.findAll({ where: { tour_id: tour.id } });
      if (departureDates && departureDates.length > 0) {
        // Kiểm tra từng ngày khởi hành có booking xác nhận không
        for (const date of departureDates) {
          const bookingCount = await Booking.count({
            where: {
              tour_id: tour.id,
              departure_date_id: date.id,
              status: 'confirmed'
            }
          });
          if (bookingCount > 0) {
            hasConfirmedBooking = true;
            break;
          }
        }
      }
      if (hasConfirmedBooking) {
        // Chỉ cho phép cập nhật khách sạn
        if (
          (Object.keys(tourData).length > 0 && Object.keys(tourData).some(key => key !== 'hotel_ids')) ||
          images || departureDates || category_ids.length > 0 || included_service_ids.length > 0 || excluded_service_ids.length > 0 || selectedIncludedServices.length > 0 || selectedCategories.length > 0 || excludedServices.length > 0 || selectedExcludedServices.length > 0 || location_id || location_ids.length > 0 || destination_id
        ) {
          return res.status(403).json({
            message: "Tour đã có booking xác nhận ở ngày khởi hành, agency chỉ được phép thay đổi khách sạn (hotel)."
          });
        }
      }
    }
    // Update core tour data (bao gồm location, destination)
    if (req.user?.role === 'admin') {
      console.log("🎯 Admin updating core tour data:", tourData);
      await tour.update(tourData);
      console.log("✅ Core tour data updated by admin");
    } else {
      console.log("🏢 Agency updating core tour data:", tourData);
      await tour.update(tourData);
      console.log("✅ Core tour data updated by agency");
    }

    // Cập nhật images nếi có
    if (images) {
      if (req.user?.role === 'admin') {
        console.log("📷 Admin updating images");
      } else {
        console.log("📷 Agency updating images");
      }
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
    console.log("🔧 About to process included services:");
    console.log("- selectedIncludedServices:", selectedIncludedServices, "length:", selectedIncludedServices.length);
    console.log("- included_service_ids:", included_service_ids, "length:", included_service_ids.length);

    const servicesToUpdate = [...selectedIncludedServices, ...included_service_ids].filter(Boolean);
    console.log("🔧 Combined servicesToUpdate:", servicesToUpdate, "length:", servicesToUpdate.length);

    if (servicesToUpdate.length > 0) {
      if (req.user?.role === 'admin') {
        console.log("🔧 Admin updating included services:", servicesToUpdate);
      } else {
        console.log("🔧 Agency updating included services:", servicesToUpdate);
      }
      const existingServices = await IncludedService.findAll({
        where: { id: servicesToUpdate }
      });

      if (existingServices.length !== servicesToUpdate.length) {
        console.log('⚠️ Some included services not found:', servicesToUpdate);
        console.log('✅ Existing services:', existingServices.map(s => s.id));
      }

      await tour.setIncludedServices(existingServices.map(s => s.id));
      if (req.user?.role === 'admin') {
        console.log("✅ Included services updated by admin");
      } else {
        console.log("✅ Included services updated by agency");
      }
    } else if (servicesToUpdate.length === 0 && (selectedIncludedServices.length === 0 || included_service_ids.length === 0)) {
      // Clear nếu gửi mảng rỗng
      await tour.setIncludedServices([]);
    }

    // 🚫 Xử lý excluded services (cả excludedServices và excluded_service_ids)
    console.log("🚫 ==================== EXCLUDED SERVICES DEBUG ====================");
    console.log("🚫 About to process excluded services:");
    console.log("- excludedServices array:", excludedServices, "length:", excludedServices.length);
    console.log("- excluded_service_ids array:", excluded_service_ids, "length:", excluded_service_ids.length);

    const excludedServicesToUpdate = [
      ...excludedServices,
      ...excluded_service_ids,
      ...selectedExcludedServices
    ].filter(Boolean);
    console.log("🚫 Combined excludedServicesToUpdate:", excludedServicesToUpdate, "length:", excludedServicesToUpdate.length);
    console.log("🚫 ================================================================");

    if (excludedServicesToUpdate.length > 0) {
      if (req.user?.role === 'admin') {
        console.log("🚫 Admin updating excluded services:", excludedServicesToUpdate);
      } else {
        console.log("🚫 Agency updating excluded services:", excludedServicesToUpdate);
      }
      const existingExcludedServices = await ExcludedService.findAll({
        where: { id: excludedServicesToUpdate }
      });
      console.log('✅ Existing excluded services:', existingExcludedServices.map(s => s.id));

      if (existingExcludedServices.length !== excludedServicesToUpdate.length) {
        console.log('⚠️ Some excluded services not found:', excludedServicesToUpdate);
        console.log('✅ Existing excluded services:', existingExcludedServices.map(s => s.id));
      }

      console.log("🔄 About to call tour.setExcludedServices with IDs:", existingExcludedServices.map(s => s.id));
      await tour.setExcludedServices(existingExcludedServices.map(s => s.id));
      console.log("🔄 setExcludedServices completed successfully");

      // Kiểm tra lại database ngay sau khi set
      const { sequelize } = require('../models');
      const [checkResult] = await sequelize.query(
        'SELECT * FROM tour_excluded_service WHERE tour_id = ?',
        { replacements: [tour.id], type: sequelize.QueryTypes.SELECT }
      );
      console.log("🔍 Database check after setExcludedServices:", checkResult.length, "records found");

      if (req.user?.role === 'admin') {
        console.log("✅ Excluded services updated by admin");
      } else {
        console.log("✅ Excluded services updated by agency");
      }
    } else if (excludedServicesToUpdate.length === 0 && (excludedServices.length === 0 || excluded_service_ids.length === 0)) {
      // Clear nếu gửi mảng rỗng
      await tour.setExcludedServices([]);
      if (req.user?.role === 'admin') {
        console.log("🚫 Excluded services cleared by admin");
      } else {
        console.log("🚫 Excluded services cleared by agency");
      }
    }

    // Xử lý categories (cả selectedCategories và category_ids)
    console.log("📂 About to process categories:");
    console.log("- selectedCategories:", selectedCategories, "length:", selectedCategories.length);
    console.log("- category_ids:", category_ids, "length:", category_ids.length);

    const categoriesToUpdate = [...selectedCategories, ...category_ids].filter(Boolean);
    console.log("📂 Combined categoriesToUpdate:", categoriesToUpdate, "length:", categoriesToUpdate.length);

    if (categoriesToUpdate.length > 0) {
      if (req.user?.role === 'admin') {
        console.log("📂 Admin updating categories:", categoriesToUpdate);
      } else {
        console.log("📂 Agency updating categories:", categoriesToUpdate);
      }
      const existingCategories = await TourCategory.findAll({
        where: { id: categoriesToUpdate }
      });

      if (existingCategories.length !== categoriesToUpdate.length) {
        console.log('⚠️ Some categories not found:', categoriesToUpdate);
        console.log('✅ Existing categories:', existingCategories.map(c => c.id));
      }

      await tour.setCategories(existingCategories.map(c => c.id));
      if (req.user?.role === 'admin') {
        console.log("✅ Categories updated by admin");
      } else {
        console.log("✅ Categories updated by agency");
      }
    } else if (categoriesToUpdate.length === 0 && (selectedCategories.length === 0 || category_ids.length === 0)) {
      // Clear nếu gửi mảng rỗng
      await tour.setCategories([]);
      if (req.user?.role === 'admin') {
        console.log("📂 Categories cleared by admin");
      } else {
        console.log("📂 Categories cleared by agency");
      }
    }

    // Xử lý hotels
    if (hotel_ids.length > 0) {
      if (req.user?.role === 'admin') {
        console.log("🏨 Admin updating hotels:", hotel_ids);
      } else {
        console.log("🏨 Agency updating hotels:", hotel_ids);
      }
      await tour.setHotels(hotel_ids);
      if (req.user?.role === 'admin') {
        console.log("✅ Hotels updated by admin");
      } else {
        console.log("✅ Hotels updated by agency");
      }
    } else if (hotel_ids.length === 0) {
      // Clear nếu gửi mảng rỗng
      await tour.setHotels([]);
      if (req.user?.role === 'admin') {
        console.log("🏨 Hotels cleared by admin");
      } else {
        console.log("🏨 Hotels cleared by agency");
      }
    }

    // Xử lý multiple locations (update function)
    const locationsToProcess = [];

    // Support cả single location (legacy) và multiple locations (new)
    if (location_id) {
      locationsToProcess.push(location_id);
    }
    if (location_ids && location_ids.length > 0) {
      locationsToProcess.push(...location_ids);
    }

    // Remove duplicates
    const uniqueLocationIds = [...new Set(locationsToProcess)];

    if (uniqueLocationIds.length > 0) {
      if (req.user?.role === 'admin') {
        console.log("📍 Admin updating locations:", uniqueLocationIds);
      } else {
        console.log("📍 Agency updating locations:", uniqueLocationIds);
      }

      // Kiểm tra locations có tồn tại không
      const existingLocations = await Location.findAll({
        where: { id: uniqueLocationIds }
      });

      if (existingLocations.length > 0) {
        const locationIds = existingLocations.map(l => l.id);
        await tour.setLocations(locationIds);

        // Auto-populate location field với tên của location đầu tiên (backward compatibility)
        if (existingLocations[0]) {
          await tour.update({ location: existingLocations[0].name });
          console.log("📍 Auto-populated location field with:", existingLocations[0].name);
        }
      }

      if (req.user?.role === 'admin') {
        console.log("✅ Locations updated by admin");
      } else {
        console.log("✅ Locations updated by agency");
      }
    } else if (uniqueLocationIds.length === 0 && (location_ids?.length === 0 || location_id === null)) {
      // Clear nếu gửi mảng rỗng hoặc null
      await tour.setLocations([]);
      if (req.user?.role === 'admin') {
        console.log("📍 Locations cleared by admin");
      } else {
        console.log("📍 Locations cleared by agency");
      }
    }

    // Reload tour với đầy đủ relations để trả về đủ dữ liệu
    await tour.reload({
      include: [
        { model: TourImage, as: 'images' },
        { model: DepartureDate, as: 'departureDates' },
        { model: TourCategory, as: 'categories' },
        { model: IncludedService, as: 'includedServices' },
        { model: Hotel, as: 'hotels' },
        { model: ExcludedService, as: 'excludedServices' },
        { model: Location, as: 'locations' }
      ]
    });

    if (req.user?.role === 'admin') {
      console.log("🎉 Admin tour update completed successfully:", {
        id: tour.id,
        name: tour.name,
        updatedBy: req.user?.email || req.user?.id || 'unknown'
      });
    } else {
      console.log("🎉 Agency tour update completed successfully:", {
        id: tour.id,
        name: tour.name,
        updatedBy: req.user?.email || req.user?.id || 'unknown'
      });
    }

    // Đảm bảo luôn có trường excludedServices (mảng rỗng nếu không có)
    const tourJson = tour.toJSON();
    if (!tourJson.excludedServices) tourJson.excludedServices = [];
    res.json(tourJson);
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
        // Tour mới tạo hoặc chưa có status
        '': ['Chờ duyệt'],
        null: ['Chờ duyệt'],
        undefined: ['Chờ duyệt'],

        // Các trạng thái chuẩn
        'Chờ duyệt': ['Ngừng hoạt động'],
        'Đang hoạt động': ['Ngừng hoạt động'],
        'Ngừng hoạt động': ['Chờ duyệt'],

        // Fallback cho bất kỳ trạng thái nào khác
        'default': ['Chờ duyệt']
      };

      // Normalize current status
      const currentStatus = tour.status || '';
      const allowedStatusesForCurrent = allowedChanges[currentStatus] || allowedChanges['default'] || [];

      if (!allowedStatusesForCurrent.includes(status)) {
        return res.status(400).json({
          message: `Agency không thể chuyển từ '${currentStatus}' sang '${status}'`,
          currentStatus: currentStatus,
          allowedStatuses: allowedStatusesForCurrent,
          requestedStatus: status
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

      switch (status) {
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
        },
        {
          model: Agency,
          as: 'agency',
          attributes: ['id', 'name'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['email']
            }
          ]
        },
        {
          model: Location,
          as: 'locations',
          attributes: ['id', 'name', 'description'],
          through: { attributes: [] }
        }
      ],
      order: [
        [{ model: Itinerary, as: "itineraries" }, 'day_number', 'ASC']
      ]
    });

    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour!" });
    }

    // Lấy tổng số người đã đặt từ bảng booking_summary cho từng ngày khởi hành
    const { sequelize } = require('../models');
    const tourIdLower = (tour.id || '').toString().trim().toLowerCase();
    const departureDatesWithSlots = await Promise.all(
      tour.departureDates.map(async (date, idx) => {
        // Luôn ép về object thường để lấy đúng thuộc tính
        const dateObj = date.toJSON ? date.toJSON() : date;
        const departureDateId = (dateObj.departureDates_id || dateObj.id || '').toString().trim().toLowerCase();
        if (!departureDateId) {
          return {
            ...dateObj,
            available_slots: tour.max_participants || 0,
            booked: 0
          };
        }

        const [summary] = await sequelize.query(
          `SELECT total_booked FROM booking_summary WHERE LOWER(tour_id) = ? AND LOWER(departure_date_id) = ? LIMIT 1`,
          { replacements: [tourIdLower, departureDateId], type: sequelize.QueryTypes.SELECT }
        );

        if (!summary) {
          console.warn(`[WARN][${idx}] Không tìm thấy booking_summary cho:`, { tourIdLower, departureDateId });
        }
        const booked = summary && summary.total_booked ? parseInt(summary.total_booked, 10) : 0;
        const available_slots = (tour.max_participants || 0) - booked;

        return {
          ...dateObj,
          available_slots: available_slots < 0 ? 0 : available_slots,
          booked
        };
      })
    );
    const tourJson = tour.toJSON();
    tourJson.departureDates = departureDatesWithSlots;
    res.json(tourJson);
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

// Lấy tour + locations
const getTourWithLocations = async (req, res) => {
  try {
    const tour = await Tour.findByPk(req.params.id, {
      include: [
        {
          model: Location,
          as: "locations",
          attributes: ['id', 'name', 'description', 'image_url'],
          through: { attributes: [] }
        }
      ]
    });

    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour!" });
    }

    res.json(tour);
  } catch (err) {
    console.error("Lỗi khi lấy tour + locations:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Gán location cho tour
const assignLocationToTour = async (req, res) => {
  const { tourId, locationId } = req.params;
  try {
    const tour = await Tour.findByPk(tourId);
    const location = await Location.findByPk(locationId);

    if (!tour || !location) {
      return res.status(404).json({ message: "Không tìm thấy tour hoặc location" });
    }

    await tour.addLocation(location);

    // Auto-update location field nếu chưa có
    if (!tour.location) {
      await tour.update({ location: location.name });
    }

    res.json({ message: "Đã gắn location vào tour thành công" });
  } catch (err) {
    console.error("Lỗi khi gắn location vào tour:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Gỡ location khỏi tour
const removeLocationFromTour = async (req, res) => {
  const { tourId, locationId } = req.params;
  try {
    const tour = await Tour.findByPk(tourId);
    const location = await Location.findByPk(locationId);

    if (!tour || !location) {
      return res.status(404).json({ message: "Không tìm thấy tour hoặc location" });
    }

    await tour.removeLocation(location);
    res.json({ message: "Đã gỡ location khỏi tour thành công" });
  } catch (err) {
    console.error("Lỗi khi gỡ location khỏi tour:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
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
  debugTourRelations,
  updateBookingSummary,
  getTourWithLocations,
  assignLocationToTour,
  removeLocationFromTour,
  submitForApproval,
};
