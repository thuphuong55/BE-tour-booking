/**
 * Transform tour response data (with full relationships) 
 * to request format for UPDATE operations
 */

function transformTourForUpdate(tourResponseData) {
  // Extract core tour data (exclude relationships and metadata)
  const {
    // Exclude relationship arrays (these will be extracted separately)
    departureDates,
    images,
    includedServices,
    excludedServices,
    categories,
    hotels,
    itineraries,
    promotion,
    
    // Exclude junction table data
    TourIncludedService,
    TourTourCategory,
    tour_hotel,
    
    // Exclude timestamps and auto-generated fields
    created_at,
    updated_at,
    
    // Keep core tour data
    ...coreData
  } = tourResponseData;

  // Build update request object
  const updateRequest = {
    ...coreData,
    
    // Transform images array
    images: images?.map(img => ({
      id: img.id,
      image_url: img.image_url,
      is_main: img.is_main
    })) || [],
    
    // Transform departure dates array
    departureDates: departureDates?.map(date => ({
      id: date.id,
      departure_date: date.departure_date,
      end_date: date.end_date,
      number_of_days: date.number_of_days,
      number_of_nights: date.number_of_nights
    })) || [],
    
    // Transform included services to IDs array
    included_service_ids: includedServices?.map(service => service.id) || [],
    
    // Transform excluded services to IDs array  
    excluded_service_ids: excludedServices?.map(service => service.id) || [],
    
    // Transform categories to IDs array
    category_ids: categories?.map(cat => cat.id) || [],
    
    // Transform hotels to IDs array (use id_hotel field)
    hotel_ids: hotels?.map(hotel => hotel.id_hotel || hotel.id) || []
  };

  return updateRequest;
}

/**
 * Extract relationship arrays from original FE data
 * when FE sends arrays directly (not as relationship objects)
 */
function extractRelationshipArrays(originalData) {
  const extracted = {};
  
  // Check if data has direct arrays (FE sending IDs)
  if (Array.isArray(originalData.category_ids)) {
    extracted.category_ids = originalData.category_ids;
  }
  
  if (Array.isArray(originalData.hotel_ids)) {
    extracted.hotel_ids = originalData.hotel_ids;
  }
  
  if (Array.isArray(originalData.included_service_ids)) {
    extracted.included_service_ids = originalData.included_service_ids;
  }
  
  if (Array.isArray(originalData.excluded_service_ids)) {
    extracted.excluded_service_ids = originalData.excluded_service_ids;
  }
  
  if (Array.isArray(originalData.departureDates)) {
    extracted.departureDates = originalData.departureDates;
  }
  
  if (Array.isArray(originalData.images)) {
    extracted.images = originalData.images;
  }
  
  return extracted;
}

/**
 * Smart data transformer that handles both formats:
 * 1. Response format (with relationship objects) 
 * 2. Request format (with ID arrays)
 */
function smartTransformForUpdate(data) {
  console.log("🔄 Smart transform input data keys:", Object.keys(data));
  
  // First, try to extract direct arrays (if FE sends IDs directly)
  const directArrays = extractRelationshipArrays(data);
  console.log("📋 Direct arrays found:", Object.keys(directArrays));
  
  // If we have relationship objects, transform them
  let transformedData = {};
  
  if (data.includedServices || data.excludedServices || data.categories || data.hotels) {
    console.log("🔄 Transforming relationship objects to arrays...");
    transformedData = transformTourForUpdate(data);
  } else {
    console.log("📝 Using data as-is (already in request format)");
    transformedData = { ...data };
  }
  
  // Merge direct arrays (they take priority over transformed ones)
  const finalData = {
    ...transformedData,
    ...directArrays
  };
  
  console.log("✅ Final transformed data arrays:");
  console.log("- category_ids:", finalData.category_ids?.length || 0);
  console.log("- hotel_ids:", finalData.hotel_ids?.length || 0);
  console.log("- included_service_ids:", finalData.included_service_ids?.length || 0);
  console.log("- excluded_service_ids:", finalData.excluded_service_ids?.length || 0);
  console.log("- departureDates:", finalData.departureDates?.length || 0);
  console.log("- images:", finalData.images?.length || 0);
  
  return finalData;
}

module.exports = {
  transformTourForUpdate,
  extractRelationshipArrays,
  smartTransformForUpdate
};
