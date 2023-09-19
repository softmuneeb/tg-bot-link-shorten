require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.API_KEY_CONNECT_RESELLER;

const saveServerInDomain = async (domainName, server) => {
  let dnsZoneId;

  try {
    const url = `https://api.connectreseller.com/ConnectReseller/ESHOP/ViewDomain`;
    const params = {
      APIKey: API_KEY,
      websiteName: domainName,
    };
    const response = await axios.get(url, { params });

    if (response?.status === 200) {
      dnsZoneId = response?.data?.responseData?.dnszoneId;
    } else {
      let e = response?.data?.responseMsg?.message;
      console.error('Error saveServerInDomain 1', e);
      return { error: e };
    }
  } catch (error) {
    let e = `${error?.message} ${error?.data}`;
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
      error,
      'Error saveServerInDomain 3',
      error?.message,
      error?.response?.data?.message,
    );
    return { error: `${error?.message} ${error?.data}` };
  }
};

// saveServerInDomain('softlemon.sbs', 'server.of.softlemon.sbs');

module.exports = { saveServerInDomain };
