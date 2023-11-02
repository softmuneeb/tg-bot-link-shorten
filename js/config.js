/* global process */
require('dotenv').config()
const FREE_LINKS = Number(process.env.FREE_LINKS)
const SUPPORT_USERNAME = process.env.SUPPORT_USERNAME
const PRICE_DAILY = Number(process.env.PRICE_DAILY_SUBSCRIPTION)
const PRICE_WEEKLY = Number(process.env.PRICE_WEEKLY_SUBSCRIPTION)
const PRICE_MONTHLY = Number(process.env.PRICE_MONTHLY_SUBSCRIPTION)
const DAILY_PLAN_FREE_DOMAINS = Number(process.env.DAILY_PLAN_FREE_DOMAINS)
const WEEKLY_PLAN_FREE_DOMAINS = Number(process.env.WEEKLY_PLAN_FREE_DOMAINS)
const FREE_LINKS_HOURS = Number(process.env.FREE_LINKS_TIME_SECONDS) / 60 / 60
const MONTHLY_PLAN_FREE_DOMAINS = Number(process.env.MONTHLY_PLAN_FREE_DOMAINS)

// Note: these button labels must not mix with each other, other wise it may mess up bot
const admin = {
  viewAnalytics: '📈 View Analytics',
  viewUsers: '👀 View Users',
  blockUser: '✋ Block User',
  unblockUser: '👌 Unblock User',
  messageUsers: '👋 Message all users',
}
const user = {
  // main keyboard
  urlShortener: '🔗 URL Shortener',
  viewShortLinks: '🔍 View Analytics',
  buyDomainName: '🌐 Buy Domain Names',
  viewDomainNames: '👀 My Domain Names',
  dnsManagement: '😎 DNS Management',
  buyPlan: '📋 Subscribe Here',
  wallet: '💰 Wallet',
  viewPlan: '🔍 My Plan',
  getSupport: '🛠️ Get Support',
}
const u = {
  // other key boards
  deposit: '💵 Deposit',
  withdraw: '💸 Withdraw',

  // wallet
  usd: 'USD',
  ngn: 'NGN',
}

