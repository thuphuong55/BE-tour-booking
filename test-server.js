const express = require('express');
const { Commission, Booking, User } = require('./models');

const app = express();

app.get('/test-commission', async (req, res) => {
  try {
    const commissions = await Commission.findAll({
      include: [
        {
          model: Booking,
          as: 'booking'
        },
        {
          model: User,
          as: 'agency'
        }
      ],
      limit: 5
    });

    res.json({
      success: true,
      count: commissions.length,
      data: commissions.map(c => ({
        id: c.id,
        booking_id: c.booking_id,
        agency_id: c.agency_id,
        amount: c.amount,
        rate: c.rate,
        status: c.status,
        booking: c.booking ? {
          id: c.booking.id,
          total_price: c.booking.total_price,
          status: c.booking.status
        } : null,
        agency: c.agency ? {
          id: c.agency.id,
          name: c.agency.name
        } : null
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
});
