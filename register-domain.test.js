const axios = require('axios');
require('dotenv').config();

const buyDomainOnline = async (domain) => {
  try {
    const apiUrl =
      'https://api.connectreseller.com/ConnectReseller/ESHOP/Order';
    const requestData = {
      APIKey: process.env.API_KEY_CONNECT_RESELLER,
      ProductType: 1,
      Websitename: domain,
      Duration: 1,
      IsWhoisProtection: false,
      Id: 150106, // Replace with the actual customer ID
      // ns1: 'betty.ns.cloudflare.com',
      // ns2: 'brett.ns.cloudflare.com',
      // couponCode: 'couponcode',
    };

    const response = await axios.get(apiUrl, { params: requestData });
    console.log('Response:', JSON.stringify(response.data, null, 2));
    if (response?.status === 200) {
      return { success: true };
    } else {
      let errorMessage = `Issue in buying domain ${response?.data?.responseMsg?.message}`;
      console.error(errorMessage);
      return { error: errorMessage };
    }

  } catch (error) {
    const errorMessage = `Error buying domain ${error.message} ${error.data}`;
    console.error(errorMessage);
    return { error: errorMessage };
  }
};

// buyDomainOnline();

module.exports = { buyDomainOnline };