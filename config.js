const priceOf = {
  Daily: 0.03,
  Weekly: 0.04,
  Monthly: 0.05,
};

const timeOf = {
  Daily: 86400 * 1000,
  Weekly: 7 * 86400 * 1000,
  Monthly: 30 * 86400 * 1000,
};

const instructionsOfDomainPayment = {
  Crypto: `Deposit crypto at this address 0x12340*******8312 and you will receive a payment confirmation here.`,
  'Bank or Card': `Deposit USD at this bank account and you will receive a payment confirmation here.
accountNumber: 794****519,
accountName: FIN-Bl****LTD,
bankName: wema,
bankCode: 035,
reference: 54e3*****4d9`,
};

const subscriptionOptions = ['Daily', 'Weekly', 'Monthly'];
const paymentOptions = ['Crypto', 'Bank or Card'];
const chooseSubscription = {
  reply_markup: {
    keyboard: [...subscriptionOptions.map(a => [a]), ['Back', 'Cancel']],
  },
};
const cryptoTransferOptions = [
  'btc',
  'eth',
  'ltc',
  'trc20_usdt',
  'bep20_busd',
  'polygon_matic',
];

const adminOptions = {
  reply_markup: {
    keyboard: [['See All Analytics'], ['Kick Out User']],
  },
};

const devOptions = {
  reply_markup: {
    keyboard: [['Back', 'Cancel'], ['Backup Data'], ['Restore Data']],
  },
};

const options = {
  reply_markup: {
    keyboard: [
      ['Shorten a URL'],
      ['View my shortened links'],
      // ['View My Analytics'],
      ['Buy a domain name'],
      ['View my domains'],
      ['Subscribe to plans'],
      ['View my subscribed plan'],
    ],
  },
};

module.exports = {
  chooseSubscription,
  cryptoTransferOptions,
  subscriptionOptions,
  priceOf,
  paymentOptions,
  instructionsOfDomainPayment,
  adminOptions,
  devOptions,
  options,
  timeOf,
};
