
const { Router } = require('express');
const momoController = require('../controllers/momoController');

const router = Router();

router.post('/create-payment', momoController.createPayment);     // Gọi MoMo để tạo thanh toán
router.post('/ipn', momoController.handleIpnCallback);            // MoMo gửi IPN sau khi thanh toán
router.get('/return', momoController.handleRedirectCallback);     // MoMo redirect sau khi thanh toán
router.get('/tour/:id/confirmation', momoController.getTourConfirmation);
module.exports = router;
