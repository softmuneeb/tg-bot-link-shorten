const updateLinksOf = async (linksOf, chatId, data) => {
  linksOf[chatId] = (linksOf[chatId] || []).concat(data);
};

const getShortenedLinks = async (linksOf, chatId, clicksOn) => {
  return !linksOf[chatId]
    ? []
    : linksOf[chatId].map(
        d =>
          `${clicksOn[d.shortenedURL] || 0} ${clicksOn[d.shortenedURL] === 1 ? 'click' : 'clicks'} → ${
            d.shortenedURL
          } → ${d.url}\n`,
      );
};

function getAnalyticsData(clicksOf) {
  let res = `Total short links: ${totalShortLinks}\n`;
  for (const key in clicksOf) {
    res += `Clicks in ${key}: ${clicksOf[key]}\n`;
  }

  return res;
}

const increment = async (key, value) => {
  key[value] = (key[value] || 0) + 1;
};

const get = (key, value, valueInside) => {
  if (valueInside) {
    return key[value] && key[value][valueInside];
  }

  return key[value];
};

const getAll = key => {
  return key;
};
const del = (table, key, value) => {
  if (!value) {
    delete table[key];
    return;
  }
  table[key] && delete table[key][value];
};

const set = (table, key, value, valueInside) => {
  if (valueInside) {
    table[key] && (table[key][value] = valueInside);
    return;
  }

  table[key] = value;
};
const add = (users, username) => {
  users.push(username);
};

module.exports = { updateLinksOf, getShortenedLinks, getAnalyticsData, increment, get, getAll, set, add, del };
