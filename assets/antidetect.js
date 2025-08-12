const { generateTLSFingerprint } = require('tls-fingerprint');
const { generate: generateFingerprint } = require('fingerprint-generator');
const { generate: generateHeader } = require('header-generator');

const generateAntiDetectHeaders = (userAgent) => {
  // Generate browser fingerprint
  const fingerprint = generateFingerprint({
    browsers: [
      { name: 'chrome', minVersion: 100, maxVersion: 124 },
      { name: 'edge', minVersion: 100, maxVersion: 124 },
      { name: 'firefox', minVersion: 115, maxVersion: 125 }
    ],
    operatingSystems: ['windows', 'linux'],
    devices: ['desktop'],
    locales: ['en-US', 'en-GB', 'en']
  });
  
  // Generate TLS fingerprint
  const tlsFingerprint = generateTLSFingerprint();
  
  // Generate headers
  const headers = generateHeader({
    browsers: [
      { name: 'chrome', minVersion: 100 },
      { name: 'edge', minVersion: 100 },
      { name: 'firefox', minVersion: 115 }
    ],
    operatingSystems: ['windows', 'linux'],
    devices: ['desktop']
  });
  
  // Gabungkan semua
  return {
    ...headers,
    'User-Agent': userAgent,
    'Accept-Language': fingerprint.fingerprint.navigator.language,
    'Sec-CH-UA': fingerprint.fingerprint.headers['sec-ch-ua'],
    'Sec-CH-UA-Mobile': fingerprint.fingerprint.headers['sec-ch-ua-mobile'],
    'Sec-CH-UA-Platform': fingerprint.fingerprint.headers['sec-ch-ua-platform'],
    'TLS-Fingerprint': tlsFingerprint,
    'X-Fingerprint': fingerprint.fingerprint,
    'X-Forwarded-For': `${generateRandomIp()}.${Math.floor(Math.random() * 255)}`,
    'X-Real-IP': `${generateRandomIp()}.${Math.floor(Math.random() * 255)}`
  };
};

const generateRandomIp = () => {
  return Array(3).fill(0).map(() => Math.floor(Math.random() * 255)).join('.');
};

module.exports = { generateAntiDetectHeaders };