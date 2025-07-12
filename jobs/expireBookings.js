const { Booking } = require("../models");
const { Op } = require("sequelize");

module.exports = async function expireBookingsJob() {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const expired = await Booking.update(
    { status: "expired" },
    {
      where: {
        status: "pending",
        created_at: { [Op.lt]: fifteenMinutesAgo }
      }
    }
  );

  console.log(`[Cron] Đã cập nhật ${expired[0]} booking hết hạn.`);
};
