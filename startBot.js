const axios = require('axios');
const { convertUSDToCrypto } = require('./blockbee');
const { isRailwayAPIWorking } = require('./cr-rl-connect-domain-to-server');
const { getBusinessId } = require('./fincra');
const { getRegisteredDomainNames } = require('./get-purchased-domains.test');

const runBot = async () => {
  try {
    axios.get('https://api.ipify.org/').then(ip => {
      const message = `Please add \`\`\`${ip.data}\`\`\` to whitelist in Connect Reseller, API Section. https://global.connectreseller.com/tools/profile`;
      console.log(message);
    });

    await getBusinessId();
    console.log('working, fincra api');
    // await getRegisteredDomainNames();
    // console.log('working, connect reseller api');
    await convertUSDToCrypto('1', 'polygon_matic');
    console.log('working, blockbee api');
    await isRailwayAPIWorking();
    console.log('working, railway api, now starting the bot');

    require('./index.js');
  } catch (error) {
    console.error('Error is:', error);
    console.error(
      'Error is:',
      error?.message,
      error?.response?.data,
      error?.cause,
      JSON.stringify(error?.response?.data, null, 2),
    );
  }
};

runBot();