const t = {
  argsErr: `dev: sent wrong args`,
  showDepositNgnInfo:
    ngn => `Please remit ${ngn} NGN by clicking “Make Payment” below. Once the transaction has been confirmed, you will be promptly notified, and your wallet will updated.

Best regards,
Nomadly Bot`,

  askEmail: `Please provide an email for payment confirmation.`,
  askValidAmount: 'Please provide a valid number',
  askValidEmail: 'Please provide a valid email',
  askValidCrypto: 'Please choose a valid crypto currency',
  askValidPayOption: 'Please choose a valid payment option',
  chooseSubscription: `<b>Elevate Your Brand with Our Subscription Plans!</b>

- <b>Daily:</b> $${PRICE_DAILY} with ${DAILY_PLAN_FREE_DOMAINS} free ".sbs" domains.
- <b>Weekly:</b> $${PRICE_WEEKLY} with ${WEEKLY_PLAN_FREE_DOMAINS} free ".sbs" domains.
- <b>Monthly:</b> $${PRICE_MONTHLY} with ${MONTHLY_PLAN_FREE_DOMAINS} free ".sbs" domains.

(Exclusive to ".sbs" domains.)`,

  askCoupon: usd =>
    `The price is $${usd}. Would you like to apply a coupon code? If you have one, please enter it now. Otherwise, you can press 'Skip'.`,
  enterCoupon: `Please enter coupon code:`,
  planPrice: (plan, price) => `Price of ${plan} subscription is $${price} Please choose payment method.`,
  planPriceOff: (plan, price, priceOff) =>
    `Price of ${plan} subscription is now $${priceOff} <s>($${price})</s> Please choose payment method.`,

  domainPrice: (domain, price) => `Price of ${domain} is ${price} USD. Choose payment method.`,
  domainPriceOff: (domain, price, priceOff) =>
    `Price of ${domain} is now $${priceOff} <s>($${price})</s> Choose payment method.`,

  couponInvalid: `Invalid coupon code, Please enter coupon code again:`,

  errorPaidLessPrice: `Sent price less than needed`,
  planSubscribed: `Your payment was successful, and you're now subscribed to our {{plan}} plan. Enjoy the convenience of URL shortening with your personal domains. Thank you for choosing us.

Best,
Nomadly Bot`,

  payError: `Payment session not found, please try again or contact support ${SUPPORT_USERNAME}. Discover more @Nomadly.`,

  chooseFreeDomainText: `<b>Great News!</b> This domain is available for free with your subscription. Would you like to claim it?`,

  chooseDomainToBuy: text =>
    `<b>Claim Your Corner of the Web!</b>  Please share the domain name you wish to purchase, like "abcpay.com".${text}`,

  blockUser: `Please share the username of the user that needs to be blocked.`,
  unblockUser: `Please share the username of the user that needs to be unblocked.`,
  blockedUser: `You are currently blocked from using the bot. Please contact support ${SUPPORT_USERNAME}. Discover more @Nomadly.`,

  greet: `Keep your eyes on this space! We're gearing up to launch our URL shortening application that will make your links short, sweet, and to the point. Stay tuned for our big reveal!

Support ${SUPPORT_USERNAME} at Telegram.`,

  linkExpired: `Your Nomadly trial has ended and your short link is deactivated. We invite you to subscribe to maintain access to our URL service and free domain names. Choose a suitable plan and follow the instructions to subscribe. Please Contact us for any queries.  
Best,  
Nomadly Team
Discover more: t.me/nomadly`,

  successPayment: `Payment Processed Successfully! You can now close this window.`,

  welcome: `Thank you for choosing the URL Shortener Bot! Please choose an option:`,

  welcomeFreeTrial: `Welcome to Nomadly! Enjoy our one-time free trial - shorten ${FREE_LINKS} URLs, active for ${FREE_LINKS_HOURS} hours. Experience the Nomadly difference!`,

  unknownCommand: `Command not found. Press /start or Please contact support ${SUPPORT_USERNAME}. Discover more @Nomadly.`,

  support: `Please contact support ${SUPPORT_USERNAME}. Discover more @Nomadly.`,

  dnsPropagated: `DNS Propagation for {{domain}} is completed for unlimited URL Shortening.`,

  dnsNotPropagated: `DNS propagation for {{domain}} is in progress and you will be updated once it completes. ✅`,

  domainBought: `Your domain {{domain}} is now linked to your account while DNS propagates. You will be updated automatically about the status momentarily.🚀`,

  chooseDomainToManage: `Please select a domain if you wish to manage its DNS settings.`,

  chooseDomainWithShortener: `Please select the domain you would like to connect with your shortened link.`,

  viewDnsRecords: `Here are DNS Records for {{domain}}`,

  addDns: 'Add DNS Record',
  updateDns: 'Update DNS Record',
  deleteDns: 'Delete DNS Record',
  addDnsTxt: 'Please select record type you want to add:',
  updateDnsTxt: 'Please type the record id you wish to update. i.e 3',
  deleteDnsTxt: 'Please type the record id you wish to delete. i.e 3',
  confirmDeleteDnsTxt: 'Are you sure? Yes or No',
  a: 'A Record',
  cname: 'CNAME Record',
  ns: 'NS Record',
  'A Record': 'A',
  'CNAME Record': 'CNAME',
  'NS Record': 'NS',
  askDnsContent: {
    A: `Please provide A record. i.e, 108.0.56.98`,
    'A Record': `Please provide A record. i.e, 108.0.56.98`,

    CNAME: `Please provide CNAME record. i.e, abc.hello.org`,
    'CNAME Record': `Please provide CNAME record. i.e, abc.hello.org`,

    NS: `A new NS record will be added to the current ones. To update a record, please choose "Update DNS Record".`,
    'NS Record': `A new NS record will be added to the current ones. To update a record, please choose "Update DNS Record".`,
  },
  askUpdateDnsContent: {
    A: `Please provide A record. i.e, 108.0.56.98`,
    'A Record': `Please provide A record. i.e, 108.0.56.98`,

    CNAME: `Please provide CNAME record. i.e, abc.hello.org`,
    'CNAME Record': `Please provide CNAME record. i.e, abc.hello.org`,

    NS: `A new NS record will be updated for the selected id. To Add a new record, please choose “Add DNS Record”`,
    'NS Record': `A new NS record will be updated for the selected id. To Add a new record, please choose “Add DNS Record”`,
  },

  dnsRecordSaved: `Record Added`,
  dnsRecordDeleted: `Record Deleted`,
  dnsRecordUpdated: `Record Updated`,

  provideLink: 'Please provide a valid URL. e.g https://google.com',

  comingSoonWithdraw: `Withdraw coming soon. Contact support ${SUPPORT_USERNAME}. Discover more @Nomadly.`,

  selectCurrencyToDeposit: `Please select currency to deposit USD / NGN`,

  depositNGN: `Please enter NGN Amount:`,
  askEmailForNGN: `Please provide an email for payment confirmation`,

  depositUSD: `Please enter USD Amount, note that minium value is $6:`,
  selectCryptoToDeposit: `Please choose a crypto currency:`,

  'bank-pay-plan': (
    priceNGN,
    plan,
  ) => `Please remit ${priceNGN} NGN by clicking “Make Payment” below. Once the transaction has been confirmed, you will be promptly notified, and your ${plan} plan will be seamlessly activated.

Best regards,
Nomadly Bot`,

  bankPayDomain: (
    priceNGN,
    domain,
  ) => `Please remit ${priceNGN} NGN by clicking “Make Payment” below. Once the transaction has been confirmed, you will be promptly notified, and your ${domain} domain will be seamlessly activated.

Best regards,
Nomadly Bot`,

  showDepositCryptoInfoPlan: (priceCrypto, tickerView, address, plan) =>
    `Please remit ${priceCrypto} ${tickerView} to\n\n<code>${address}</code>
    
Please note, crypto transactions can take up to 30 minutes to complete. Once the transaction has been confirmed, you will be promptly notified, and your ${plan} plan will be seamlessly activated.
    
Best regards,
Nomadly Bot`,

  showDepositCryptoInfoDomain: (priceCrypto, tickerView, address, domain) =>
    `Please remit ${priceCrypto} ${tickerView} to\n\n<code>${address}</code>
    
Please note, crypto transactions can take up to 30 minutes to complete. Once the transaction has been confirmed, you will be promptly notified, and your ${domain} domain will be seamlessly activated.
    
Best regards,
Nomadly Bot`,

  showDepositCryptoInfo: (priceCrypto, tickerView, address) =>
    `Please remit ${priceCrypto} ${tickerView} to\n\n<code>${address}</code>

Please note, crypto transactions can take up to 30 minutes to complete. Once the transaction has been confirmed, you will be promptly notified, and your wallet will be updated.

Best regards,
Nomadly Bot`,
  confirmationDepositMoney: (
    amount,
    usd,
  ) => `Your payment of ${amount} ($${usd}) is processed. Thank you for choosing us.
Best,
Nomadly Bot`,

  showWallet: (usd, ngn) => `Wallet Balance:
$${Number(usd).toFixed(2)}
${ngn} NGN`,

  wallet: (usd, ngn) => `Wallet Balance:
$${Number(usd).toFixed(2)}
${ngn} NGN

Select wallet option:`,
  walletSelectCurrency: (usd, ngn) => `Please select currency to pay from your Wallet Balance:
${Number(usd).toFixed(2)} USD
${ngn} NGN`,

  walletBalanceLow: `Please top up wallet to continue`,
}

