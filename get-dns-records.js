require('dotenv').config();
const axios = require('axios');

const viewDNSRecords = async websiteId => {
  try {
    const API_KEY = process.env.API_KEY_CONNECT_RESELLER;
    const URL = 'https://api.connectreseller.com/ConnectReseller/ESHOP/ViewDNSRecord';

    const params = {
      APIKey: API_KEY,
      WebsiteId: websiteId,
    };

    const response = await axios.get(URL, { params });

    if (response?.status === 200) {
      const apiResponse = response.data;
      console.log('API Response:', apiResponse);
      return apiResponse;
    } else {
      console.error('Failed to fetch API data');
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

// Example usage
const websiteId = '1933107';
viewDNSRecords(websiteId);
