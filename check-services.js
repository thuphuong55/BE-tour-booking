const { IncludedService } = require('./models');

async function checkServices() {
  try {
    console.log('Checking included_service table...');
    const services = await IncludedService.findAll();
    console.log('Total services found:', services.length);
    
    if (services.length === 0) {
      console.log('Table is empty!');
    } else {
      console.log('Services in database:');
      services.forEach(service => {
        console.log('- ID:', service.id, ', Name:', service.name);
      });
    }
  } catch (error) {
    console.error('Error checking services:', error.message);
  }
  process.exit(0);
}

checkServices();
