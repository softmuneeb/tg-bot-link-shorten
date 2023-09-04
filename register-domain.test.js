const axios = require('axios');
require('dotenv').config();

// API endpoint URL
const apiUrl = 'https://api.connectreseller.com/ConnectReseller/ESHOP/Order';

// Request parameters
const requestData = {
  APIKey: process.env.API_KEY_CONNECT_RESELLER,
  ProductType: 1,
  Websitename: 'softlemon.sbs',
  Duration: 1,
  IsWhoisProtection: false,
  // ns1: 'betty.ns.cloudflare.com',
  // ns2: 'brett.ns.cloudflare.com',

  Id: 150106, // Replace with the actual customer ID
  // couponCode: 'couponcode',
};

// Make the API request
axios
  .get(apiUrl, { params: requestData })
  .then(response => {
    const responseData = response.data;
    console.log('Response:', JSON.stringify(responseData, null, 2));
    console.log('Response Data:', responseData);
    console.log('Creation Date:', responseData.creationDate);
    console.log('Expiry Date:', responseData.expiryDate);
    console.log('Message:', responseData.msg);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
