const priceOf = {
  Daily: 1,
  Weekly: 2,
  Monthly: 3,
};

const timeOf = {
  Daily: 86400 * 1000,
  Weekly: 7 * 86400 * 1000,
  Monthly: 30 * 86400 * 1000,
};

const instructionsOf = {
  'Crypto Deposit': `Deposit crypto at this address 0x12340*******8312 and you will receive a payment confirmation here.`,
  'Bank Deposit': `Deposit USD at this bank account and you will receive a payment confirmation here.
accountNumber: 794****519,
accountName: FIN-Bl****LTD,
bankName: wema,
bankCode: 035,
reference: 54e3*****4d9`,
};

const instructionsOfDomainPayment = {
  'Crypto Transfer': `Deposit crypto at this address 0x12340*******8312 and you will receive a payment confirmation here.`,
  'Bank Transfer': `Deposit USD at this bank account and you will receive a payment confirmation here.
accountNumber: 794****519,
accountName: FIN-Bl****LTD,
bankName: wema,
bankCode: 035,
reference: 54e3*****4d9`,
};

const adminOptions = {
  reply_markup: {
    keyboard: [['See All Analytics'], ['Kick Out User']],
  },
};

const devOptions = {
  reply_markup: {
    keyboard: [['Backup Data'], ['Restore Data']],
  },
};

const options = {
  reply_markup: {
    keyboard: [
      ['Shorten a URL'],
      ['See my shortened links'],
      ['See My Analytics'],
      ['Buy a domain name'],
      ['See my domains'],
      ['Subscribe to plans'],
      ['See my subscribed plan'],
    ],
  },
};

module.exports = {
  priceOf,
  instructionsOf,
  instructionsOfDomainPayment,
  adminOptions,
  devOptions,
  options,
  timeOf,
};
