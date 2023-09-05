const priceOf = {
  Daily: 1,
  Weekly: 2,
  Monthly: 3,
};

const instructionsOf = {
  'Crypto Deposit': `Deposit crypto at this address 0x12340923810298312098310298312`,
  'Bank Deposit': `Deposit USD at this bank account
accountNumber: 7949313519,
accountName: FIN-Blue Space Technology LTD,
bankName: wema,
bankCode: 035,
reference: 54e3a785-151b-47d1-b31f-5705582414d9`,
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

module.exports = { priceOf, instructionsOf, adminOptions, devOptions, options  };
