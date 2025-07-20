// 🚀 OPTIMIZATION: Response optimization helpers
const optimizeResponse = (data, type = 'default') => {
  if (!data) return data;
  
  switch (type) {
    case 'tour_list':
      return {
        id: data.id,
        name: data.name,
        location: data.location,
        destination: data.destination,
        price: data.price,
        tour_type: data.tour_type,
        status: data.status,
        created_at: data.created_at,
        main_image: data.images?.find(img => img.is_main)?.image_url || 
                   data.images?.[0]?.image_url || null,
        departure_dates: data.departureDates?.slice(0, 3).map(dd => ({
          id: dd.id,
          departure_date: dd.departure_date,
          number_of_days: dd.number_of_days
        })) || [],
        agency_name: data.agency?.name || null
      };
    
    case 'admin_list':
      return {
        id: data.id,
        name: data.name,
        status: data.status,
        tour_type: data.tour_type,
        agency_name: data.agency?.name || null,
        agency_email: data.agency?.user?.email || null,
        created_at: data.created_at,
        departure_count: data.departureDates?.length || 0,
        image_count: data.images?.length || 0
      };
    
    case 'agency_list':
      return {
        id: data.id,
        name: data.name,
        status: data.status,
        tour_type: data.tour_type,
        price: data.price,
        created_at: data.created_at,
        departure_count: data.departureDates?.length || 0,
        main_image: data.images?.find(img => img.is_main)?.image_url || null
      };
    
    default:
      return data;
  }
};

// 🚀 OPTIMIZATION: Paginated response helper
const paginatedResponse = (data, pagination, optimizationType = 'default') => {
  return {
    success: true,
    data: Array.isArray(data) 
      ? data.map(item => optimizeResponse(item.toJSON ? item.toJSON() : item, optimizationType))
      : data,
    pagination: {
      ...pagination,
      optimized: true
    },
    meta: {
      timestamp: new Date().toISOString(),
      response_time: Date.now()
    }
  };
};

// 🚀 OPTIMIZATION: Error response helper
const errorResponse = (message, statusCode = 500, details = null) => {
  return {
    success: false,
    error: {
      message,
      status: statusCode,
      details,
      timestamp: new Date().toISOString()
    }
  };
};

// 🚀 OPTIMIZATION: Success response helper
const successResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString()
    }
  };
};

module.exports = { 
  optimizeResponse, 
  paginatedResponse, 
  errorResponse, 
  successResponse 
};
