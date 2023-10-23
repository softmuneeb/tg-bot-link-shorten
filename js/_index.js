const { getRegisteredDomainNames } = require('./cr-domain-purchased-get.js');
const { MongoClient } = require('mongodb');
const TelegramBot = require('node-telegram-bot-api');
const { createCheckout } = require('./pay-fincra.js');
const { customAlphabet } = require('nanoid');
const { log } = require('console');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');
const {
  priceOf,
  aO,
  o,
  paymentOptions,
  subscriptionOptions,
  tickerViews,
  tickerOf,
  timeOf,
  chooseSubscription,
  rem,
  pay,
  bc,
  linkType,
  payBank,
  linkOptions,
  html,
  t,
  freeDomainsOf,
  yes_no,
  show,
  dns,
  dnsRecordType,
} = require('./config.js');
const {
  isValidUrl,
  isDeveloper,
  isAdmin,
  convertUSDToNaira,
  today,
  week,
  month,
  year,
  isValidEmail,
  regularCheckDns,
} = require('./utils.js');
const { getCryptoDepositAddress, convertUSDToCrypto } = require('./pay-blockbee.js');
const { saveDomainInServer } = require('./rl-save-domain-in-server.js');
const { saveServerInDomain } = require('./cr-dns-record-add.js');
const { buyDomainOnline } = require('./cr-domain-register.js');
const { get, set, del, increment, getAll, decrement } = require('./db.js');
const { checkDomainPriceOnline } = require('./cr-domain-price-get.js');
const viewDNSRecords = require('./cr-view-dns-records.js');
const { deleteDNSRecord } = require('./cr-dns-record-del.js');
const { updateDNSRecord } = require('./cr-dns-record-update.js');

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 5);
process.env['NTBA_FIX_350'] = 1;
const DB_NAME = process.env.DB_NAME;
const SELF_URL = process.env.SELF_URL;
const SUPPORT_USERNAME = process.env.SUPPORT_USERNAME;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_DEV_CHAT_ID = process.env.TELEGRAM_DEV_CHAT_ID;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const TELEGRAM_DOMAINS_SHOW_CHAT_ID = Number(process.env.TELEGRAM_DOMAINS_SHOW_CHAT_ID);
const FREE_LINKS = Number(process.env.FREE_LINKS);
const FREE_LINKS_TIME_SECONDS = Number(process.env.FREE_LINKS_TIME_SECONDS) * 1000; // to milliseconds

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
log('Bot is running...');

// variables to implement core functionality
let state = {};
let linksOf = {};
let fullUrlOf = {};
let domainsOf = {};
let chatIdBlocked = {};
let planEndingTime = {};
let chatIdOfPayment = {};
let totalShortLinks = {};
let freeShortLinksOf = {};
let freeDomainNamesAvailableFor = {};

// variables to view system information
let payments = {};
let clicksOf = {};
let clicksOn = {};
let chatIdOf = {};
let nameOf = {};
let planOf = {};

let adminDomains = [];
let connect_reseller_working = false;
// restoreData();
// manually data add here or call methods

let db;

const client = new MongoClient(process.env.MONGO_URL);

client
  .connect()
  .then(async () => {
    db = client.db(DB_NAME);

    // variables to implement core functionality
    state = db.collection('state');
    linksOf = db.collection('linksOf');
    expiryOf = db.collection('expiryOf');
    fullUrlOf = db.collection('fullUrlOf');
    domainsOf = db.collection('domainsOf');
    chatIdBlocked = db.collection('chatIdBlocked');
    planEndingTime = db.collection('planEndingTime');
    chatIdOfPayment = db.collection('chatIdOfPayment');
    totalShortLinks = db.collection('totalShortLinks');
    freeShortLinksOf = db.collection('freeShortLinksOf');
    freeDomainNamesAvailableFor = db.collection('freeDomainNamesAvailableFor');

    // variables to view system information
    payments = db.collection('payments');
    clicksOf = db.collection('clicksOf');
    clicksOn = db.collection('clicksOn');
    chatIdOf = db.collection('chatIdOf');
    nameOf = db.collection('nameOf');
    planOf = db.collection('planOf');
    log('DB Connected lala');

    set(freeShortLinksOf, 6687923716, FREE_LINKS);
    set(freeShortLinksOf, 1531772316, FREE_LINKS);
    adminDomains = await getPurchasedDomains(TELEGRAM_DOMAINS_SHOW_CHAT_ID);

    // Seed Code // Code to allocate subscriptions, domains and resources to admins, developers, testers
    // const chatId = 5168006768;
    // const plan = 'Daily';
    // set(planOf, chatId, plan);
    // set(planEndingTime, chatId, Date.now() + timeOf[plan]);
    // increment(freeShortLinksOf, chatId, 2); // freeShortLinksForNewUser
    // set(freeDomainNamesAvailableFor, chatId, freeDomainsOf[plan]);
    // bot.sendMessage(chatId, t.planSubscribed.replace('{{plan}}', plan)).catch(() => {});
  })
  .catch(err => log('DB Connected', err, err?.message));

