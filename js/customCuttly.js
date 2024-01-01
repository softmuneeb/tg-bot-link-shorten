const axios = require('axios');
const apiKey = 'd2c0af3912c8cbba377c0785182fbb8d';
const names ="laeoan";

const createCustomShortUrlCuttly = async (longUrl) => {
  const cuttlyApiUrl = `https://cutt.ly/api/api.php?key=${apiKey}&short=${encodeURIComponent(longUrl)}&name=${names}`;

  try {    const response = await axios.get(cuttlyApiUrl);
    const { status, shortLink } = response.data.url;

    if (status === 7) {
      console.log('Short URL:', shortLink);
      return shortLink;
    } else {
      console.error('Error creating short URL:', response.data.url.msg);
    }
  } catch (error) {
    console.error('Error creating short URL:', error.message);
  }
};

// Usage

 module.exports = createCustomShortUrlCuttly;

