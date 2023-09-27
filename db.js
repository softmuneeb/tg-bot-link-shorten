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

module.exports = { updateLinksOf, getShortenedLinks };
