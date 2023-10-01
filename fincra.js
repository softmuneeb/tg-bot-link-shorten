const axios = require('axios');
const { log } = require('console');
require('dotenv').config();

const createCheckout = async (amount, reference, redirectPath, email, name) => {
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
      customer: { name: name + ' test name', email },
      paymentMethods: ['bank_transfer', 'card'],
      amount,
      redirectUrl: `${process.env.SELF_URL}${redirectPath}`,
      reference,
      feeBearer: 'business', // 'customer',
      settlementDestination: 'wallet',
      defaultPaymentMethod: 'bank_transfer',
    },
  };

  try {
    const response = await axios.request(options);
    return { url: response?.data?.data?.link };
  } catch (error) {
    console.error('Error in Create Checkout', error?.message, error?.response?.data?.message);
    return { error: error?.message + ' ' + error?.response?.data?.message };
  }
};

const trackPayment = async reference => {
  const options = {
    method: 'GET',
    url: `https://${process.env.FINCRA_ENDPOINT}/checkout/payments/merchant-reference/${reference}`,
    headers: {
      accept: 'application/json',
      'x-pub-key': process.env.FINCRA_PUBLIC_KEY,
      'x-business-id': process.env.BUSINESS_ID,
      'content-type': 'application/json',
      'api-key': process.env.FINCRA_PRIVATE_KEY,
    },
  };

  try {
    const response = await axios.request(options);
    return response?.data;
  } catch (error) {
    console.error('Error in Create Checkout', error?.message, error?.response?.data?.message);
    return { error: error?.message + ' ' + error?.response?.data?.message };
  }
};
// trackPayment('TwiYV').then(log);

const getBusinessId = async () => {
  const options = {
    method: 'GET',
    url: `https://${process.env.FINCRA_ENDPOINT}/profile/business/me`,
    headers: {
      accept: 'application/json',
      'api-key': process.env.FINCRA_PRIVATE_KEY,
    },
  };

  await axios.request(options);
};

// getBusinessId();
// createCheckout('1', 'txId12', '/success').then(console.log);
// getBankDepositAddress('100', '1234567');
// getBankDepositAddress('100', '55667788');
// getAmountsPaid('64c95e7366ea9f0b4a98dc2e', '64c95e7316ea9f0b4a98dc2e');

module.exports = { createCheckout, getBusinessId };
