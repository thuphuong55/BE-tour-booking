const express = require('express');
const router = express.Router();
const dashboardCommissionController = require('../controllers/dashboardCommissionController');
const { protect, ensureAdmin, ensureAgency } = require('../middlewares/auth');

// Admin Dashboard Routes
router.get('/admin/overview', protect(['admin']), dashboardCommissionController.getAdminCommissionOverview);
router.get('/admin/pending', protect(['admin']), dashboardCommissionController.getPendingCommissions);
router.get('/admin/history', protect(['admin']), dashboardCommissionController.getAdminCommissionHistory);

// Agency Dashboard Routes  
router.get('/agency/stats', protect(['agency']), dashboardCommissionController.getAgencyCommissionStats);
router.get('/agency/history', protect(['agency']), dashboardCommissionController.getAgencyCommissionHistory);

module.exports = router;
