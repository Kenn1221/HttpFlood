const cloudscraper = require('cloudscraper');
const { Agent } = require('undici');
const { CookieJar } = require('tough-cookie');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

class ProxyAgent extends Agent {
  constructor(proxyUrl) {
    super({
      connect: {
        rejectUnauthorized: false,
        proxy: proxyUrl
      }
    });
  }
}

const bypassProtection = async (url, options, cookieJar) => {
  try {
    // Gunakan cloudscraper untuk bypass proteksi
    const scraperOptions = {
      uri: url,
      method: options.method,
      headers: options.headers,
      proxy: options.dispatcher?.options?.connect?.proxy,
      jar: cookieJar,
      challengesToSolve: 5,
      timeout: options.timeout,
      cloudflareTimeout: 10000
    };
    
    const response = await cloudscraper(scraperOptions);
    
    return {
      status: response.statusCode,
      headers: response.headers,
      body: response.body
    };
  } catch (error) {
    // Jika cloudscraper gagal, gunakan undici langsung
    try {
      const response = await fetch(url, options);
      return {
        status: response.status,
        headers: Object.fromEntries(response.headers),
        body: await response.text()
      };
    } catch (fallbackError) {
      throw fallbackError;
    }
  }
};

module.exports = {
  bypassProtection,
  ProxyAgent
};