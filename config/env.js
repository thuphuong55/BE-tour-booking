require("dotenv").config();

module.exports = {
  momo: {
    accessKey: 'F8BBA842ECF85',
    secretKey: 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    partnerCode: 'MOMO',
    redirectUrl: 'https://webhook.site/xxx',
    ipnUrl: 'https://webhook.site/xxx',
    requestType: 'payWithMethod',
    autoCapture: true,
    lang: 'vi',
  },
  port: process.env.PORT || 5000,
};
