/*global process */
const {
  o,
  t,
  k,
  u,
  bc,
  aO,
  rem,
  dns,
  html,
  user,
  show,
  payIn,
  admin,
  timeOf,
  yes_no,
  priceOf,
  payBank,
  linkType,
  tickerOf,
  linkOptions,
  tickerViews,
  tickerViewOf,
  freeDomainsOf,
  dnsRecordType,
  chooseSubscription,
  subscriptionOptions,
} = require('./config.js');
const {
  week,
  year,
  month,
  today,
  isAdmin,
  isValidUrl,
  nextNumber,
  sendQrCode,
  isDeveloper,
  isValidEmail,
  regularCheckDns,
  convertUSDToNaira,
  sendMessageToAllUsers,
} = require('./utils.js');
const fs = require('fs');
require('dotenv').config();
const cors = require('cors');
const axios = require('axios');
const express = require('express');
const { log } = require('console');
const { MongoClient } = require('mongodb');
const { customAlphabet } = require('nanoid');
const TelegramBot = require('node-telegram-bot-api');
const { createCheckout } = require('./pay-fincra.js');
const viewDNSRecords = require('./cr-view-dns-records.js');
const { deleteDNSRecord } = require('./cr-dns-record-del.js');
const { buyDomainOnline } = require('./cr-domain-register.js');
const { saveServerInDomain } = require('./cr-dns-record-add.js');
const { updateDNSRecord } = require('./cr-dns-record-update.js');
const { checkDomainPriceOnline } = require('./cr-domain-price-get.js');
const { saveDomainInServer } = require('./rl-save-domain-in-server.js');
const { get, set, del, increment, getAll, decrement } = require('./db.js');
const { getRegisteredDomainNames } = require('./cr-domain-purchased-get.js');
const { getCryptoDepositAddress, convert } = require('./pay-blockbee.js');

process.env['NTBA_FIX_350'] = 1;
const DB_NAME = process.env.DB_NAME;
const SELF_URL = process.env.SELF_URL;
const FREE_LINKS = Number(process.env.FREE_LINKS);
const SUPPORT_USERNAME = process.env.SUPPORT_USERNAME;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_DEV_CHAT_ID = process.env.TELEGRAM_DEV_CHAT_ID;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const FREE_LINKS_TIME_SECONDS = Number(process.env.FREE_LINKS_TIME_SECONDS) * 1000; // to milliseconds
const TELEGRAM_DOMAINS_SHOW_CHAT_ID = Number(process.env.TELEGRAM_DOMAINS_SHOW_CHAT_ID);
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 5);

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
log('Bot ran!');

const send = (chatId, message, options) => {
  log('reply:\t' + message + ' ' + options?.reply_markup?.keyboard?.map(i => i) || '' + '\tto: ' + chatId);
  bot.sendMessage(chatId, message, options);
};

// variables to implement core functionality
let state = {},
  walletOf = {},
  linksOf = {},
  expiryOf = {},
  fullUrlOf = {},
  domainsOf = {},
  chatIdBlocked = {},
  planEndingTime = {},
  chatIdOfPayment = {},
  totalShortLinks = {},
  freeShortLinksOf = {},
  freeDomainNamesAvailableFor = {};

// variables to view system information
let nameOf = {},
  planOf = {},
  payments = {},
  clicksOf = {},
  clicksOn = {},
  chatIdOf = {};

// some info to use with bot
let adminDomains = [],
  connect_reseller_working = false;

// restoreData(); // can be use when there is no db

let db;
const loadData = async () => {
  db = client.db(DB_NAME);

  // variables to implement core functionality
  state = db.collection('state');
  linksOf = db.collection('linksOf');
  walletOf = db.collection('walletOf');
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
  nameOf = db.collection('nameOf');
  planOf = db.collection('planOf');
  payments = db.collection('payments');
  clicksOf = db.collection('clicksOf');
  clicksOn = db.collection('clicksOn');
  chatIdOf = db.collection('chatIdOf');

  log(`DB Connected. May peace be with you and Lord's mercy and blessings.`);
  set(freeShortLinksOf, 6687923716, FREE_LINKS);
  set(freeShortLinksOf, 1531772316, FREE_LINKS);
  adminDomains = await getPurchasedDomains(TELEGRAM_DOMAINS_SHOW_CHAT_ID);
};
const client = new MongoClient(process.env.MONGO_URL);
client
  .connect()
  .then(loadData)
  .catch(err => log('DB Error lala', err, err?.message));

