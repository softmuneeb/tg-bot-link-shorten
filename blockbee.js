const BlockBee = require('@blockbee/api');
const dotenv = require('dotenv');
dotenv.config();
const API_KEY_BLOCKBEE = process.env.API_KEY_BLOCKBEE;

const getAddress = async bb => {
  try {
    const address = await bb.getAddress();
    return address;
  } catch (error) {
    console.error('An error occurred while getting the address:', error);
    return error;
  }
};

const checkLogs = async bb => {
  try {
    const data = await bb.checkLogs();
    return data;
  } catch (error) {
    console.error('An error occurred while checking logs:', error);
    return error;
  }
};

const convertUSDToCrypto = async (value, coin) => {
  const conversion = await BlockBee.getConvert(
    coin,
    value,
    'usd',
    API_KEY_BLOCKBEE,
  );
  return conversion.value_coin;
};
// convertUSDToCrypto(10, 'btc');

const getCryptoDepositAddress = async (ticker, webhookParams) => {
  const myAddress = ''; // auto gen by BB
  const callbackUrl =
    'https://3562-2400-adc5-425-8900-42-d36e-79bb-f2bf.ngrok-free.app/save-payment-blockbee';
  const blockbeeParams = {};

  const bb = new BlockBee(
    ticker,
    myAddress,
    callbackUrl,
    webhookParams,
    blockbeeParams,
    API_KEY_BLOCKBEE,
  );

  const address = await getAddress(bb);
  // const qrCode = await bb.getQrcode(value, size);
  // const data = await checkLogs(bb);
  // console.log({ address, data });
  console.log(address);
  return address;
};

// getCryptoDepositAddress('polygon_matic',  '6687923716' ); // chatid

module.exports = { getCryptoDepositAddress, convertUSDToCrypto };
