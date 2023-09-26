require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.API_KEY_CONNECT_RESELLER;

const saveServerInDomain = async (domainName, server) => {
  let dnsZoneId;
  let websiteId;

  try {
    const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/ViewDomain`;
    const params = {
      APIKey: API_KEY,
      websiteName: domainName,
    };
    const response = await axios.get(url, { params });
    if (response?.data?.responseMsg?.statusCode === 200) {
      websiteId = response?.data?.responseData?.websiteId;
    } else {
      let e = response?.data?.responseMsg?.message;
      console.error('Error saveServerInDomain 1', e);
      return { error: e };
    }
  } catch (error) {
    let e = `${error?.message} ${JSON.stringify(error?.response?.data)}`;
    console.error('Error saveServerInDomain 2', e);
    return { error: e };
  }

  {
    const params = {
      APIKey: API_KEY,
      WebsiteId: websiteId,
    };
    const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/ManageDNSRecords`;
    await axios.get(url, { params }); // Enable DNS Management
  }

  try {
    const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/ViewDomain`;
    const params = {
      APIKey: API_KEY,
      websiteName: domainName,
    };
    const response = await axios.get(url, { params });
    if (response?.data?.responseMsg?.statusCode === 200) {
      dnsZoneId = response?.data?.responseData?.dnszoneId;
    } else {
      let e = response?.data?.responseMsg?.message;
      console.error('Error saveServerInDomain 1', e);
      return { error: e };
    }
  } catch (error) {
    let e = `${error?.message} ${JSON.stringify(error?.response?.data)}`;
    console.error('Error saveServerInDomain 2', e);
    return { error: e };
  }

  const RECORD_NAME = domainName;
  const RECORD_VALUE = server;
  const RECORD_TTL = 30;

  try {
    const url =
      'https://api.connectreseller.com/ConnectReseller/ESHOP/AddDNSRecord';
    const params = {
      APIKey: API_KEY,
      DNSZoneID: dnsZoneId,
      RecordName: RECORD_NAME,
      RecordType: 'CNAME',
      RecordValue: RECORD_VALUE,
      RecordTTL: RECORD_TTL,
    };
    const response = await axios.get(url, { params });
    const success = 200 === response?.data?.responseData?.statusCode;
    return { success };
  } catch (error) {
    console.error(
      'Error saveServerInDomain 3',
      error?.message,
      error?.response?.data,
    );
    return { error: `${error?.message} ${error?.response?.data}` };
  }
};

// saveServerInDomain('cakes-and-bakes.sbs', 'server.sbs').then(console.log);

module.exports = { saveServerInDomain };