bot.on('message', async msg => {
  const chatId = msg?.chat?.id;
  const message = msg?.text;
  log('command\t' + message + '\t' + chatId + '\t' + msg?.from?.username);

  tryConnectReseller(); // our ip may change on railway hosting so make sure its correct

  if (!db) {
    bot.sendMessage(chatId, 'Bot starting, please wait');
    return;
  }

  if (!connect_reseller_working) {
    await tryConnectReseller();
    if (!connect_reseller_working) {
      bot.sendMessage(chatId, 'Bot starting, please wait');
      return;
    }
  }

  const nameOfChatId = await get(nameOf, chatId);
  const username = nameOfChatId || msg?.from?.username || nanoid();

  const blocked = await get(chatIdBlocked, chatId);
  if (blocked) {
    bot.sendMessage(
      chatId,
      `You are currently blocked from using the bot. Please contact support ${SUPPORT_USERNAME}. Discover more @Nomadly.`,
      rem,
    );
    return;
  }

  if (!nameOfChatId) {
    set(nameOf, chatId, username);
    set(chatIdOf, username, chatId);
  }

  const freeLinks = await get(freeShortLinksOf, chatId);
  if (freeLinks === null || freeLinks === undefined) {
    set(freeShortLinksOf, chatId, FREE_LINKS);
  }

  const info = await get(state, chatId);
  const action = info?.action;

  const firstSteps = [
    'block-user',
    'unblock-user',
    'choose-url-to-shorten',
    'choose-domain-to-buy',
    'choose-subscription',
    'choose-domain-to-manage',
  ];
  const goto = {
    'domain-name-payment': (domain, price) => {
      bot.sendMessage(chatId, `Price of ${domain} is ${price} USD. Choose payment method.`, pay);
      set(state, chatId, 'action', 'domain-name-payment');
    },
    'choose-domain-to-buy': async () => {
      let text = ``;
      if (await isSubscribed(chatId)) {
        const plan = await get(planOf, chatId);
        const available = (await get(freeDomainNamesAvailableFor, chatId)) || 0;
        const s = available === 1 ? '' : 's';
        text =
          available <= 0
            ? ``
            : ` Remember, your ${plan} plan includes ${available} free ".sbs" domain${s}. Let's get your domain today!`;
      }
      set(state, chatId, 'action', 'choose-domain-to-buy');
      bot.sendMessage(
        chatId,
        `<b>Claim Your Corner of the Web!</b>  Please share the domain name you wish to purchase, like "abcpay.com".${text}`,
        bc,
      );
    },
    'subscription-payment': plan => {
      bot.sendMessage(chatId, `Price of ${plan} subscription is ${priceOf[plan]} USD. Choose payment method.`, pay);
      set(state, chatId, 'action', 'subscription-payment');
    },
    'choose-subscription': () => {
      set(state, chatId, 'action', 'choose-subscription');
      bot.sendMessage(chatId, t.chooseSubscription, chooseSubscription);
    },
    'choose-url-to-shorten': async () => {
      set(state, chatId, 'action', 'choose-url-to-shorten');
      const m = 'Kindly share the URL that you would like shortened and analyzed. e.g https://cnn.com';
      bot.sendMessage(chatId, m, bc);
      adminDomains = await getPurchasedDomains(TELEGRAM_DOMAINS_SHOW_CHAT_ID);
    },
    'choose-domain-with-shorten': domains => {
      bot.sendMessage(chatId, t.chooseDomainWithShortener, show(domains));
      set(state, chatId, 'action', 'choose-domain-with-shorten');
    },
    'choose-link-type': () => {
      bot.sendMessage(chatId, `Choose link type:`, linkType);
      set(state, chatId, 'action', 'choose-link-type');
    },
    'get-free-domain': () => {
      bot.sendMessage(chatId, t.chooseFreeDomainText, yes_no);
      set(state, chatId, 'action', 'get-free-domain');
    },

    'choose-domain-to-manage': async () => {
      const domains = await getPurchasedDomains(chatId);
      bot.sendMessage(chatId, t.chooseDomainToManage, show(domains));
      set(state, chatId, 'action', 'choose-domain-to-manage');
    },

    'select-dns-record-id-to-delete': () => {
      set(state, chatId, 'action', 'select-dns-record-id-to-delete');
      bot.sendMessage(chatId, t.deleteDnsTxt, bc);
    },

    'choose-dns-action': async domain => {
      const detail = await viewDNSRecords(domain);

      const toSave = detail.map(({ dnszoneID, dnszoneRecordID, recordType, domainNameId, nsId, recordContent }) => ({
        dnszoneID,
        dnszoneRecordID,
        recordType,
        domainNameId,
        nsId,
        recordContent,
      }));
      const viewDnsRecords = detail
        .map(
          ({ recordType, recordContent, nsId }, i) =>
            `${i + 1}. \t${recordType === 'NS' ? recordType + nsId : recordType}\t${recordContent}`,
        )
        .join('\n');

      bot.sendMessage(chatId, `${t.viewDnsRecords.replace('{{domain}}', domain)}\n${viewDnsRecords}`, dns);
      set(state, chatId, 'action', 'choose-dns-action');
      set(state, chatId, 'domainToManage', domain);
      set(state, chatId, 'dnsRecords', toSave);
    },

    'type-dns-record-data-to-add': recordType => {
      bot.sendMessage(chatId, t.askDnsContent[recordType], bc);
      set(state, chatId, 'recordType', recordType);
      set(state, chatId, 'action', 'type-dns-record-data-to-add');
    },

    'select-dns-record-id-to-update': () => {
      bot.sendMessage(chatId, t.updateDnsTxt, bc);
      set(state, chatId, 'action', 'select-dns-record-id-to-update');
    },
    'type-dns-record-data-to-update': (id, recordType) => {
      set(state, chatId, 'dnsRecordIdToUpdate', id);
      set(state, chatId, 'action', 'type-dns-record-data-to-update');
      bot.sendMessage(chatId, t.askDnsContent[recordType]);
    },

    'select-dns-record-type-to-add': () => {
      set(state, chatId, 'action', 'select-dns-record-type-to-add');
      bot.sendMessage(chatId, t.addDnsTxt, dnsRecordType);
    },
  };

  if (message === '/start') {
    set(state, chatId, 'action', 'none');

    if (isAdmin(chatId)) {
      bot.sendMessage(chatId, 'Hello, Admin! Please select an option:', aO);
      return;
    }

    const freeLinks = await get(freeShortLinksOf, chatId);
    if (freeLinks === undefined || freeLinks > 0) {
      bot.sendMessage(chatId, t.welcomeFreeTrial, o);
      return;
    }
    bot.sendMessage(chatId, t.welcome, o);
    return;
  }
  //
  if (message.toLowerCase() === 'cancel' || (firstSteps.includes(action) && message === 'Back')) {
    set(state, chatId, 'action', 'none');
    bot.sendMessage(chatId, `User has Pressed ${message} Button.`, isAdmin(chatId) ? aO : o);
    return;
  }
  //
  if (message === 'Block User') {
    if (!isAdmin(chatId)) {
      bot.sendMessage(chatId, 'Apologies, but you do not have the authorization to access this content.');
      return;
    }
    bot.sendMessage(chatId, 'Please share the username of the user that needs to be blocked.', bc);
    set(state, chatId, 'action', 'block-user');
    return;
  }
  if (action === 'block-user') {
    const userToBlock = message;
    const chatIdToBlock = await get(chatIdOf, userToBlock);
    if (!chatIdToBlock) {
      bot.sendMessage(chatId, `User ${userToBlock} not found`, bc);
      return;
    }
    set(chatIdBlocked, chatIdToBlock, true);
    bot.sendMessage(chatId, `User ${userToBlock} has been blocked.`, aO);
    set(state, chatId, 'action', 'none');
    return;
  }
  //
  if (message === 'Unblock User') {
    if (!isAdmin(chatId)) {
      bot.sendMessage(chatId, 'Apologies, but you do not have the authorization to access this content.');
      return;
    }
    bot.sendMessage(chatId, 'Please share the username of the user that needs to be unblocked.', bc);
    set(state, chatId, 'action', 'unblock-user');
    return;
  }
  if (action === 'unblock-user') {
    const userToUnblock = message;
    const chatIdToUnblock = await get(chatIdOf, userToUnblock);
    if (!chatIdToUnblock) {
      bot.sendMessage(chatId, `User ${userToUnblock} not found`, bc);
      return;
    }
    set(chatIdBlocked, chatIdToUnblock, false);
    bot.sendMessage(chatId, `User ${userToUnblock} has been unblocked.`, aO);
    set(state, chatId, 'action', 'none');
    return;
  }
  //
  //
  if (message === '🔗 URL Shortener') {
    if (!((await freeLinksAvailable(chatId)) || (await isSubscribed(chatId))))
      return bot.sendMessage(chatId, '📋 Subscribe first');

    return goto['choose-url-to-shorten']();
  }
  if (action === 'choose-url-to-shorten') {
    if (!isValidUrl(message)) return bot.sendMessage(chatId, 'Please provide a valid URL. e.g https://google.com', bc);

    set(state, chatId, 'url', message);

    const domains = await getPurchasedDomains(chatId);
    return goto['choose-domain-with-shorten']([...domains, ...adminDomains]);
  }
  if (action === 'choose-domain-with-shorten') {
    if (message === 'Back') return goto['choose-url-to-shorten']();

    const domain = message.toLowerCase();
    const domains = await getPurchasedDomains(chatId);
    if (!(domains.includes(domain) || adminDomains.includes(domain))) {
      return bot.sendMessage(chatId, 'Please choose a valid domain', bc);
    }
    set(state, chatId, 'selectedDomain', message);
    return goto['choose-link-type']();
  }
  if (action === 'choose-link-type') {
    if (message === 'Back') return goto['choose-domain-with-shorten'](await getPurchasedDomains(chatId));

    if (!linkOptions.includes(message)) return bot.sendMessage(chatId, `?`);

    if (message === 'Custom Link') {
      set(state, chatId, 'action', 'shorten-custom');
      return bot.sendMessage(chatId, `Please tell your us preferred short link extension: e.g payer`, bc);
    }

    // Random Link
    const url = info?.url;
    const domain = info?.selectedDomain;
    const shortUrl = domain + '/' + nanoid();
    if (await get(fullUrlOf, shortUrl)) {
      bot.sendMessage(chatId, `Link already exists. Please type 'ok' to try another.`);
      return;
    }

    const shortUrlSanitized = shortUrl.replace('.', '@');
    increment(totalShortLinks);
    set(state, chatId, 'action', 'none');
    set(fullUrlOf, shortUrlSanitized, url);
    set(linksOf, chatId, shortUrlSanitized, url);
    bot.sendMessage(chatId, `Your shortened URL is: ${shortUrl}`, o);
    if (adminDomains.includes(domain)) {
      decrement(freeShortLinksOf, chatId);
      set(expiryOf, shortUrlSanitized, Date.now() + FREE_LINKS_TIME_SECONDS);
    }
    return;
  }
  if (action === 'shorten-custom') {
    if (message === 'Back') {
      goto['choose-link-type']();
    }

    const url = info?.url;
    const domain = info?.selectedDomain;
    const shortUrl = domain + '/' + message;

    if (!isValidUrl('https://' + shortUrl)) return bot.sendMessage(chatId, t.provideLink);
    if (await get(fullUrlOf, shortUrl)) return bot.sendMessage(chatId, `Link already exists. Please try another.`);

    const shortUrlSanitized = shortUrl.replace('.', '@');
    increment(totalShortLinks);
    set(state, chatId, 'action', 'none');
    set(fullUrlOf, shortUrlSanitized, url);
    set(linksOf, chatId, shortUrlSanitized, url);
    bot.sendMessage(chatId, `Your shortened URL is: ${shortUrl}`, o);
    if (adminDomains.includes(domain)) {
      decrement(freeShortLinksOf, chatId);
      set(expiryOf, shortUrlSanitized, Date.now() + FREE_LINKS_TIME_SECONDS);
    }
    return;
  }
  //
  //
  if (message === '🌐 Buy Domain Names') {
    goto['choose-domain-to-buy']();
    return;
  }
  if (action === 'choose-domain-to-buy') {
    const domain = message.toLowerCase();
    const domainRegex = /^(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/;

    if (!domainRegex.test(domain)) {
      bot.sendMessage(chatId, 'Domain name is invalid. Please try another domain name.');
      return;
    }

    const { available, price, originalPrice } = await checkDomainPriceOnline(domain);

    if (!available) {
      bot.sendMessage(chatId, 'Domain is not available. Please try another domain name.', rem);
      return;
    }

    set(state, chatId, 'chosenDomainForPayment', domain);

    if (originalPrice <= 2 && (await isSubscribed(chatId))) {
      const available = (await get(freeDomainNamesAvailableFor, chatId)) || 0;
      if (available > 0) {
        goto['get-free-domain']();
        return;
      }
    }

    set(state, chatId, 'chosenDomainPrice', price);
    goto['domain-name-payment'](domain, price);
    return;
  }
  if (action === 'domain-name-payment') {
    if (message === 'Back') {
      goto['choose-domain-to-buy']();
      return;
    }

    const paymentOption = message;

    if (!paymentOptions.includes(paymentOption)) {
      bot.sendMessage(chatId, 'Please choose a valid payment option');
      return;
    }

    if (paymentOption === 'Crypto') {
      bot.sendMessage(chatId, `Please choose a crypto currency`, {
        reply_markup: {
          keyboard: [...tickerViews.map(a => [a]), ['Back', 'Cancel']],
        },
      });
      set(state, chatId, 'action', 'crypto-transfer-payment-domain');
      return;
    }

    bot.sendMessage(chatId, `Please provide an email for payment confirmation.`, bc);
    set(state, chatId, 'action', 'bank-transfer-payment-domain');
    return;
  }
  if (action === 'bank-transfer-payment-domain') {
    const price = info?.chosenDomainPrice;
    const domain = info?.chosenDomainForPayment;
    if (message === 'Back') {
      goto['domain-name-payment'](domain, price);
      return;
    }
    const email = message;

    if (!isValidEmail(email)) {
      bot.sendMessage(chatId, 'Please provide a valid email');
      return;
    }

    const priceNGN = Number(await convertUSDToNaira(price));
    const ref = nanoid();
    log({ ref });
    set(chatIdOfPayment, ref, chatId);
    const { url, error } = await createCheckout(priceNGN, `/bank-payment-for-domain?a=b&ref=${ref}&`, email, username);
    if (error) {
      bot.sendMessage(chatId, error, o);
      set(state, chatId, 'action', 'none');
      return;
    }

    bot.sendMessage(
      chatId,
      `Please remit ${priceNGN} NGN by clicking “Make Payment” below. Once the transaction has been confirmed, you will be promptly notified, and your ${domain} will be seamlessly activated.

Best regards,
Nomadly Bot`,
      payBank(url),
    );
    bot.sendMessage(chatId, `Bank ₦aira + Card 🌐︎`, o);
    set(state, chatId, 'action', 'none');
    return;
  }
  if (action === 'crypto-transfer-payment-domain') {
    const priceUSD = info?.chosenDomainPrice;
    const domain = info?.chosenDomainForPayment;

    if (message === 'Back') {
      goto['domain-name-payment'](domain, priceUSD);
      return;
    }

    const tickerView = message;
    const ticker = tickerOf[tickerView];
    if (!ticker) {
      bot.sendMessage(chatId, 'Please choose a valid crypto currency');
      return;
    }

    const ref = nanoid();
    log({ ref });
    const { address, bb } = await getCryptoDepositAddress(
      ticker,
      chatId,
      SELF_URL,
      `/crypto-payment-for-domain?a=b&ref=${ref}&`,
    );

    set(chatIdOfPayment, ref, chatId);

    const priceCrypto = await convertUSDToCrypto(priceUSD, ticker);
    set(state, chatId, 'cryptoPaymentSession', {
      priceCrypto,
      ticker,
      ref,
    });

    const text = `Please remit ${priceCrypto} ${tickerView} to\n\n<code>${address}</code>

Please note, crypto transactions can take up to 30 minutes to complete. Once the transaction has been confirmed, you will be promptly notified, and your ${domain} will be seamlessly activated.

Best regards,
Nomadly Bot`;

    bot.sendMessage(chatId, text, {
      ...o,
      parse_mode: 'HTML',
    });
    set(state, chatId, 'action', 'none');

    // send QR Code Image
    const qrCode = await bb.getQrcode();
    const buffer = Buffer.from(qrCode?.qr_code, 'base64');
    fs.writeFileSync('image.png', buffer);
    bot
      .sendPhoto(chatId, 'image.png', {
        caption: 'Here is your QR code!',
      })
      .then(() => fs.unlinkSync('image.png'))
      .catch(log);
    return;
  }
  if (action === 'get-free-domain') {
    if (message === 'Back' || message === 'No') {
      goto['choose-domain-to-buy']();
      return;
    }
    if (message !== 'Yes') {
      bot.sendMessage(chatId, `?`);
      return;
    }

    set(state, chatId, 'action', 'none');

    const domain = info?.chosenDomainForPayment;
    const error = await buyDomainFullProcess(chatId, domain);
    if (!error) decrement(freeDomainNamesAvailableFor, chatId);

    return;
  }
  //
  //
  if (message === '📋 Subscribe Here') {
    if (await isSubscribed(chatId)) {
      bot.sendMessage(chatId, 'You are currently enrolled in a subscription plan.');
      return;
    }
    goto['choose-subscription']();
    return;
  }
  if (action === 'choose-subscription') {
    const plan = message;

    if (!subscriptionOptions.includes(plan)) {
      bot.sendMessage(chatId, 'Please choose a valid plan', chooseSubscription);
      return;
    }

    set(state, chatId, 'chosenPlanForPayment', plan);

    goto['subscription-payment'](plan);

    return;
  }
  if (action === 'subscription-payment') {
    if (message === 'Back') {
      goto['choose-subscription']();
      return;
    }
    const paymentOption = message;

    if (!paymentOptions.includes(paymentOption)) {
      bot.sendMessage(chatId, 'Please choose a valid payment option');
      return;
    }

    if (paymentOption === 'Bank ₦aira + Card🌐︎') {
      bot.sendMessage(chatId, `Please provide an email for payment confirmation.`, bc);
      set(state, chatId, 'action', 'bank-transfer-payment-subscription');
      return;
    }

    bot.sendMessage(chatId, `Please choose a crypto currency`, {
      reply_markup: {
        keyboard: [...tickerViews.map(a => [a]), ['Back', 'Cancel']],
      },
    });
    set(state, chatId, 'action', 'crypto-transfer-payment');
    return;
  }
  if (action === 'bank-transfer-payment-subscription') {
    const plan = info?.chosenPlanForPayment;
    if (message === 'Back') {
      goto['subscription-payment'](plan);
      return;
    }
    const email = message;

    if (!isValidEmail(email)) {
      bot.sendMessage(chatId, 'Please provide a valid email');
      return;
    }

    const priceNGN = Number(await convertUSDToNaira(priceOf[plan]));
    const ref = nanoid();
    log({ ref });
    set(chatIdOfPayment, ref, chatId);
    const { url, error } = await createCheckout(priceNGN, `/bank-payment-for-plan?a=b&ref=${ref}&`, email, username);
    if (error) {
      bot.sendMessage(chatId, error, o);
      set(state, chatId, 'action', 'none');
      return;
    }

    bot.sendMessage(
      chatId,
      `Please remit ${priceNGN} NGN by clicking “Make Payment” below. Once the transaction has been confirmed, you will be promptly notified, and your ${plan} plan will be seamlessly activated.

Best regards,
Nomadly Bot`,
      payBank(url),
    );
    bot.sendMessage(chatId, `Bank ₦aira + Card 🌐︎`, o);
    set(state, chatId, 'action', 'none');
    return;
  }
  if (action === 'crypto-transfer-payment') {
    const plan = info?.chosenPlanForPayment;
    const priceUSD = priceOf[plan];

    if (message === 'Back') {
      goto['subscription-payment'](plan);
      return;
    }

    const tickerView = message;
    const ticker = tickerOf[tickerView];
    if (!ticker) {
      bot.sendMessage(chatId, 'Please choose a valid crypto currency');
      return;
    }

    const priceCrypto = await convertUSDToCrypto(priceUSD, ticker);

    const ref = nanoid();
    log({ ref });
    const { address, bb } = await getCryptoDepositAddress(
      ticker,
      chatId,
      SELF_URL,
      `/crypto-payment-for-subscription?a=b&ref=${ref}&`,
    );
    set(chatIdOfPayment, ref, chatId);
    set(state, chatId, 'cryptoPaymentSession', {
      priceCrypto,
      ticker,
      ref,
    });

    const text = `Please remit ${priceCrypto} ${tickerView} to\n\n<code>${address}</code>

Please note, crypto transactions can take up to 30 minutes to complete. Once the transaction has been confirmed, you will be promptly notified, and your ${plan} plan will be seamlessly activated.

Best regards,
Nomadly Bot`;

    bot.sendMessage(chatId, text, {
      ...o,
      parse_mode: 'HTML',
    });
    set(state, chatId, 'action', 'none');

    // send QR Code Image
    const qrCode = await bb.getQrcode();
    const buffer = Buffer.from(qrCode?.qr_code, 'base64');
    fs.writeFileSync('image.png', buffer);
    bot
      .sendPhoto(chatId, 'image.png', {
        caption: 'Here is your QR code!',
      })
      .then(() => fs.unlinkSync('image.png'))
      .catch(log);
    return;
  }
  //
  //
  if (message === '😎 DNS Management') {
    if (!(await ownsDomainName(chatId))) {
      bot.sendMessage(chatId, 'No domain names found');
      return;
    }
    goto['choose-domain-to-manage']();
    return;
  }
  if (action === 'choose-domain-to-manage') {
    const domain = message.toLowerCase();

    // if he not owns that domain then return
    const domains = await getPurchasedDomains(chatId);
    if (!domains.includes(domain)) {
      bot.sendMessage(chatId, 'Please choose a valid domain', bc);
      return;
    }

    goto['choose-dns-action'](domain);
    return;
  }
  if (action === 'choose-dns-action') {
    if (message === 'Back') return goto['choose-domain-to-manage']();

    if (![t.addDns, t.updateDns, t.deleteDns].includes(message)) return bot.sendMessage(chatId, `select valid option`);

    if (message === t.deleteDns) return goto['select-dns-record-id-to-delete']();

    if (message === t.updateDns) return goto['select-dns-record-id-to-update']();

    if (message === t.addDns) return goto['select-dns-record-type-to-add']();
  }
  //
  if (action === 'select-dns-record-id-to-delete') {
    const domain = info?.domainToManage;
    if (message === 'Back') {
      goto['choose-dns-action'](domain);
      return;
    }
    const dnsRecords = info?.dnsRecords;
    let id = Number(message);
    if (isNaN(id) || !(id > 0 && id <= dnsRecords.length)) {
      bot.sendMessage(chatId, `select valid option`);
      return;
    }
    id--; // User See id as 1,2,3 and we see as 0,1,2

    const { dnszoneID, dnszoneRecordID } = dnsRecords[id];
    const { error } = await deleteDNSRecord(dnszoneID, dnszoneRecordID);
    if (error) {
      const m = `Error deleting dns record, ${error}, Provide value again`;
      bot.sendMessage(chatId, m, o);
      return m;
    }

    bot.sendMessage(chatId, t.dnsRecordDeleted, o);
    goto['choose-dns-action'](domain);
    return;
  }
  //
  if (action === 'select-dns-record-type-to-add') {
    const domain = info?.domainToManage;
    if (message === 'Back') {
      goto['choose-dns-action'](domain);
      return;
    }
    const recordType = message;

    if (![t.cname, t.ns, t.a].includes(recordType)) {
      bot.sendMessage(chatId, `select valid option`);
      return;
    }

    goto['type-dns-record-data-to-add'](recordType);
    return;
  }
  if (action === 'type-dns-record-data-to-add') {
    const domain = info?.domainToManage;
    const recordType = info?.recordType;
    if (message === 'Back') {
      goto['select-dns-record-type-to-add']();
      return;
    }
    const recordContent = message;

    const { error } = await saveServerInDomain(domain, recordContent, t[recordType]);
    if (error) {
      const m = `Error saving dns record, ${error}, Provide value again`;
      bot.sendMessage(chatId, m, o);
      return m;
    }

    bot.sendMessage(chatId, t.dnsRecordSaved, o);
    goto['choose-dns-action'](domain);
    return;
  }
  //
  if (action === 'select-dns-record-id-to-update') {
    const domain = info?.domainToManage;
    if (message === 'Back') {
      goto['choose-dns-action'](domain);
      return;
    }

    const dnsRecords = info?.dnsRecords;
    let id = Number(message);
    if (isNaN(id) || !(id > 0 && id <= dnsRecords.length)) {
      bot.sendMessage(chatId, `select valid option`);
      return;
    }
    id--; // User See id as 1,2,3 and we see as 0,1,2

    goto['type-dns-record-data-to-update'](id, dnsRecords[id]?.recordType);
    return;
  }
  if (action === 'type-dns-record-data-to-update') {
    if (message === 'Back') {
      goto['select-dns-record-id-to-update']();
      return;
    }

    const recordContent = message;
    const dnsRecords = info?.dnsRecords;
    const domain = info?.domainToManage;
    const id = info?.dnsRecordIdToUpdate;

    const { dnszoneID, dnszoneRecordID, recordType, domainNameId, nsId } = dnsRecords[id];
    const { error } = await updateDNSRecord(
      dnszoneID,
      dnszoneRecordID,
      domain,
      recordType,
      recordContent,
      domainNameId,
      nsId,
      dnsRecords.filter(r => r.recordType === 'NS'),
    );
    if (error) {
      const m = `Error update dns record, ${error}, Provide value again`;
      bot.sendMessage(chatId, m);
      return m;
    }

    bot.sendMessage(chatId, t.dnsRecordUpdated);
    goto['choose-dns-action'](domain);
    return;
  }

  //
  //
  if (message === '🔍 My Plan') {
    const subscribedPlan = await get(planOf, chatId);

    if (subscribedPlan) {
      if (!(await isSubscribed(chatId))) {
        bot.sendMessage(
          chatId,
          `Your ${subscribedPlan} subscription is expired on ${new Date(await get(planEndingTime, chatId))}`,
        );
        return;
      }

      bot.sendMessage(
        chatId,
        `You are currently subscribed to the ${subscribedPlan} plan. Your plan is valid till ${new Date(
          await get(planEndingTime, chatId),
        )}`,
      );
      return;
    }

    bot.sendMessage(chatId, 'You are not currently subscribed to any plan.');
    return;
  }
  if (message === '🔍 View Analytics') {
    const links = await getShortLinks(chatId);
    if (links.length === 0) {
      bot.sendMessage(chatId, 'You have no shortened links yet.');
      return;
    }

    const linksText = formatLinks(links).join('\n\n');
    bot.sendMessage(chatId, `Here are your shortened links:\n${linksText}`);
    return;
  }
  if (message === '👀 My Domain Names') {
    const purchasedDomains = await getPurchasedDomains(chatId);
    if (purchasedDomains.length === 0) {
      bot.sendMessage(chatId, 'You have no purchased domains yet.');
      return;
    }

    const domainsText = purchasedDomains.join('\n');
    bot.sendMessage(chatId, `Here are your purchased domains:\n${domainsText}`);
    return;
  }
  if (message === 'Backup Data') {
    if (!isDeveloper(chatId)) {
      bot.sendMessage(chatId, 'Apologies, but you do not have the authorization to access this content.');
      return;
    }
    backupTheData();
    bot.sendMessage(chatId, 'Backup created successfully.');
    return;
  }
  if (message === 'Restore Data') {
    if (!isDeveloper(chatId)) {
      bot.sendMessage(chatId, 'Apologies, but you do not have the authorization to access this content.');
      return;
    }
    restoreData();
    bot.sendMessage(chatId, 'Data restored successfully.');
    return;
  }
  if (message === 'View Users') {
    if (!isAdmin(chatId)) {
      bot.sendMessage(chatId, 'Apologies, but you do not have the authorization to access this content.');
      return;
    }

    bot.sendMessage(chatId, `Users:\n${(await getUsers()).join('\n')}`);
    return;
  }
  if (message === 'View Analytics') {
    if (!isAdmin(chatId)) {
      bot.sendMessage(chatId, 'Apologies, but you do not have the authorization to access this content.');
      return;
    }

    const analyticsData = await getAnalytics();
    bot.sendMessage(chatId, `Analytics Data:\n${analyticsData.join('\n')}`);
    return;
  }
  if (message === '🛠️ Get Support') {
    bot.sendMessage(chatId, t.support);
    return;
  }

  bot.sendMessage(chatId, t.unknownCommand);
});

async function getPurchasedDomains(chatId) {
  let ans = await get(domainsOf, chatId);
  if (!ans) return [];

  ans = Object.keys(ans).map(d => d.replace('@', '.')); // de sanitize due to mongo db
  return ans.filter(d => d !== '_id');
}

async function getUsers() {
  let ans = await getAll(chatIdOf);
  if (!ans) return [];

  return ans.map(a => a._id);
}
// new Date('2023-9-5'), new Date('2023-9'), new Date('2023')
async function getAnalytics() {
  let ans = await getAll(clicksOf);
  if (!ans) return [];
  return ans.map(a => `${a._id}: ${a.val} click${a.val === 1 ? '' : 's'}`).sort((a, b) => a.localeCompare(b));
}

async function getShortLinks(chatId) {
  let ans = await get(linksOf, chatId);
  if (!ans) return [];

  ans = Object.keys(ans).map(d => ({ shorter: d, url: ans[d] }));
  ans = ans.filter(d => d.shorter !== '_id');

  let ret = [];
  for (let i = 0; i < ans.length; i++) {
    const link = ans[i];
    let clicks = (await get(clicksOn, link.shorter)) || 0;

    ret.push({ clicks, shorter: link.shorter.replace('@', '.'), url: link.url });
  }

  return ret;
}

async function ownsDomainName(chatId) {
  return (await getPurchasedDomains(chatId)).length > 0;
}

async function isValid(link) {
  const time = await get(expiryOf, link);
  if (time === undefined) return true;

  return time > Date.now();
}
async function isSubscribed(chatId) {
  const time = await get(planEndingTime, chatId);
  return time && time > Date.now();
}
async function freeLinksAvailable(chatId) {
  const freeLinks = (await get(freeShortLinksOf, chatId)) || 0;
  return freeLinks > 0;
}

function restoreData() {
  try {
    const backupJSON = fs.readFileSync('backup.json', 'utf-8');
    const restoredData = JSON.parse(backupJSON);
    Object.assign(state, restoredData.state);
    Object.assign(linksOf, restoredData.linksOf);
    Object.assign(expiryOf, restoredData.expiryOf);
    Object.assign(clicksOf, restoredData.clicksOf);
    Object.assign(clicksOn, restoredData.clicksOn);
    Object.assign(fullUrlOf, restoredData.fullUrlOf);
    Object.assign(domainsOf, restoredData.domainsOf);
    Object.assign(nameOf, restoredData.nameOfChatId);
    Object.assign(chatIdOf, restoredData.chatIdOfName);
    Object.assign(chatIdBlocked, restoredData.chatIdBlocked);
    Object.assign(planEndingTime, restoredData.planEndingTime);
    Object.assign(chatIdOfPayment, restoredData.chatIdOfPayment);
    Object.assign(totalShortLinks, restoredData.totalShortLinks);
    Object.assign(freeShortLinksOf, restoredData.freeShortLinksOf);
    Object.assign(freeDomainNamesAvailableFor, restoredData.freeDomainNamesAvailableFor);
    log('Data restored.');
  } catch (error) {
    log('Error restoring data:', error.message);
  }
}

async function backupTheData() {
  const backupData = {
    state: await getAll(state),
    linksOf: await getAll(linksOf),
    expiryOf: await getAll(expiryOf),
    fullUrlOf: await getAll(fullUrlOf),
    domainsOf: await getAll(domainsOf),
    chatIdBlocked: await getAll(chatIdBlocked),
    planEndingTime: await getAll(planEndingTime),
    chatIdOfPayment: await getAll(chatIdOfPayment),
    totalShortLinks: await getAll(totalShortLinks),
    freeShortLinksOf: await getAll(freeShortLinksOf),
    freeDomainNamesAvailableFor: await getAll(freeDomainNamesAvailableFor),
    payments: await getAll(payments),
    clicksOf: await getAll(clicksOf),
    clicksOn: await getAll(clicksOn),
    chatIdOf: await getAll(chatIdOf),
    nameOf: await getAll(nameOf),
    planOf: await getAll(planOf),
  };
  const backupJSON = JSON.stringify(backupData, null, 2);
  fs.writeFileSync('backup.json', backupJSON, 'utf-8');
}
async function backupPayments() {
  const data = await getAll(payments);

  const head = 'Mode, Product, Name, Price, ChatId, User Name, Time,Currency\n';
  const backup = data.map(a => a.val).join('\n');
  fs.writeFileSync('payments.csv', head + backup, 'utf-8');
}

async function buyDomain(chatId, domain) {
  // ref https://www.mongodb.com/docs/manual/core/dot-dollar-considerations
  const domainSanitizedForDb = domain.replace('.', '@');

  // set(domainsOf, chatId, domainSanitizedForDb, true);
  // return { success: true };

  const result = await buyDomainOnline(domain);
  if (result.success) {
    set(domainsOf, chatId, domainSanitizedForDb, true);
  }

  return result;
}

const formatLinks = links => {
  return links.map(d => `${d.clicks} ${d.clicks === 1 ? 'click' : 'clicks'} → ${d.shorter} → ${d.url}`);
};

const buyDomainFullProcess = async (chatId, domain) => {
  const { error: buyDomainError } = await buyDomain(chatId, domain);
  if (buyDomainError) {
    const m = `Domain purchase fails, try another name. ${chatId} ${domain} ${buyDomainError}`;
    log(m);
    bot.sendMessage(TELEGRAM_DEV_CHAT_ID, m);
    bot.sendMessage(chatId, m);
    return m;
  }
  bot.sendMessage(
    chatId,
    `Domain ${domain} is now yours. Please note that DNS updates can take up to 30 minutes. You can check your DNS update status here: https://www.whatsmydns.net/#A/${domain} Thank you for choosing us.

Best,
Nomadly Bot`,
    o,
  );

  const { server, error } = await saveDomainInServer(domain); // save domain in railway // can do separately maybe or just send messages of progress to user
  if (error) {
    const m = `Error saving domain in server, contact support ${SUPPORT_USERNAME}. Discover more @Nomadly.`;
    bot.sendMessage(chatId, m);
    return m;
  }
  bot.sendMessage(chatId, `Linking domain with your account...`); // save railway in domain

  const { error: saveServerInDomainError } = await saveServerInDomain(domain, server);
  if (saveServerInDomainError) {
    const m = `Error saving server in domain ${saveServerInDomainError}`;
    bot.sendMessage(chatId, m);
    return m;
  }
  bot.sendMessage(chatId, t.domainBought.replace('{{domain}}', domain));
  regularCheckDns(bot, chatId, domain);
  return false; // error = false
};

const app = express();
app.use(cors());
app.set('json spaces', 2);
app.get('/', (req, res) => {
  res.send(html(t.greet));
});
app.get('/health', (req, res) => {
  tryConnectReseller();
  res.send(html('ok'));
});
app.get('/bank-payment-for-plan', async (req, res) => {
  // Validations
  const { ref } = req?.query;
  const chatId = await get(chatIdOfPayment, ref);
  const plan = (await get(state, chatId))?.chosenPlanForPayment;
  log(`bank-payment-for-plan ref: ${ref} chatId: ${chatId} plan: ${plan}`);
  if (!plan) {
    res.send(html('Payment already processed or not found'));
    return;
  }

  // Subscribe Plan
  set(planOf, chatId, plan);
  set(planEndingTime, chatId, Date.now() + timeOf[plan]);
  set(freeDomainNamesAvailableFor, chatId, freeDomainsOf[plan]);
  bot.sendMessage(chatId, t.planSubscribed.replace('{{plan}}', plan));

  // Logs
  res.send(html());
  del(state, chatId);
  del(chatIdOfPayment, ref);
  const name = await get(nameOf, chatId);
  set(payments, ref, `Bank, Plan, ${plan}, $${priceOf[plan]}, ${chatId}, ${name}, ${new Date()}`);
});
app.get('/bank-payment-for-domain', async (req, res) => {
  // Validations
  const { ref } = req?.query;
  const chatId = await get(chatIdOfPayment, ref);
  const info = await get(state, chatId);
  const domain = info?.chosenDomainForPayment;
  log(`bank-payment-for-domain ref: ${ref} chatId: ${chatId} domain: ${domain}`);
  if (!domain) {
    res.send(html('Payment already processed or not found'));
    return;
  }

  // Buy Domain
  const error = await buyDomainFullProcess(chatId, domain);
  if (error) {
    return res.send(html(error));
  }

  // Logs
  res.send(html());
  del(state, chatId);
  del(chatIdOfPayment, ref);
  const name = await get(nameOf, chatId);
  const chosenDomainPrice = info?.chosenDomainPrice;
  set(payments, ref, `Bank, Domain, ${domain}, $${chosenDomainPrice}, ${chatId}, ${name}, ${new Date()}`);
});
app.get('/crypto-payment-for-subscription', async (req, res) => {
  // Validations
  const { ref, coin, value_coin } = req?.query;
  const chatId = await get(chatIdOfPayment, ref);
  const info = await get(state, chatId);
  const session = info?.cryptoPaymentSession;
  const plan = info?.chosenPlanForPayment;
  log(`crypto-payment-for-subscription ref: ${ref} chatId: ${chatId} plan: ${plan}`);
  if (!plan) {
    res.send(html(t.payError));
    return;
  }
  const { priceCrypto, ticker } = session;
  const price = Number(priceCrypto) - Number(priceCrypto) * 0.06;
  if (!(Number(value_coin) >= price && coin === ticker)) {
    res.send(html('Wrong coin or wrong price'));
    return;
  }

  // Subscribe Plan
  set(planOf, chatId, plan);
  set(planEndingTime, chatId, Date.now() + timeOf[plan]);
  set(freeDomainNamesAvailableFor, chatId, freeDomainsOf[plan]);
  bot.sendMessage(chatId, t.planSubscribed.replace('{{plan}}', plan));

  // Logs
  res.send(html());
  del(state, chatId);
  const date = new Date();
  del(chatIdOfPayment, ref);
  const name = await get(nameOf, chatId);
  set(payments, ref, `Crypto, Plan, ${plan}, $${priceOf[plan]}, ${chatId}, ${name}, ${date}, ${value_coin} ${coin}`);
});

app.get('/crypto-payment-for-domain', async (req, res) => {
  // Validations
  const { ref, coin, value_coin } = req?.query;
  const chatId = await get(chatIdOfPayment, ref);
  const info = await get(state, chatId);
  const session = info?.cryptoPaymentSession;
  const domain = info?.chosenDomainForPayment;
  log(`crypto-payment-for-domain ref: ${ref} chatId: ${chatId} domain: ${domain}`);
  if (!domain) {
    res.send(html(t.payError));
    return;
  }
  const { priceCrypto, ticker } = session;
  const price = Number(priceCrypto) - Number(priceCrypto) * 0.06;
  if (!(Number(value_coin) >= price && coin === ticker)) {
    res.send(html('Payment invalid, either less value sent or coin sent is not correct'));
    return;
  }

  // Buy Domain
  const error = await buyDomainFullProcess(chatId, domain);
  if (error) {
    res.send(html(error));
    return;
  }

  // Logs
  res.send(html());
  del(state, chatId);
  const date = new Date();
  del(chatIdOfPayment, ref);
  const name = await get(nameOf, chatId);
  const chosenDomainPrice = info?.chosenDomainPrice;
  set(payments, ref, `Crypto,Domain,${domain},$${chosenDomainPrice},${chatId},${name},${date},${value_coin} ${coin}`);
});
app.get('/json1444', async (req, res) => {
  await backupTheData();
  const fileName = 'backup.json';
  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
  res.setHeader('Content-Type', 'application/json');
  fs.createReadStream(fileName).pipe(res);
});
app.get('/payments', async (req, res) => {
  await backupPayments();
  const fileName = 'payments.csv';
  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
  res.setHeader('Content-Type', 'application/json');
  fs.createReadStream(fileName).pipe(res);
});

let serverStartTime = new Date();
app.get('/uptime', (req, res) => {
  let now = new Date();
  let uptimeInMilliseconds = now - serverStartTime;
  let uptimeInHours = uptimeInMilliseconds / (1000 * 60 * 60);
  res.send(html(`Server has been running for ${uptimeInHours.toFixed(2)} hours.`));
});

app.get('/:id', async (req, res) => {
  const { id } = req?.params;
  if (id === '') {
    res.json({ message: 'Salam', from: req.hostname });
    return;
  }
  const shortUrl = `${req.hostname}/${id}`;
  const shortUrlSanitized = shortUrl.replace('.', '@');
  const url = await get(fullUrlOf, shortUrlSanitized);

  if (!url) {
    res.status(404).send('Link not found');
    return;
  }

  if (!(await isValid(shortUrlSanitized))) {
    res.status(404).send(html(t.linkExpired));
    return;
  }

  res.redirect(url);

  increment(clicksOf, 'total');
  increment(clicksOf, today());
  increment(clicksOf, week());
  increment(clicksOf, month());
  increment(clicksOf, year());

  increment(clicksOn, shortUrlSanitized);
});
const startServer = () => {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    log(`Server is running on port http://localhost:${port}`);
  });
};
startServer();

const tryConnectReseller = async () => {
  try {
    await getRegisteredDomainNames();
    connect_reseller_working = true;
  } catch (error) {
    //
    axios.get('https://api.ipify.org/').then(ip => {
      const message = `Please add <code>${ip.data}</code> to whitelist in Connect Reseller, API Section. https://global.connectreseller.com/tools/profile`;
      log(message);
      bot.sendMessage(TELEGRAM_DEV_CHAT_ID, message, { parse_mode: 'HTML' }).catch(() => {});
      bot.sendMessage(TELEGRAM_ADMIN_CHAT_ID, message, { parse_mode: 'HTML' });
    });
    //
  }
};

tryConnectReseller();
