require('dotenv').config();
const BlockBee = require('@blockbee/api');
const API_KEY_BLOCKBEE = process.env.API_KEY_BLOCKBEE;

const convertUSDToCrypto = async (value, coin) => {
  const conversion = await BlockBee.getConvert(
    coin,
    value,
    'usd',
    API_KEY_BLOCKBEE,
  );
  return conversion?.value_coin;
};
// convertUSDToCrypto('10', 'btc').then(console.log);

const getCryptoDepositAddress = async (
  priceCrypto,
  ticker,
  webhookParams,
  backendServer,
  redirectPath,
) => {
  const myAddress = ''; // auto gen by BB
  const callbackUrl = `${backendServer}${redirectPath}`;
  const blockbeeParams = {};

  const bb = new BlockBee(
    ticker,
    myAddress,
    callbackUrl,
    webhookParams,
    blockbeeParams,
    API_KEY_BLOCKBEE,
  );

  const address = await bb.getAddress();
  const qrCode = await bb.getQrcode(priceCrypto);

  // const data = await bb.checkLogs();
  return { address, qrCode: qrCode?.qr_code };
};

// getCryptoDepositAddress('0.55', 'polygon_matic',  '6687923716', 'https://softgreen.com', "/crypto" ).then(a=> console.log(JSON.stringify(a)))

module.exports = { getCryptoDepositAddress, convertUSDToCrypto };
