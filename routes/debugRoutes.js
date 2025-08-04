const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');

// Debug endpoint để kiểm tra req.user
router.get('/debug-user', protect(), async (req, res) => {
  try {
    console.log('[DEBUG-ENDPOINT] Full req.user:', req.user);
    
    const { Agency, Tour } = require('../models');
    
    // Nếu là agency, tìm agency record
    let agencyInfo = null;
    let tourCount = 0;
    
    if (req.user.role === 'agency') {
      agencyInfo = await Agency.findOne({ 
        where: { user_id: req.user.id },
        attributes: ['id', 'name', 'status']
      });
      
      if (agencyInfo) {
        const tours = await Tour.findAll({ 
          where: { agency_id: agencyInfo.id },
          attributes: ['id', 'name']
        });
        tourCount = tours.length;
      }
    }
    
    res.json({
      message: 'Debug user info',
      req_user: req.user,
      agency_info: agencyInfo,
      tour_count: tourCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[DEBUG-ENDPOINT] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
