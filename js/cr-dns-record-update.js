const axios = require('axios');
const { log } = require('console');
require('dotenv').config();
const APIKey = process.env.API_KEY_CONNECT_RESELLER;

const updateDNSRecord = async (DNSZoneID, DNSZoneRecordID, RecordName, RecordType, RecordValue) => {
  try {
    const apiUrl = 'https://api.connectreseller.com/ConnectReseller/ESHOP/ModifyDNSRecord';
    const requestData = {
      APIKey,
      DNSZoneID,
      RecordName,
      RecordType,
      RecordValue,
      DNSZoneRecordID,
    };

    const response = await axios.get(apiUrl, { params: requestData });
    log(
      'updateDNSRecord ',
      { DNSZoneID, DNSZoneRecordID, RecordName, RecordType, RecordValue },
      JSON.stringify(response.data, null, 2),
    );

    if (response?.data?.responseMsg?.statusCode === 200) {
      return { success: true };
    } else {
      let errorMessage = `Issue in updateDNSRecord ${response?.data?.responseMsg?.message}`;
      log(errorMessage);
      return { error: errorMessage };
    }
  } catch (error) {
    const errorMessage = `Error updateDNSRecord ${error.message} ${JSON.stringify(error?.response?.data, null, 2)}`;
    log(error, errorMessage);
    return { error: errorMessage };
  }
};
// const dnszoneID = 153141;
// const dnszoneRecordID = 1112779751;
// updateDNSRecord(dnszoneID, dnszoneRecordID, 'glasso.sbs', 'CNAME', 'abc.def').then(log);

module.exports = { updateDNSRecord };
