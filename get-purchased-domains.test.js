const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.API_KEY_CONNECT_RESELLER;
const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/SearchDomainList?APIKey=${API_KEY}&page=1&maxIndex=100`;
async function getRegisteredDomainNames() {
  try {
    const response = await axios.get(apiUrl);
    const domainRecords = response?.data?.records;
    console.log(response?.data);
    const domainNames = domainRecords.map(record => record.domainName);

    return domainNames;
  } catch (error) {
    console.error('Error fetching domain names:', error.message);
    return [];
  }
}

getRegisteredDomainNames()
  .then(domainNames => {
    console.log('Registered Domain Names:', domainNames);
  })
  .catch(error => {
    console.error('Error:', error);
  });
