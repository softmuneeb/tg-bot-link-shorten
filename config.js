require('dotenv').config();

const PRICE_DAILY = Number(process.env.PRICE_DAILY_SUBSCRIPTION);
const PRICE_WEEKLY = Number(process.env.PRICE_WEEKLY_SUBSCRIPTION);
const PRICE_MONTHLY = Number(process.env.PRICE_MONTHLY_SUBSCRIPTION);

const DAILY_PLAN_FREE_DOMAINS = Number(process.env.DAILY_PLAN_FREE_DOMAINS);
const WEEKLY_PLAN_FREE_DOMAINS = Number(process.env.WEEKLY_PLAN_FREE_DOMAINS);
const MONTHLY_PLAN_FREE_DOMAINS = Number(process.env.MONTHLY_PLAN_FREE_DOMAINS);

const SUPPORT_USERNAME = process.env.SUPPORT_USERNAME;

const priceOf = {
  Daily: PRICE_DAILY,
  Weekly: PRICE_WEEKLY,
  Monthly: PRICE_MONTHLY,
};

const freeDomainsOf = {
  Daily: DAILY_PLAN_FREE_DOMAINS,
  Weekly: WEEKLY_PLAN_FREE_DOMAINS,
  Monthly: MONTHLY_PLAN_FREE_DOMAINS,
};

const timeOf = {
  Daily: 86400 * 1000,
  Weekly: 7 * 86400 * 1000,
  Monthly: 30 * 86400 * 1000,
};

const subscriptionOptions = ['Daily', 'Weekly', 'Monthly'];
const paymentOptions = ['Crypto', 'Bank ₦aira + Card🌐︎'];
const linkOptions = ['Random Link', 'Custom Link'];

const chooseSubscription = {
  parse_mode: 'HTML',
  reply_markup: {
    keyboard: [...subscriptionOptions.map(a => [a]), ['Back', 'Cancel']],
  },
};

const t = {
  chooseSubscription: `<b>Elevate Your Brand with Our Subscription Plans!</b>

- <b>Daily:</b> $${PRICE_DAILY} with ${DAILY_PLAN_FREE_DOMAINS} free ".sbs" domains.
- <b>Weekly:</b> $${PRICE_WEEKLY} with ${WEEKLY_PLAN_FREE_DOMAINS} free ".sbs" domains.
- <b>Monthly:</b> $${PRICE_MONTHLY} with ${MONTHLY_PLAN_FREE_DOMAINS} free ".sbs" domains.

(Exclusive to ".sbs" domains.)`,

  planSubscribed: `Your payment was successful, and you're now subscribed to our {{plan}} plan. Enjoy the convenience of URL shortening with your personal domains. Thank you for choosing us.

Best,
Nomadly Bot`,

  payError: `Payment session not found, please try again or contact support {{support}}. Discover more @Nomadly.`,

  chooseFreeDomainText: `<b>Great News!</b> This domain is available for free with your subscription. Would you like to claim it?`,

  greet: `Keep your eyes on this space! We're gearing up to launch our URL shortening application that will make your links short, sweet, and to the point. Stay tuned for our big reveal!

Support ${SUPPORT_USERNAME} at Telegram.`,
};

const tickerOf = {
  BTC: 'btc',
  ETH: 'eth',
  BCH: 'bch',
  LTC: 'ltc',
  DOGE: 'doge',
  'USDT Tron': 'trc20_usdt',
  BUSD: 'bep20_busd',
  POLYGON: 'polygon_matic',
};
const tickerViews = Object.keys(tickerOf);

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
      ['🔍 View Analytics'],
      ['🌐 Buy Domain Names'],
      ['👀 Manage Domain Names'],
      ['📋 Subscribe Here'],
      ['🔍 My Plan'],
      ['🛠️ Get Support'],
    ],
  },
  disable_web_page_preview: true,
};

const rem = {
  reply_markup: {
    remove_keyboard: true,
  },
};

const bc = {
  parse_mode: 'HTML',
  reply_markup: {
    keyboard: [['Back', 'Cancel']],
  },
  disable_web_page_preview: true,
};
const yes_no = {
  parse_mode: 'HTML',
  reply_markup: {
    keyboard: [
      ['Yes', 'No'],
      ['Back', 'Cancel'],
    ],
  },
  disable_web_page_preview: true,
};

const pay = {
  reply_markup: {
    keyboard: [paymentOptions, ['Back', 'Cancel']],
  },
};
const linkType = {
  reply_markup: {
    keyboard: [linkOptions, ['Back', 'Cancel']],
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

const html = `
        <html>
            <body>
                <h2>Payment Processed Successfully! You can now close this window.</h2>
            </body>
        </html>
    `;

module.exports = {
  yes_no,
  freeDomainsOf,
  t,
  tickerOf,
  tickerViews,
  html,
  linkOptions,
  payBank,
  linkType,
  pay,
  bc,
  rem,
  chooseSubscription,
  subscriptionOptions,
  priceOf,
  paymentOptions,
  aO,
  dO,
  o,
  timeOf,
};
