const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const API_KEY = process.env.API_KEY_CONNECT_RESELLER;
const DNS_ZONE_ID = '150615'; // Replace with your DNS zone ID
const RECORD_NAME = 'softlemon.sbs'; // Replace with your desired record name
const RECORD_VALUE = '4hxq9hwu.up.railway.app'; // Replace with your desired record value
const RECORD_TTL = 30; // Replace with your desired TTL
/*
{
    "dnsZoneId": 150615,
    "domainNameId": "1945623",
    "priority": null,
    "recordContent": "4hxq9hwu.up.railway.app",
    "recordName": "softlemon.sbs",
    "recordTTL": 7200,
    "recordType": "CNAME",
    "statusID": 1,
    "websiteID": 1932872,
    "websiteName": "softlemon.sbs"
}
*/
const params = {
  APIKey: API_KEY,
  DNSZoneID: DNS_ZONE_ID,
  RecordName: RECORD_NAME,
  RecordType: 'CNAME',
  RecordValue: RECORD_VALUE,
  RecordTTL: RECORD_TTL,
};

const url =
  'https://api.connectreseller.com/ConnectReseller/ESHOP/AddDNSRecord';

axios
  .get(url, { params })
  .then(response => {
    console.log(JSON.stringify(response?.data, null, 2));
    const responseData = response?.data?.responseData;
    console.log('Response Data:', responseData);
  })
  .catch(error => {
    console.error('Error:', error?.response?.data);
  });
