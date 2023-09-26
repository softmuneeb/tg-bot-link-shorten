require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.API_KEY_CONNECT_RESELLER;
const URL = 'https://api.connectreseller.com/ConnectReseller/ESHOP/ViewDNSRecord';

async function viewDNSRecord(websiteId) {
  try {
    const params = {
      APIKey: API_KEY,
      WebsiteId: websiteId, // Assuming websiteId is provided as an argument to the function
    };
    const response = await axios.get(URL, { params });

    // Check the response status code
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Error fetching DNS records. Status Code: ${response.status}`);
    }
  } catch (error) {
    throw new Error(`Error: ${error.message}`);
  }
}

// Example usage
const websiteId = '1933107'; // Replace with actual website ID
viewDNSRecord(websiteId)
  .then(data => console.log(data))
  .catch(error => console.error(error.message));
