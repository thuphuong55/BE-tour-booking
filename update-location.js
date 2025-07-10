const { Location } = require('./models');

async function updateLocation() {
  try {
    const [count] = await Location.update(
      { destination_id: 'dest-dalat-center' },
      { where: { name: 'Đà Lạt' } }
    );
    if (count > 0) {
      console.log('Đã cập nhật location Đà Lạt!');
    } else {
      console.log('Không tìm thấy location Đà Lạt để cập nhật.');
    }
  } catch (error) {
    console.error('Lỗi:', error.message);
  } finally {
    process.exit();
  }
}

updateLocation(); 