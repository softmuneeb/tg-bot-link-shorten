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
const paymentOptions = ['Crypto', 'Bank ₦aira + Card🌐︎'];
const chooseSubscription = {
  reply_markup: {
    keyboard: [...subscriptionOptions.map(a => [a]), ['Back', 'Cancel']],
  },
};
const cryptoTransferOptions = ['btc', 'eth', 'ltc', 'trc20_usdt', 'bep20_busd', 'polygon_matic'];

const aO = {
  reply_markup: {
    keyboard: [['View Analytics'], ['View Users'], ['Block User'], ['Unblock User']],
  },
};

const dO = {
  reply_markup: {
    keyboard: [['Back', 'Cancel'], ['Backup Data'], ['Restore Data']],
  },
};

const o = {
  reply_markup: {
    keyboard: [
      ['🔗 URL Shortener'],
      ['🔍 View shortened links'],
      ['🌐 Buy domain names'],
      ['👀 View domain names'],
      ['📋 Subscribe here'],
      ['🔍 View subscription plan'],
      ['🛠️ Get support'],
    ],
  },
};

const rem = {
  reply_markup: {
    remove_keyboard: true,
  },
};

const bc = {
  reply_markup: {
    keyboard: [['Back', 'Cancel']],
  },
};

const pay = {
  reply_markup: {
    keyboard: [paymentOptions, ['Back', 'Cancel']],
  },
};
const linkType = {
  reply_markup: {
    keyboard: [
      ['Random Link', 'Custom Link'],
      ['Back', 'Cancel'],
    ],
  },
};

const payBank = url => ({
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: 'Make Payment',
          web_app: {
            url,
          },
        },
      ],
    ],
  },
});

module.exports = {
  payBank,
  linkType,
  pay,
  bc,
  rem,
  chooseSubscription,
  cryptoTransferOptions,
  subscriptionOptions,
  priceOf,
  paymentOptions,
  aO,
  dO,
  o,
  timeOf,
};
