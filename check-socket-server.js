// Check if Socket.IO server is running
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Socket.IO server is running!');
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Socket.IO server is NOT running!');
  console.error(`Error: ${e.message}`);
  console.log('Please start the Socket.IO server using: node start-socket-server.js');
});

req.end();