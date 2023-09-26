const axios = require('axios');
require('dotenv').config();

const buyDomainOnline = async domain => {
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
      ns1: '8307.dns1.managedns.org',
      ns2: '8307.dns2.managedns.org',
    };

    const response = await axios.get(apiUrl, { params: requestData });
    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response?.data?.responseMsg?.statusCode === 200) {
      return { success: true };
    } else {
      let errorMessage = `Issue in buying domain ${response?.data?.responseMsg?.message}`;
      console.error(errorMessage);
      return { error: errorMessage };
    }
  } catch (error) {
    const errorMessage = `Error buying domain ${error.message} ${JSON.stringify(
      error?.response?.data,
    )}`;
    console.error(errorMessage);
    return { error: errorMessage };
  }
};

// buyDomainOnline("cakes-and-bakes.sbs");

module.exports = { buyDomainOnline };
