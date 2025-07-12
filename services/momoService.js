const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { momo } = require("../config/env");
const { buildSignature } = require("../utils/momoSign");

async function createMomoPayment(orderInfo, amount, redirectUrl) {
    const orderId = momo.partnerCode + new Date().getTime();
    const requestId = orderId;
    const extraData = '';

    const { signature } = buildSignature({
        accessKey: momo.accessKey,
        amount,
        extraData,
        ipnUrl: momo.ipnUrl,
        orderId,
        orderInfo,
        partnerCode: momo.partnerCode,
        redirectUrl,
        requestId,
        requestType: momo.requestType,
    }, momo.secretKey);

    const requestBody = {
        partnerCode: momo.partnerCode,
        partnerName: "Test",
        storeId: "MomoTestStore",
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl: momo.ipnUrl,
        lang: momo.lang,
        requestType: momo.requestType,
        autoCapture: momo.autoCapture,
        extraData,
        orderGroupId: '',
        signature
    };

    try {
        const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', requestBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

module.exports = { createMomoPayment };