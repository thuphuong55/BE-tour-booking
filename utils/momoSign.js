const crypto = require('crypto');

function generateMomoSignature(data, secretKey) {
    const rawSignature = `accessKey=${data.accessKey}&amount=${data.amount}&extraData=${data.extraData}&ipnUrl=${data.ipnUrl}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&partnerCode=${data.partnerCode}&redirectUrl=${data.redirectUrl}&requestId=${data.requestId}&requestType=${data.requestType}`;

    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
    return { rawSignature, signature };
}

module.exports = { buildSignature: generateMomoSignature };
