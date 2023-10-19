require('dotenv').config();
const axios = require('axios');
const getDomainDetails = require('./cr-get-domain-details');
const { log } = require('console');

const API_KEY = process.env.API_KEY_CONNECT_RESELLER;
const URL = 'https://api.connectreseller.com/ConnectReseller/ESHOP/ViewDNSRecord';

async function getDNSRecords(websiteId) {
  try {
    const params = {
      APIKey: API_KEY,
      WebsiteId: websiteId, // Assuming websiteId is provided as an argument to the function
    };
    const response = await axios.get(URL, { params });

    // Check the response status code
    if (response.status === 200) {
      return response?.data?.responseData;
    } else {
      throw new Error(`Error fetching DNS records. Status Code: ${response.status}`);
    }
  } catch (error) {
    throw new Error(`Error: ${error.message}`);
  }
}

const viewDNSRecords = async domain => {
  const details = await getDomainDetails(domain);

  const websiteId = details?.responseData?.websiteId;
  if (!websiteId) {
    log('No websiteId,', details?.responseMsg?.message);
    return;
  }

  const records = await getDNSRecords(websiteId);

  return records.filter(r => r.recordType !== 'SOA');
};

// viewDNSRecords('glasso.sbs').then(log);

module.exports = viewDNSRecords;
