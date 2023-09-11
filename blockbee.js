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

const getDepositAddress = async (ticker, webhookParams) => {
  const myAddress = ''; // auto gen by BB
  const callbackUrl = 'https://softgreen.sbs/save-payment-blockbee';
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
  const data = await checkLogs(bb);
  console.log({ address, data });

  return address;
};

const driver = async () => {
  try {
    console.log(await getDepositAddress('ltc', { chatId: '1234' }));
  } catch (error) {
    console.error('An error occurred while getting the address:', error);
  }
};

// driver()

module.exports = { getDepositAddress, getAddress, checkLogs };
