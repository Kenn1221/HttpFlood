const UserAgent = require('user-agents');

// Cache 1000 user agents untuk performa tinggi
const userAgentCache = Array(1000).fill(null).map(() => {
  const ua = new UserAgent({
    deviceCategory: 'desktop',
    platform: Math.random() > 0.5 ? 'Win32' : 'Linux x86_64',
    vendor: 'Google Inc.'
  });
  
  return ua.toString();
});

const getRandomUA = () => {
  return userAgentCache[Math.floor(Math.random() * userAgentCache.length)];
};

module.exports = { getRandomUA };