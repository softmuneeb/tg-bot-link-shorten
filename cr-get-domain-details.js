require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.API_KEY_CONNECT_RESELLER;
const domainName = 'softlink.sbs'; // Replace with the domain name you want to fetch details for

const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/ViewDomain?APIKey=${API_KEY}&websiteName=${domainName}`;

axios
  .get(apiUrl)
  .then(response => {
    // Handle the response here
    if (response?.status === 200) {
      const domainDetails = response.data;
      console.log('Domain Details:', domainDetails);
    } else {
      console.error('Failed to fetch domain details');
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
