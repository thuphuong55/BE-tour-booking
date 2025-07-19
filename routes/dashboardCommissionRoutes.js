const express = require('express');
const router = express.Router();
const dashboardCommissionController = require('../controllers/dashboardCommissionController');
const { protect, ensureAdmin, ensureAgency } = require('../middlewares/auth');

// Admin Dashboard Routes
router.get('/admin/overview', protect, ensureAdmin, dashboardCommissionController.getAdminCommissionOverview);
router.get('/admin/pending', protect, ensureAdmin, dashboardCommissionController.getPendingCommissions);
router.get('/admin/history', protect, ensureAdmin, dashboardCommissionController.getAdminCommissionHistory);

// Agency Dashboard Routes  
router.get('/agency/stats', protect, ensureAgency, dashboardCommissionController.getAgencyCommissionStats);
router.get('/agency/history', protect, ensureAgency, dashboardCommissionController.getAgencyCommissionHistory);

module.exports = router;
