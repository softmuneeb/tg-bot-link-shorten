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
    keyboard: [
      ['View Analytics'],
      ['View Users'],
      ['Block User'],
      ['Unblock User'],
    ],
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
      ['🔗 Shorten a URL'],
      ['🔍 View URL analytics'],
      ['🌐 Buy a domain name'],
      ['👀 View my domains'],
      ['📋 Subscribe to plans'],
      ['🔍 View my subscribed plan'],
      ['🛠️ Support'],
    ],
  },
};

module.exports = {
  chooseSubscription,
  cryptoTransferOptions,
  subscriptionOptions,
  priceOf,
  paymentOptions,
  adminOptions,
  devOptions,
  options,
  timeOf,
};