const tickerOf = {
  BTC: 'btc',
  LTC: 'ltc',
  ETH: 'eth',
  'USDT (TRon)': 'trc20_usdt',
  'USDT (ERC20)': 'erc20_usdt',
  DOGE: 'doge',
}

/////////////////////////////////////////////////////////////////////////////////////
const _bc = ['Back', 'Cancel']

const payIn = {
  crypto: 'Crypto',
  bank: 'Bank ₦aira + Card🌐︎',
  wallet: '💰 Wallet',
}

const tickerViews = Object.keys(tickerOf)
const reverseObject = o => Object.fromEntries(Object.entries(o).map(([key, val]) => [val, key]))
const tickerViewOf = reverseObject(tickerOf)
const k = {
  of: list => ({
    reply_markup: {
      keyboard: [...list.map(a => [a]), _bc],
    },
  }),

  wallet: {
    reply_markup: {
      keyboard: [[u.deposit], [u.withdraw], _bc],
    },
  },

  pay: {
    reply_markup: {
      keyboard: [Object.values(payIn), _bc],
    },
    parse_mode: 'HTML',
  },
}

const adminKeyboard = {
  reply_markup: {
    keyboard: Object.values(admin).map(b => [b]),
  },
}

const userKeyboard = {
  reply_markup: {
    keyboard: Object.values(user).map(b => [b]),
  },
  parse_mode: 'HTML',
  disable_web_page_preview: true,
}

