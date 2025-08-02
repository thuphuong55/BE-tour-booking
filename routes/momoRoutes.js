
const { Router } = require('express');
const momoController = require('../controllers/momoController');

const router = Router();

// ═══════════════════════════════════════════════════════════════════
// � MoMo Routes - CHÍNH THỨC
// ═══════════════════════════════════════════════════════════════════
router.post('/create-payment', momoController.createPayment);              // Chính thức: { bookingId } hoặc { tourId }
router.post('/ipn', momoController.handleIpnCallback);                    // MoMo gửi IPN sau khi thanh toán
router.get('/return', momoController.handleRedirectCallback);             // Return callback từ MoMo
router.get('/tour/:id/confirmation', momoController.getTourConfirmation); // Legacy support

module.exports = router;
