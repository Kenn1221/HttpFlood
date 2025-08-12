document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const urlInput = document.getElementById('url');
  const threadsInput = document.getElementById('threads');
  const durationInput = document.getElementById('duration');
  const useBypass = document.getElementById('useBypass');
  const useProxy = document.getElementById('useProxy');
  const useAntiDetect = document.getElementById('useAntiDetect');
  const lastErrorSpan = document.getElementById('lastError');
  
  const socket = io();
  
  // Socket.io event listeners
  socket.on('stats_update', (data) => {
    document.getElementById('requests').textContent = data.totalRequests;
    document.getElementById('success').textContent = data.successCount;
    document.getElementById('errors').textContent = data.errorCount;
    document.getElementById('activeThreads').textContent = data.activeThreads;
    document.getElementById('rps').textContent = data.rps;
    document.getElementById('proxyCount').textContent = data.activeProxies;
    document.getElementById('proxyTotal').textContent = data.totalProxies;
  });
  
  socket.on('time_update', (time) => {
    document.getElementById('remainingTime').textContent = time;
  });
  
  socket.on('attack_stopped', () => {
    stopAttackUI();
    socket.emit('get_proxy_stats');
  });
  
  socket.on('error', (error) => {
    lastErrorSpan.textContent = error.substring(0, 150) + (error.length > 150 ? '...' : '');
  });
  
  socket.on('proxy_stats', (stats) => {
    document.getElementById('proxyCount').textContent = stats.active;
    document.getElementById('proxyTotal').textContent = stats.total;
  });
  
  startBtn.addEventListener('click', () => {
    const targetUrl = urlInput.value;
    const threads = parseInt(threadsInput.value);
    const duration = parseInt(durationInput.value);
    
    if (!targetUrl) {
      alert('Masukkan URL target!');
      return;
    }
    
    startAttackUI();
    socket.emit('start_attack', {
      url: targetUrl,
      threads,
      duration,
      options: {
        bypass: useBypass.checked,
        proxy: useProxy.checked,
        antidetect: useAntiDetect.checked
      }
    });
  });
  
  stopBtn.addEventListener('click', () => {
    socket.emit('stop_attack');
    stopAttackUI();
  });
  
  function startAttackUI() {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    urlInput.disabled = true;
    threadsInput.disabled = true;
    durationInput.disabled = true;
    useBypass.disabled = true;
    useProxy.disabled = true;
    useAntiDetect.disabled = true;
    lastErrorSpan.textContent = 'None';
  }
  
  function stopAttackUI() {
    startBtn.disabled = false;
    stopBtn.disabled = true;
    urlInput.disabled = false;
    threadsInput.disabled = false;
    durationInput.disabled = false;
    useBypass.disabled = false;
    useProxy.disabled = false;
    useAntiDetect.disabled = false;
  }
  
  // Dapatkan statistik proxy saat pertama kali load
  socket.emit('get_proxy_stats');
});