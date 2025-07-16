const { IncludedService, TourCategory, Hotel, ExcludedService } = require('./models');

async function showAllData() {
  try {
    console.log('=== INCLUDED SERVICES ===');
    const services = await IncludedService.findAll();
    services.forEach(service => {
      console.log(`ID: "${service.id}", Name: "${service.name}"`);
    });
    
    console.log('\n=== TOUR CATEGORIES ===');
    const categories = await TourCategory.findAll();
    categories.forEach(category => {
      console.log(`ID: "${category.id}", Name: "${category.name}"`);
    });
    
    console.log('\n=== HOTELS ===');
    const hotels = await Hotel.findAll();
    hotels.forEach(hotel => {
      console.log(`ID: "${hotel.id_hotel}", Name: "${hotel.ten_khach_san}"`);
    });
    
    console.log('\n=== EXCLUDED SERVICES ===');
    const excludedServices = await ExcludedService.findAll();
    excludedServices.forEach(service => {
      console.log(`ID: "${service.id}", Name: "${service.service_name}"`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

showAllData();
