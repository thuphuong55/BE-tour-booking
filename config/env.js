require("dotenv").config();

module.exports = {
  momo: {
    accessKey: 'F8BBA842ECF85',
    secretKey: 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    partnerCode: 'MOMO',
    redirectUrl: 'https://bf10103aeae3.ngrok-free.app/tour/${tourId}/confirmation',
    ipnUrl: 'http://localhost:3000',
    requestType: 'payWithMethod',
    autoCapture: true,
    lang: 'vi',
  },
  port: process.env.PORT || 5000,
};
