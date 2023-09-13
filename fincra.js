const axios = require('axios');
require('dotenv').config();

const createCheckout = async (amount, reference) => {
  const options = {
    method: 'POST',
    url: `https://${process.env.FINCRA_ENDPOINT}/checkout/payments`,
    headers: {
      accept: 'application/json',
      'x-pub-key': process.env.FINCRA_PUBLIC_KEY,
      'x-business-id': process.env.BUSINESS_ID,
      'content-type': 'application/json',
      'api-key': process.env.FINCRA_PRIVATE_KEY,
    },
    data: {
      currency: 'NGN',
      customer: { name: 'customer name', email: 'someemail@gmail.com' },
      paymentMethods: ['bank_transfer', 'card'],
      amount,
      redirectUrl: `${process.env.SELF_URL}/save-payment-fincra`,
      reference,
      feeBearer: 'business', // 'customer',
      settlementDestination: 'wallet',
      defaultPaymentMethod: 'bank_transfer',
    },
  };

  try {
    const response = await axios.request(options);
    return { url: response.data.data.link };
  } catch (error) {
    console.error(error.message, error.response.data.message);
    return { error: error.message + ' ' + error.response.data.message };
  }
};

const getBusinessId = () => {
  const options = {
    method: 'GET',
    url: `${process.env.FINCRA_ENDPOINT}/profile/business/me`,
    headers: {
      accept: 'application/json',
      'api-key': process.env.FINCRA_PRIVATE_KEY,
    },
  };

  axios
    .request(options)
    .then(function (response) {
      console.log(response.data);
    })
    .catch(function (error) {
      console.error(error);
    });
};

// getBusinessId();
// createCheckout('1', 'txId7');
// getBankDepositAddress('100', '1234567');
// getBankDepositAddress('100', '55667788');
// getAmountsPaid('64c95e7366ea9f0b4a98dc2e', '64c95e7316ea9f0b4a98dc2e');

module.exports = { createCheckout };
