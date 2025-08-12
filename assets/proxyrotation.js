const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { performance } = require('perf_hooks');

const proxySources = [
  'https://api.proxyscrape.com/v3/free-proxy-list/get?request=displayproxies&protocol=http',
  'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt',
  'https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/http.txt',
  'https://raw.githubusercontent.com/roosterkid/openproxylist/main/http.txt',
  'https://raw.githubusercontent.com/jetkai/proxy-list/main/online-proxies/txt/proxies-http.txt',
  'https://raw.githubusercontent.com/almroot/proxylist/master/list.txt'
];

let proxies = [];
let activeProxies = new Map();
let lastUpdate = 0;
let updateInProgress = false;

const testProxy = async (proxyUrl) => {
  try {
    const start = performance.now();
    const agent = proxyUrl.startsWith('socks') ?
      new SocksProxyAgent(proxyUrl) :
      new HttpsProxyAgent(proxyUrl);
    
    const response = await axios.get('https://www.google.com', {
      httpsAgent: agent,
      timeout: 5000
    });
    
    if (response.status === 200) {
      const latency = performance.now() - start;
      activeProxies.set(proxyUrl, {
        latency: latency,
        lastUsed: 0
      });
      return true;
    }
  } catch (error) {
    // Proxy tidak valid
  }
  return false;
};

const updateProxies = async () => {
  if (updateInProgress) return;
  updateInProgress = true;
  
  try {
    const newProxies = new Set();
    
    // Ambil proxy dari semua sumber
    for (const source of proxySources) {
      try {
        const response = await axios.get(source, { timeout: 10000 });
        const proxyList = response.data.split('\n')
          .map(line => line.trim())
          .filter(line => line);
        
        proxyList.forEach(proxy => newProxies.add(proxy));
      } catch (error) {
        console.error(`Failed to fetch proxies from ${source}: ${error.message}`);
      }
    }
    
    // Uji semua proxy baru
    const testPromises = [];
    for (const proxy of newProxies) {
      if (!activeProxies.has(proxy)) {
        testPromises.push(testProxy(`http://${proxy}`));
      }
    }
    
    await Promise.all(testPromises);
    lastUpdate = Date.now();
    console.log(`Proxy list updated. Total active proxies: ${activeProxies.size}`);
  } catch (error) {
    console.error(`Proxy update failed: ${error.message}`);
  } finally {
    updateInProgress = false;
  }
};

const initProxies = async () => {
  if (activeProxies.size === 0 || Date.now() - lastUpdate > 600000) {
    await updateProxies();
  }
  
  // Jadwalkan update berkala
  setInterval(updateProxies, 600000);
};

const getRandomProxy = () => {
  if (activeProxies.size === 0) return null;
  
  // Pilih proxy dengan latency terendah yang belum digunakan baru-baru ini
  const now = Date.now();
  let bestProxy = null;
  let bestScore = Infinity;
  
  for (const [proxy, data] of activeProxies.entries()) {
    const timeSinceLastUse = now - data.lastUsed;
    const score = data.latency * Math.max(1, 10 - (timeSinceLastUse / 1000));
    
    if (score < bestScore) {
      bestScore = score;
      bestProxy = proxy;
    }
  }
  
  if (bestProxy) {
    const proxyData = activeProxies.get(bestProxy);
    proxyData.lastUsed = now;
    return bestProxy;
  }
  
  return null;
};

const activeProxyCount = () => activeProxies.size;
const totalProxyCount = () => proxies.length;

module.exports = {
  initProxies,
  getRandomProxy,
  activeProxyCount,
  totalProxyCount
};