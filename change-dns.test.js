const axios = require('axios');

// API endpoint and parameters
const apiKey = 'iYJ6Q8X2tUNLeT3';
const domainNameId = 1;
const websiteName = 'domainexample.com';
const nameServer1 = 'newNameServer1';
const nameServer2 = 'newNameServer2';

const apiUrl = `https://api.connectreseller.com/ConnectReseller/ESHOP/UpdateNameServer?APIKey=${apiKey}&domainNameId=${domainNameId}&websiteName=${websiteName}&nameServer1=${nameServer1}&nameServer2=${nameServer2}`;

// Making the API request
axios
  .get(apiUrl)
  .then(response => {
    // Logging the response data for testing
    console.log('Response Data:', response.data);

    // Extracting relevant information
    const statusCode = response.data.statusCode;
    const message = response.data.message;

    // Logging extracted information
    console.log('Status Code:', statusCode);
    console.log('Message:', message);

    if (statusCode === 200) {
      console.log('Name servers updated successfully.');
    } else {
      console.log('Name server update failed.');
    }
  })
  .catch(error => {
    // Logging the error for debugging
    // Logging the error message without the API key for debugging
    console.error('Error updating name server. ', error.message);
  });
