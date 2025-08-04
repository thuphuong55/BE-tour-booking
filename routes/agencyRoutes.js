const express = require("express");
const router = express.Router();
const agencyController = require('../controllers/agencyController');
const rateLimiter = require("../middlewares/rateLimiter");
const validateCaptcha = require("../middlewares/validateCaptcha");
const { protect } = require("../middlewares/auth");
const { getAll: getAgencyCommissions } = require('../controllers/commissionController');

// Endpoint: GET /api/agency/commissions?status=paid|pending|cancelled
const { Agency } = require('../models');
router.get('/commissions', protect(['agency']), async (req, res) => {
  // Lấy agency theo user_id
  const agency = await Agency.findOne({ where: { user_id: req.user.id } });
  if (!agency) {
    return res.status(404).json({ message: 'Không tìm thấy agency' });
  }
  req.query.agency_id = agency.id;
  return getAgencyCommissions(req, res);
});

router.put('/approve/:id', protect(['admin']), agencyController.approveAgency);
router.post('/public-request', agencyController.publicRequestAgency);
router.get('/', protect(['admin']), agencyController.getAllAgencies);
router.get('/by-user/:userId', agencyController.getAgencyByUserId);
router.get('/:id', protect(['admin', 'agency']), agencyController.getAgency);

// Admin management routes
router.put('/toggle-lock/:id', protect(['admin']), agencyController.toggleLockAgency);
router.delete('/:id', protect(['admin']), agencyController.deleteAgency);

// 🧪 TEMPORARY: Test endpoint without auth (for debugging)
router.post('/test-create', agencyController.adminCreateAgency);
router.put('/test-toggle-lock/:id', agencyController.toggleLockAgency);

module.exports = router;
