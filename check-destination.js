const { Destination } = require('./models');

async function checkDestination() {
  try {
    const destinationId = '28724d88-f566-408e-8f97-7818d19a7b90';
    
    console.log(`=== Kiểm tra destination với ID: ${destinationId} ===`);
    
    const destination = await Destination.findByPk(destinationId);
    
    if (destination) {
      console.log('Tìm thấy destination:');
      console.log('- ID:', destination.id);
      console.log('- Name:', destination.name);
      console.log('- Created:', destination.createdAt);
      console.log('- Updated:', destination.updatedAt);
    } else {
      console.log('Không tìm thấy destination với ID này!');
      
      // Liệt kê tất cả destinations để kiểm tra
      console.log('\n=== Danh sách tất cả destinations ===');
      const allDestinations = await Destination.findAll();
      allDestinations.forEach(dest => {
        console.log(`- ${dest.name} (ID: ${dest.id})`);
      });
    }
    
  } catch (error) {
    console.error('Lỗi:', error.message);
  } finally {
    process.exit();
  }
}

checkDestination(); 