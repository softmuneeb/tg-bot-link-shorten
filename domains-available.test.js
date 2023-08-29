const axios = require('axios');

const API_KEY = 'iYJ6Q8X2tUNLeT3'; // Replace with your actual API key
const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/SearchDomainList?APIKey=${API_KEY}&page=1&maxIndex=10&searchQuery=test&orderby=WebsiteName&orderType=asc`;

async function getRegisteredDomainNames() {
  try {
    const response = await axios.get(apiUrl);
    const domainRecords = response.data.records;

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
