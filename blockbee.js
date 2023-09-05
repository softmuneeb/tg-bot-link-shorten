const BlockBee = require('@blockbee/api');
const dotenv = require('dotenv');
dotenv.config();
const API_KEY_BLOCKBEE = process.env.API_KEY_BLOCKBEE;

const initializeBlockBee = (
  coin,
  myAddress,
  callbackUrl,
  params,
  blockbeeParams,
  apiKey,
) => {
  const bb = new BlockBee(
    coin,
    myAddress,
    callbackUrl,
    params,
    blockbeeParams,
    apiKey,
  );
  return bb;
};

// const conversion = await BlockBee.getConvert(coin, value, from, apiKey)
const getAddress = async bb => {
  try {
    const address = await bb.getAddress();
    return address;
  } catch (error) {
    console.error('An error occurred while getting the address:', error);
    throw error;
  }
};

const checkLogs = async bb => {
  try {
    const data = await bb.checkLogs();
    return data;
  } catch (error) {
    console.error('An error occurred while checking logs:', error);
    throw error;
  }
};

const driver = async () => {
  const coin = 'polygon_matic';
  const myAddress = ''; // auto gen by BB
  const callbackUrl = 'https://softgreen.sbs/save-payment-blockbee';
  const params = { chatId: '444' };
  const blockbeeParams = {};
  
  const bb = initializeBlockBee(
    coin,
    myAddress,
    callbackUrl,
    params,
    blockbeeParams,
    API_KEY_BLOCKBEE,
  );

  try {
    const address = await getAddress(bb);
    const data = await checkLogs(bb);
    console.log({ address, data });
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

driver()

module.exports = { initializeBlockBee, getAddress, checkLogs, driver };