bot.on('message', async msg => {
  const chatId = msg?.chat?.id;
  const message = msg?.text;
  log('message: \t' + message + '\tfrom: ' + chatId + '\t' + msg?.from?.username);

  tryConnectReseller(); // our ip may change on railway hosting so make sure its correct

  if (!db) {
    send(chatId, 'Bot starting, please wait');
    return;
  }

  if (!connect_reseller_working) {
    await tryConnectReseller();
    if (!connect_reseller_working) {
      send(chatId, 'Bot starting, please wait');
      return;
    }
  }

  const nameOfChatId = await get(nameOf, chatId);
  const username = nameOfChatId || msg?.from?.username || nanoid();

  const blocked = await get(chatIdBlocked, chatId);
  if (blocked) {
    send(
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

  let info = await get(state, chatId);
  const saveInfo = async (label, data) => {
    await set(state, chatId, label, data);
    info = await get(state, chatId);
  };
  const action = info?.action;

  const firstSteps = [
    'block-user',
    'unblock-user',
    'choose-subscription',
    'choose-domain-to-buy',
    'choose-url-to-shorten',
    'choose-domain-to-manage',
    admin.messageUsers,
    user.wallet,
  ];
  // actions
  const a = {
    selectCurrencyToWithdraw: 'selectCurrencyToWithdraw',

    selectCurrencyToDeposit: 'selectCurrencyToDeposit',

    depositNGN: 'depositNGN',
    askEmailForNGN: 'askEmailForNGN',
    showDepositNgnInfo: 'showDepositNgnInfo',

    depositUSD: 'depositUSD',
    selectCryptoToDeposit: 'selectCryptoToDeposit',
    showDepositCryptoInfo: 'showDepositCryptoInfo',
  };
  const goto = {
    'domain-name-payment': (domain, price) => {
      send(chatId, `Price of ${domain} is ${price} USD. Choose payment method.`, k.pay);
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
      send(
        chatId,
        `<b>Claim Your Corner of the Web!</b>  Please share the domain name you wish to purchase, like "abcpay.com".${text}`,
        bc,
      );
    },
    'subscription-payment': plan => {
      send(chatId, `Price of ${plan} subscription is ${priceOf[plan]} USD. Choose payment method.`, k.pay);
      set(state, chatId, 'action', 'subscription-payment');
    },
    'choose-subscription': () => {
      set(state, chatId, 'action', 'choose-subscription');
      send(chatId, t.chooseSubscription, chooseSubscription);
    },
    'choose-url-to-shorten': async () => {
      set(state, chatId, 'action', 'choose-url-to-shorten');
      const m = 'Kindly share the URL that you would like shortened and analyzed. e.g https://cnn.com';
      send(chatId, m, bc);
      adminDomains = await getPurchasedDomains(TELEGRAM_DOMAINS_SHOW_CHAT_ID);
    },
    'choose-domain-with-shorten': domains => {
      send(chatId, t.chooseDomainWithShortener, show(domains));
      set(state, chatId, 'action', 'choose-domain-with-shorten');
    },
    'choose-link-type': () => {
      send(chatId, `Choose link type:`, linkType);
      set(state, chatId, 'action', 'choose-link-type');
    },
    'get-free-domain': () => {
      send(chatId, t.chooseFreeDomainText, yes_no);
      set(state, chatId, 'action', 'get-free-domain');
    },

    'choose-domain-to-manage': async () => {
      const domains = await getPurchasedDomains(chatId);
      set(state, chatId, 'action', 'choose-domain-to-manage');
      send(chatId, t.chooseDomainToManage, show(domains));
    },

    'select-dns-record-id-to-delete': () => {
      send(chatId, t.deleteDnsTxt, bc);
      set(state, chatId, 'action', 'select-dns-record-id-to-delete');
    },

    'confirm-dns-record-id-to-delete': () => {
      send(chatId, t.confirmDeleteDnsTxt, yes_no);
      set(state, chatId, 'action', 'confirm-dns-record-id-to-delete');
    },

    'choose-dns-action': async () => {
      const domain = info?.domainToManage;
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
            `${i + 1}.\t${recordType === 'NS' ? recordType + nsId : recordType === 'A' ? 'A Record' : recordType}:\t${
              recordContent || 'None'
            }`,
        )
        .join('\n');

      set(state, chatId, 'dnsRecords', toSave);
      set(state, chatId, 'action', 'choose-dns-action');
      send(chatId, `${t.viewDnsRecords.replace('{{domain}}', domain)}\n${viewDnsRecords}`, dns);
    },

    'type-dns-record-data-to-add': recordType => {
      send(chatId, t.askDnsContent[recordType], bc);
      set(state, chatId, 'recordType', recordType);
      set(state, chatId, 'action', 'type-dns-record-data-to-add');
    },

    'select-dns-record-id-to-update': () => {
      send(chatId, t.updateDnsTxt, bc);
      set(state, chatId, 'action', 'select-dns-record-id-to-update');
    },
    'type-dns-record-data-to-update': (id, recordType) => {
      set(state, chatId, 'dnsRecordIdToUpdate', id);
      set(state, chatId, 'action', 'type-dns-record-data-to-update');
      send(chatId, t.askUpdateDnsContent[recordType]);
    },

    'select-dns-record-type-to-add': () => {
      set(state, chatId, 'action', 'select-dns-record-type-to-add');
      send(chatId, t.addDnsTxt, dnsRecordType);
    },

    //
    //
    [admin.messageUsers]: () => {
      send(chatId, 'Enter message', bc);
      set(state, chatId, 'action', admin.messageUsers);
    },
    adminConfirmMessage: () => {
      send(chatId, 'Confirm?', yes_no);
      set(state, chatId, 'action', 'adminConfirmMessage');
    },
    //
    //
    //

    [user.wallet]: async () => {
      set(state, chatId, 'action', user.wallet);
      const w = await get(walletOf, chatId);
      const usdBalance = isNaN(w?.usdIn) ? 0 : w?.usdIn;
      send(chatId, t.wallet(usdBalance, 0), k.wallet);
    },
    //
    [a.selectCurrencyToDeposit]: () => {
      set(state, chatId, 'action', a.selectCurrencyToDeposit);
      send(chatId, t.selectCurrencyToDeposit, k.of([u.usd, u.ngn]));
    },
    //
    [a.depositNGN]: () => {
      send(chatId, t.depositNGN, bc);
      set(state, chatId, 'action', a.depositNGN);
    },
    [a.askEmailForNGN]: () => {
      send(chatId, t.askEmailForNGN, bc);
      set(state, chatId, 'action', a.askEmailForNGN);
    },
    [a.showDepositNgnInfo]: () => {
      const { priceNGN, tickerView, address, email } = info;
      const ref = nanoid();
      log({ ref });
      set(state, chatId, 'ref', ref, email);
      set(state, chatId, 'action', 'none');
      send(chatId, t.showDepositNgnInfo(priceNGN, tickerView, address), o);
    },
    confirmationDepositNgn: amountWithTicker => {
      // check how much amount received and add to wallet
      del(state, chatId, 'ref');
      send(chatId, t.confirmationDepositNgn(amountWithTicker));
    },
    //
    [a.depositUSD]: () => {
      send(chatId, t.depositUSD, bc);
      set(state, chatId, 'action', a.depositUSD);
    },
    [a.selectCryptoToDeposit]: () => {
      set(state, chatId, 'action', a.selectCryptoToDeposit);
      send(chatId, t.selectCryptoToDeposit, k.of(tickerViews));
    },
    [a.showDepositCryptoInfo]: async () => {
      const ref = nanoid();
      const { amount, tickerView } = info;
      const ticker = tickerOf[tickerView];
      const { address, bb } = await getCryptoDepositAddress(ticker, chatId, SELF_URL, `/crypto-wallet?a=b&ref=${ref}&`);

      log({ ref });
      sendQrCode(bot, chatId, bb);
      set(state, chatId, 'ref', ref);
      set(chatIdOfPayment, ref, chatId);
      set(state, chatId, 'action', 'none');
      const usdIn = await convert(amount, 'usd', ticker);
      set(state, chatId, 'usdIn', usdIn);
      send(chatId, t.showDepositCryptoInfo(usdIn, tickerView, address), o);
    },

    //
    selectCurrencyToWithdraw: () => {
      send(chatId, t.comingSoonWithdraw);
    },
  };

  if (message === '/start') {
    set(state, chatId, 'action', 'none');

    if (isAdmin(chatId)) return send(chatId, 'Hello, Admin! Please select an option:', aO);

    const freeLinks = await get(freeShortLinksOf, chatId);
    if (freeLinks === undefined || freeLinks > 0) return send(chatId, t.welcomeFreeTrial, o);

    return send(chatId, t.welcome, o);
  }
  //
  if (message.toLowerCase() === 'cancel' || (firstSteps.includes(action) && message === 'Back')) {
    set(state, chatId, 'action', 'none');
    return send(chatId, `User has Pressed ${message} Button.`, isAdmin(chatId) ? aO : o);
  }
  //
  if (message === admin.blockUser) {
    if (!isAdmin(chatId)) return send(chatId, 'not authorized');
    set(state, chatId, 'action', 'block-user');
    return send(chatId, 'Please share the username of the user that needs to be blocked.', bc);
  }
  if (action === 'block-user') {
    const userToBlock = message;
    const chatIdToBlock = await get(chatIdOf, userToBlock);
    if (!chatIdToBlock) return send(chatId, `User ${userToBlock} not found`);

    set(state, chatId, 'action', 'none');
    set(chatIdBlocked, chatIdToBlock, true);
    return send(chatId, `User ${userToBlock} has been blocked.`, aO);
  }
  //
  if (message === admin.unblockUser) {
    if (!isAdmin(chatId)) return send(chatId, 'not authorized');
    set(state, chatId, 'action', 'unblock-user');
    return send(chatId, 'Please share the username of the user that needs to be unblocked.', bc);
  }
  if (action === 'unblock-user') {
    const userToUnblock = message;
    const chatIdToUnblock = await get(chatIdOf, userToUnblock);
    if (!chatIdToUnblock) return send(chatId, `User ${userToUnblock} not found`, bc);

    set(state, chatId, 'action', 'none');
    set(chatIdBlocked, chatIdToUnblock, false);
    return send(chatId, `User ${userToUnblock} has been unblocked.`, aO);
  }
  //
  if (message === admin.messageUsers) {
    if (!isAdmin(chatId)) return send(chatId, 'not authorized');
    return goto[admin.messageUsers]();
  }
  if (action === admin.messageUsers) {
    await set(state, chatId, 'messageContent', message);
    info = await get(state, chatId);
    return goto.adminConfirmMessage();
  }
  if (action === 'adminConfirmMessage') {
    if (message === 'No' || message === 'Back') goto[admin.messageUsers]();
    set(state, chatId, 'action', 'none');
    sendMessageToAllUsers(bot, info?.messageContent, nameOf, chatId);
    return send(chatId, 'Sent all all users', aO);
  }
  //
  //
  if (message === user.urlShortener) {
    if (!((await freeLinksAvailable(chatId)) || (await isSubscribed(chatId))))
      return send(chatId, '📋 Subscribe first');

    return goto['choose-url-to-shorten']();
  }
  if (action === 'choose-url-to-shorten') {
    if (!isValidUrl(message)) return send(chatId, 'Please provide a valid URL. e.g https://google.com', bc);

    set(state, chatId, 'url', message);

    const domains = await getPurchasedDomains(chatId);
    return goto['choose-domain-with-shorten']([...domains, ...adminDomains]);
  }
  if (action === 'choose-domain-with-shorten') {
    if (message === 'Back') return goto['choose-url-to-shorten']();

    const domain = message.toLowerCase();
    const domains = await getPurchasedDomains(chatId);
    if (!(domains.includes(domain) || adminDomains.includes(domain))) {
      return send(chatId, 'Please choose a valid domain');
    }
    set(state, chatId, 'selectedDomain', message);
    return goto['choose-link-type']();
  }
  if (action === 'choose-link-type') {
    if (message === 'Back') return goto['choose-domain-with-shorten'](await getPurchasedDomains(chatId));

    if (!linkOptions.includes(message)) return send(chatId, `?`);

    if (message === 'Custom Link') {
      set(state, chatId, 'action', 'shorten-custom');
      return send(chatId, `Please tell your us preferred short link extension: e.g payer`, bc);
    }

    // Random Link
    const url = info?.url;
    const domain = info?.selectedDomain;
    const shortUrl = domain + '/' + nanoid();
    if (await get(fullUrlOf, shortUrl)) {
      send(chatId, `Link already exists. Please type 'ok' to try another.`);
      return;
    }

    const shortUrlSanitized = shortUrl.replace('.', '@');
    increment(totalShortLinks);
    set(state, chatId, 'action', 'none');
    set(fullUrlOf, shortUrlSanitized, url);
    set(linksOf, chatId, shortUrlSanitized, url);
    send(chatId, `Your shortened URL is: ${shortUrl}`, o);
    if (adminDomains.includes(domain)) {
      decrement(freeShortLinksOf, chatId);
      set(expiryOf, shortUrlSanitized, Date.now() + FREE_LINKS_TIME_SECONDS);
    }
    return;
  }
  if (action === 'shorten-custom') {
    if (message === 'Back') return goto['choose-link-type']();

    const url = info?.url;
    const domain = info?.selectedDomain;
    const shortUrl = domain + '/' + message;

    if (!isValidUrl('https://' + shortUrl)) return send(chatId, t.provideLink);
    if (await get(fullUrlOf, shortUrl)) return send(chatId, `Link already exists. Please try another.`);

    const shortUrlSanitized = shortUrl.replace('.', '@');
    increment(totalShortLinks);
    set(state, chatId, 'action', 'none');
    set(fullUrlOf, shortUrlSanitized, url);
    set(linksOf, chatId, shortUrlSanitized, url);
    send(chatId, `Your shortened URL is: ${shortUrl}`, o);
    if (adminDomains.includes(domain)) {
      decrement(freeShortLinksOf, chatId);
      set(expiryOf, shortUrlSanitized, Date.now() + FREE_LINKS_TIME_SECONDS);
    }
    return;
  }
  //
  //
  if (message === user.buyDomainName) {
    goto['choose-domain-to-buy']();
    return;
  }
  if (action === 'choose-domain-to-buy') {
    const domain = message.toLowerCase();
    const domainRegex = /^(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/;

    if (!domainRegex.test(domain)) {
      send(chatId, 'Domain name is invalid. Please try another domain name.');
      return;
    }

    const { available, price, originalPrice } = await checkDomainPriceOnline(domain);

    if (!available) {
      send(chatId, 'Domain is not available. Please try another domain name.', rem);
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
    if (message === 'Back') return goto['choose-domain-to-buy']();
    const payOption = message;

    if (payOption === payIn.crypto) {
      set(state, chatId, 'action', 'crypto-transfer-payment-domain');
      return send(chatId, `Please choose a crypto currency`, k.of(tickerViews));
    }

    if (payOption === payIn.bank) {
      set(state, chatId, 'action', 'bank-transfer-payment-domain');
      return send(chatId, t.askEmail, bc);
    }

    return send(chatId, t.askValidPayOption);
  }
  if (action === 'bank-transfer-payment-domain') {
    const price = info?.chosenDomainPrice;
    const domain = info?.chosenDomainForPayment;
    if (message === 'Back') return goto['domain-name-payment'](domain, price);

    const email = message;

    if (!isValidEmail(email)) return send(chatId, t.askValidEmail);

    const priceNGN = Number(await convertUSDToNaira(price));
    const ref = nanoid();
    log({ ref });
    set(chatIdOfPayment, ref, chatId);
    const { url, error } = await createCheckout(priceNGN, `/bank-payment-for-domain?a=b&ref=${ref}&`, email, username);
    if (error) {
      send(chatId, error, o);
      set(state, chatId, 'action', 'none');
      return;
    }

    send(
      chatId,
      `Please remit ${priceNGN} NGN by clicking “Make Payment” below. Once the transaction has been confirmed, you will be promptly notified, and your ${domain} will be seamlessly activated.

Best regards,
Nomadly Bot`,
      payBank(url),
    );
    send(chatId, `Bank ₦aira + Card 🌐︎`, o);
    set(state, chatId, 'action', 'none');
    return;
  }
  if (action === 'crypto-transfer-payment-domain') {
    const priceUSD = info?.chosenDomainPrice;
    const domain = info?.chosenDomainForPayment;

    if (message === 'Back') return goto['domain-name-payment'](domain, priceUSD);

    const tickerView = message;
    const ticker = tickerOf[tickerView];
    if (!ticker) return send(chatId, t.askValidCrypto);

    const ref = nanoid();
    log({ ref });
    const { address, bb } = await getCryptoDepositAddress(
      ticker,
      chatId,
      SELF_URL,
      `/crypto-payment-for-domain?a=b&ref=${ref}&`,
    );

    set(chatIdOfPayment, ref, chatId);

    const priceCrypto = await convert(priceUSD, 'usd', ticker);
    set(state, chatId, 'cryptoPaymentSession', {
      priceCrypto,
      ticker,
      ref,
    });

    const text = `Please remit ${priceCrypto} ${tickerView} to\n\n<code>${address}</code>

Please note, crypto transactions can take up to 30 minutes to complete. Once the transaction has been confirmed, you will be promptly notified, and your ${domain} will be seamlessly activated.

Best regards,
Nomadly Bot`;

    sendQrCode(bot, chatId, bb);
    send(chatId, text, o);
    set(state, chatId, 'action', 'none');
    return;
  }
  if (action === 'get-free-domain') {
    if (message === 'Back' || message === 'No') return goto['choose-domain-to-buy']();

    if (message !== 'Yes') return send(chatId, `?`);

    set(state, chatId, 'action', 'none');

    const domain = info?.chosenDomainForPayment;
    const error = await buyDomainFullProcess(chatId, domain);
    if (!error) decrement(freeDomainNamesAvailableFor, chatId);

    return;
  }
  //
  //
  if (message === user.buyPlan) {
    if (await isSubscribed(chatId)) {
      send(chatId, 'You are currently enrolled in a subscription plan.');
      return;
    }
    goto['choose-subscription']();
    return;
  }
  if (action === 'choose-subscription') {
    const plan = message;

    if (!subscriptionOptions.includes(plan)) {
      send(chatId, 'Please choose a valid plan', chooseSubscription);
      return;
    }

    set(state, chatId, 'chosenPlanForPayment', plan);

    goto['subscription-payment'](plan);

    return;
  }
  if (action === 'subscription-payment') {
    if (message === 'Back') return goto['choose-subscription']();
    const payOption = message;

    if (payOption === payIn.crypto) {
      set(state, chatId, 'action', 'crypto-transfer-payment');
      return send(chatId, `Please choose a crypto currency`, k.of(tickerViews));
    }

    if (payOption === payIn.bank) {
      set(state, chatId, 'action', 'bank-transfer-payment-subscription');
      return send(chatId, t.askEmail, bc);
    }

    return send(chatId, t.askValidPayOption);
  }
  if (action === 'bank-transfer-payment-subscription') {
    const plan = info?.chosenPlanForPayment;
    if (message === 'Back') return goto['subscription-payment'](plan);

    const email = message;

    if (!isValidEmail(email)) return send(chatId, t.askValidEmail);

    const priceNGN = Number(await convertUSDToNaira(priceOf[plan]));
    const ref = nanoid();
    log({ ref });
    set(chatIdOfPayment, ref, chatId);
    const { url, error } = await createCheckout(priceNGN, `/bank-payment-for-plan?a=b&ref=${ref}&`, email, username);
    if (error) {
      send(chatId, error, o);
      set(state, chatId, 'action', 'none');
      return;
    }

    send(
      chatId,
      `Please remit ${priceNGN} NGN by clicking “Make Payment” below. Once the transaction has been confirmed, you will be promptly notified, and your ${plan} plan will be seamlessly activated.

Best regards,
Nomadly Bot`,
      payBank(url),
    );
    send(chatId, `Bank ₦aira + Card 🌐︎`, o);
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
    if (!ticker) return send(chatId, t.askValidCrypto);

    const priceCrypto = await convert(priceUSD, 'usd', ticker);

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

    sendQrCode(bot, chatId, bb);
    send(chatId, text, o);
    set(state, chatId, 'action', 'none');
    return;
  }
  //
  //
  if (message === user.dnsManagement) {
    if (!(await ownsDomainName(chatId))) {
      send(chatId, 'No domain names found');
      return;
    }

    return goto['choose-domain-to-manage']();
  }
  if (action === 'choose-domain-to-manage') {
    const domain = message.toLowerCase();

    // if he not owns that domain then return
    const domains = await getPurchasedDomains(chatId);
    if (!domains.includes(domain)) {
      return send(chatId, 'Please choose a valid domain');
    }

    await set(state, chatId, 'domainToManage', domain);
    info = await get(state, chatId);

    return goto['choose-dns-action']();
  }
  if (action === 'choose-dns-action') {
    if (message === 'Back') return goto['choose-domain-to-manage']();

    if (![t.addDns, t.updateDns, t.deleteDns].includes(message)) return send(chatId, `select valid option`);

    if (message === t.deleteDns) return goto['select-dns-record-id-to-delete']();

    if (message === t.updateDns) return goto['select-dns-record-id-to-update']();

    if (message === t.addDns) return goto['select-dns-record-type-to-add']();
  }
  //
  if (action === 'select-dns-record-id-to-delete') {
    if (message === 'Back') return goto['choose-dns-action']();

    let id = Number(message);
    if (isNaN(id) || !(id > 0 && id <= info?.dnsRecords.length)) return send(chatId, `select valid option`);

    set(state, chatId, 'delId', --id); // User See id as 1,2,3 and we see as 0,1,2
    return goto['confirm-dns-record-id-to-delete']();
  }
  if (action === 'confirm-dns-record-id-to-delete') {
    if (message === 'Back' || message === 'No') return goto['select-dns-record-id-to-delete']();
    if (message !== 'Yes') return send(chatId, `?`);

    const { dnsRecords, domainToManage, delId } = info;
    const nsRecords = dnsRecords.filter(r => r.recordType === 'NS');
    const { dnszoneID, dnszoneRecordID, nsId, domainNameId } = dnsRecords[delId];
    const { error } = await deleteDNSRecord(dnszoneID, dnszoneRecordID, domainToManage, domainNameId, nsId, nsRecords);
    if (error) return send(chatId, `Error deleting dns record, ${error}, Provide value again`);

    send(chatId, t.dnsRecordDeleted);
    return goto['choose-dns-action']();
  }
  if (action === 'select-dns-record-type-to-add') {
    if (message === 'Back') return goto['choose-dns-action']();

    const recordType = message;

    if (![t.cname, t.ns, t.a].includes(recordType)) {
      return send(chatId, `select valid option`);
    }

    return goto['type-dns-record-data-to-add'](recordType);
  }
  if (action === 'type-dns-record-data-to-add') {
    if (message === 'Back') return goto['select-dns-record-type-to-add']();

    const domain = info?.domainToManage;
    const recordType = info?.recordType;
    const recordContent = message;
    const dnsRecords = info?.dnsRecords;
    const nsRecords = dnsRecords.filter(r => r.recordType === 'NS');
    const id = nsRecords.length - 1;
    const { domainNameId } = dnsRecords[id];

    if (nsRecords.length >= 4 && t[recordType] === 'NS') {
      send(chatId, 'Maximum 4 NS records can be added, you can update or delete previous NS records');
      return goto['choose-dns-action']();
    }

    const nextId = nextNumber(nsRecords.map(r => r.nsId));
    const { error } = await saveServerInDomain(domain, recordContent, t[recordType], domainNameId, nextId, nsRecords);
    if (error) {
      const m = `Error saving dns record, ${error}, Provide value again`;
      return send(chatId, m);
    }

    send(chatId, t.dnsRecordSaved);
    return goto['choose-dns-action']();
  }
  //
  if (action === 'select-dns-record-id-to-update') {
    if (message === 'Back') return goto['choose-dns-action']();

    const dnsRecords = info?.dnsRecords;
    let id = Number(message);
    if (isNaN(id) || !(id > 0 && id <= dnsRecords.length)) {
      return send(chatId, `select valid option`);
    }
    id--; // User See id as 1,2,3 and we see as 0,1,2

    goto['type-dns-record-data-to-update'](id, dnsRecords[id]?.recordType);
    return;
  }
  if (action === 'type-dns-record-data-to-update') {
    if (message === 'Back') return goto['select-dns-record-id-to-update']();

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
      send(chatId, m);
      return m;
    }

    send(chatId, t.dnsRecordUpdated);
    return goto['choose-dns-action']();
  }
  //
  //
  //
  if (message === user.wallet) {
    return goto[user.wallet]();
  }
  if (action === user.wallet) {
    if (message === u.deposit) return goto[a.selectCurrencyToDeposit](); // can be combine in one line with object
    if (message === u.withdraw) return goto[a.selectCurrencyToWithdraw]();
    return send(chatId, `?`);
  }

  if (action === a.selectCurrencyToDeposit) {
    if (message === u.usd) return goto[a.depositUSD]();
    if (message === u.ngn) return goto[a.depositNGN]();
    return send(chatId, `?`);
  }

  if (action === a.depositNGN) {
    if (message === 'Back') return goto[user.wallet]();
    return goto[a.askEmailForNGN]();
  }
  if (action === a.askEmailForNGN) {
    if (message === 'Back') return goto[a.depositNGN]();
    const email = message;
    if (!isValidEmail(email)) return send(chatId, t.askValidEmail);
    await saveInfo('email', email);
    return goto[a.showDepositNgnInfo]();
  }

  if (action === a.depositUSD) {
    if (message === 'Back') return goto[user.wallet]();

    const amount = message;
    if (isNaN(amount)) return send(chatId, `?`);
    await saveInfo('amount', amount);

    return goto[a.selectCryptoToDeposit]();
  }
  if (action === a.selectCryptoToDeposit) {
    if (message === 'Back') return goto[a.depositUSD]();

    const tickerView = message;
    const ticker = tickerOf[tickerView];
    if (!ticker) return send(chatId, t.askValidCrypto);
    await saveInfo('tickerView', tickerView);
    return goto[a.showDepositCryptoInfo]();
  }

  //
  //
  if (message === user.viewPlan) {
    const subscribedPlan = await get(planOf, chatId);

    if (subscribedPlan) {
      if (!(await isSubscribed(chatId))) {
        send(
          chatId,
          `Your ${subscribedPlan} subscription is expired on ${new Date(await get(planEndingTime, chatId))}`,
        );
        return;
      }

      send(
        chatId,
        `You are currently subscribed to the ${subscribedPlan} plan. Your plan is valid till ${new Date(
          await get(planEndingTime, chatId),
        )}`,
      );
      return;
    }

    send(chatId, 'You are not currently subscribed to any plan.');
    return;
  }
  if (message === user.viewShortLinks) {
    const links = await getShortLinks(chatId);
    if (links.length === 0) {
      send(chatId, 'You have no shortened links yet.');
      return;
    }

    const linksText = formatLinks(links).join('\n\n');
    send(chatId, `Here are your shortened links:\n${linksText}`);
    return;
  }
  if (message === user.viewDomainNames) {
    const purchasedDomains = await getPurchasedDomains(chatId);
    if (purchasedDomains.length === 0) {
      send(chatId, 'You have no purchased domains yet.');
      return;
    }

    const domainsText = purchasedDomains.join('\n');
    send(chatId, `Here are your purchased domains:\n${domainsText}`);
    return;
  }
  if (message === 'Backup Data') {
    if (!isDeveloper(chatId)) {
      send(chatId, 'Apologies, but you do not have the authorization to access this content.');
      return;
    }
    backupTheData();
    send(chatId, 'Backup created successfully.');
    return;
  }
  if (message === 'Restore Data') {
    if (!isDeveloper(chatId)) {
      send(chatId, 'Apologies, but you do not have the authorization to access this content.');
      return;
    }
    restoreData();
    send(chatId, 'Data restored successfully.');
    return;
  }
  if (message === admin.viewUsers) {
    if (!isAdmin(chatId)) return send(chatId, 'not authorized');

    const users = await getUsers();
    return send(chatId, `Users: ${users.length}\n${users.join('\n')}`);
  }
  if (message === admin.viewAnalytics) {
    if (!isAdmin(chatId)) return send(chatId, 'not authorized');

    const analyticsData = await getAnalytics();
    send(chatId, `Analytics Data:\n${analyticsData.join('\n')}`);
    return;
  }
  if (message === user.getSupport) {
    send(chatId, t.support);
    return;
  }

  send(chatId, t.unknownCommand);
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
    Object.assign(walletOf, restoredData.walletOf);
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
    walletOf: await getAll(walletOf),
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
    send(TELEGRAM_DEV_CHAT_ID, m);
    send(chatId, m);
    return m;
  }
  send(
    chatId,
    `Domain ${domain} is now yours. Please note that DNS updates can take up to 30 minutes. You can check your DNS update status here: https://www.whatsmydns.net/#A/${domain} Thank you for choosing us.

Best,
Nomadly Bot`,
    o,
  );

  const { server, error } = await saveDomainInServer(domain); // save domain in railway // can do separately maybe or just send messages of progress to user
  if (error) {
    const m = `Error saving domain in server, contact support ${SUPPORT_USERNAME}. Discover more @Nomadly.`;
    send(chatId, m);
    return m;
  }
  send(chatId, `Linking domain with your account...`); // save railway in domain

  const { error: saveServerInDomainError } = await saveServerInDomain(domain, server);
  if (saveServerInDomainError) {
    const m = `Error saving server in domain ${saveServerInDomainError}`;
    send(chatId, m);
    return m;
  }
  send(chatId, t.domainBought.replace('{{domain}}', domain));
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
  log(req?.hostname + req?.originalUrl);

  // Validations
  const ref = req?.query?.ref;
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
  send(chatId, t.planSubscribed.replace('{{plan}}', plan));

  // Logs
  res.send(html());
  del(state, chatId);
  del(chatIdOfPayment, ref);
  const name = await get(nameOf, chatId);
  set(payments, ref, `Bank, Plan, ${plan}, $${priceOf[plan]}, ${chatId}, ${name}, ${new Date()}`);
});
app.get('/bank-payment-for-domain', async (req, res) => {
  log(req?.hostname + req?.originalUrl);

  // Validations
  const ref = req?.query?.ref;
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

//
app.get('/crypto-payment-for-subscription', async (req, res) => {
  log(req?.hostname + req?.originalUrl);

  // Validations
  const ref = req?.query?.ref;
  const coin = req?.query?.coin;
  const value_coin = req?.query?.value_forwarded_coin;

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
  send(chatId, t.planSubscribed.replace('{{plan}}', plan));

  // Logs
  res.send(html());
  del(state, chatId);
  const date = new Date();
  del(chatIdOfPayment, ref);
  const name = await get(nameOf, chatId);
  set(payments, ref, `Crypto, Plan, ${plan}, $${priceOf[plan]}, ${chatId}, ${name}, ${date}, ${value_coin} ${coin}`);
});
app.get('/crypto-payment-for-domain', async (req, res) => {
  log(req?.hostname + req?.originalUrl);

  // Validations
  const ref = req?.query?.ref;
  const coin = req?.query?.coin;
  const value_coin = req?.query?.value_forwarded_coin;
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

  // TODO: do some thing better than delete to be high quality
  del(state, chatId);
  const date = new Date();
  del(chatIdOfPayment, ref);
  const name = await get(nameOf, chatId);
  const chosenDomainPrice = info?.chosenDomainPrice;
  set(payments, ref, `Crypto,Domain,${domain},$${chosenDomainPrice},${chatId},${name},${date},${value_coin} ${coin}`);
});
app.get('/crypto-wallet', async (req, res) => {
  log(req?.hostname + req?.originalUrl);
  // Validations
  const refReceived = req?.query?.ref;
  const coin = req?.query?.coin;
  const value_coin = req?.query?.value_forwarded_coin; // ? value_coin or coin with
  const chatId = await get(chatIdOfPayment, refReceived);
  const info = await get(state, chatId);
  const ref = info?.ref;
  const usdIn = Number(await convert(value_coin, coin, 'usd'));
  log(`crypto-wallet ref: ${ref} chatId: ${chatId}`);
  if (!(ref && ref === refReceived)) {
    log(t.payError);
    return res.send(html(t.payError));
  }

  const wallet = await get(walletOf, chatId);
  const usdBalance = (wallet?.usdIn || 0) + usdIn;

  send(chatId, t.showWallet(usdBalance, 0));
  set(walletOf, chatId, 'usdIn', usdBalance);
  send(chatId, t.confirmationDepositCrypto(value_coin + ' ' + tickerViewOf[coin], usdIn));

  // Logs
  res.send(html());
  const date = new Date();
  del(chatIdOfPayment, ref);
  set(state, chatId, 'ref', null);
  const name = await get(nameOf, chatId);
  set(payments, ref, `Crypto,Wallet,wallet,$${usdIn},${chatId},${name},${date},${value_coin} ${coin}`);
});

//
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
  log(req?.hostname + req?.originalUrl);

  const id = req?.params?.id;
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
    log(`Server ran away!\nhttp://localhost:${port}`);
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
      send(TELEGRAM_DEV_CHAT_ID, message, { parse_mode: 'HTML' }).catch(() => {});
      send(TELEGRAM_ADMIN_CHAT_ID, message, { parse_mode: 'HTML' });
    });
    //
  }
};

tryConnectReseller();