const priceOf = {
  Daily: PRICE_DAILY,
  Weekly: PRICE_WEEKLY,
  Monthly: PRICE_MONTHLY,
}

const freeDomainsOf = {
  Daily: DAILY_PLAN_FREE_DOMAINS,
  Weekly: WEEKLY_PLAN_FREE_DOMAINS,
  Monthly: MONTHLY_PLAN_FREE_DOMAINS,
}

const timeOf = {
  Daily: 86400 * 1000,
  Weekly: 7 * 86400 * 1000,
  Monthly: 30 * 86400 * 1000,
}

const planOptions = ['Daily', 'Weekly', 'Monthly']

const linkOptions = ['Random Link', 'Custom Link']

const chooseSubscription = {
  parse_mode: 'HTML',
  reply_markup: {
    keyboard: [...planOptions.map(a => [a]), _bc],
  },
}

const dO = {
  reply_markup: {
    keyboard: [_bc, ['Backup Data'], ['Restore Data']],
  },
}

const rem = {
  reply_markup: {
    remove_keyboard: true,
  },
}

const bc = {
  parse_mode: 'HTML',
  reply_markup: {
    keyboard: [_bc],
  },
  disable_web_page_preview: true,
}

const dns = {
  parse_mode: 'HTML',
  reply_markup: {
    keyboard: [[t.addDns], [t.updateDns], [t.deleteDns], _bc],
  },
  disable_web_page_preview: true,
}
const dnsRecordType = {
  parse_mode: 'HTML',
  reply_markup: {
    keyboard: [[t.cname], [t.ns], [t.a], _bc],
  },
  disable_web_page_preview: true,
}
const yes_no = {
  parse_mode: 'HTML',
  reply_markup: {
    keyboard: [['Yes', 'No'], _bc],
  },
  disable_web_page_preview: true,
}

const linkType = {
  reply_markup: {
    keyboard: [linkOptions, _bc],
  },
}

const show = domains => ({
  reply_markup: {
    keyboard: [...domains.map(d => [d]), _bc],
  },
})

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
})

const html = (text = t.successPayment) => {
  return `
        <html>
            <body>
                <p style="font-family: 'system-ui';" >${text}</p>
            </body>
        </html>
    `
}

module.exports = {
  k,
  t,
  u,
  dO,
  bc,
  dns,
  rem,
  user,
  show,
  html,
  payIn,
  admin,
  yes_no,
  timeOf,
  payBank,
  priceOf,
  tickerOf,
  linkType,
  tickerViews,
  linkOptions,
  tickerViewOf,
  dnsRecordType,
  freeDomainsOf,
  o: userKeyboard,
  aO: adminKeyboard,
  chooseSubscription,
  planOptions,
}
