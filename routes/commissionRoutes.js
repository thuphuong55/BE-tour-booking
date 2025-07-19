const express = require('express');
const router = express.Router();
const commissionController = require('../controllers/commissionController');
const { protect, ensureAdmin } = require('../middlewares/auth');

// Áp dụng middleware xác thực admin cho tất cả routes
router.use(protect);
router.use(ensureAdmin);

// Commission calculation routes
router.post('/calculate/:bookingId', commissionController.calculateBookingCommission);
router.post('/calculate-pending', commissionController.calculatePendingCommissions);
router.get('/report', commissionController.getCommissionReport);

// Commission settings routes
router.get('/settings', commissionController.getCommissionSettings);
router.post('/settings', commissionController.createCommissionSetting);
router.put('/settings/:id', commissionController.updateCommissionSetting);
router.delete('/settings/:id', commissionController.deleteCommissionSetting);

module.exports = router;
