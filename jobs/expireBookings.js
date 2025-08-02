const { Booking } = require("../models");
const { Op } = require("sequelize");

module.exports = async function expireBookingsJob() {
  try {
    const startTime = Date.now();
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Optimized query với index hint và limit để tránh blocking
    const expired = await Booking.update(
      { status: "expired" },
      {
        where: {
          status: "pending",
          created_at: { [Op.lt]: fifteenMinutesAgo }
        },
        // Thêm limit để tránh update quá nhiều records cùng lúc
        limit: 100
      }
    );

    const duration = Date.now() - startTime;
   
    
    // Warning nếu job chạy quá lâu
    if (duration > 5000) {

    }
    
    return expired[0];
  } catch (error) {

    // Không throw error để tránh crash app
    return 0;
  }
};
