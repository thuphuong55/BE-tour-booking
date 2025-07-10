const { Destination } = require('./models');

async function checkDestinationById() {
  const id = '28724d88-f566-408e-8f97-7818d19a7b90';
  try {
    const dest = await Destination.findByPk(id);
    if (dest) {
      console.log('Tìm thấy destination:');
      console.log(dest.toJSON());
    } else {
      console.log('Không tìm thấy destination với id:', id);
    }
  } catch (error) {
    console.error('Lỗi:', error.message);
  } finally {
    process.exit();
  }
}

checkDestinationById(); 