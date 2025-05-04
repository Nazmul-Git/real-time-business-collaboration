// Socket.IO server starter script
require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Configuration
const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000";
const port = process.env.PORT || 3001;

// Create Express app
const app = express();
app.use(cors({
  origin: clientUrl,
  methods: ["GET", "POST"],
  credentials: true
}));

// HTTP server
const httpServer = createServer(app);

// Socket.IO server configuration
const io = new Server(httpServer, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Connection manager
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Register user
  socket.on('register', (userEmail) => {
    activeUsers.set(userEmail, socket.id);
    console.log(`User ${userEmail} registered`);
  });

  // Handle messages
  socket.on('message', (message) => {
    try {
      console.log('Message received:', message);

      // Send to recipient if online
      const recipientSocketId = activeUsers.get(message.receiver);
      if (recipientSocketId) {
        socket.to(recipientSocketId).emit('message', message);
      }

      // Send delivery confirmation
      socket.emit('message-status', {
        messageId: message.id,
        status: 'delivered'
      });

      console.log('Delivery confirmation sent for message:', message.id);
    } catch (err) {
      console.error('Message handling error:', err);
    }
  });

  // Mark messages as read
  socket.on('mark-as-read', (data) => {
    console.log('Marking messages as read:', data);
    const senderSocketId = activeUsers.get(data.sender);
    if (senderSocketId && data.messageIds && Array.isArray(data.messageIds)) {
      io.to(senderSocketId).emit('message-status', {
        messageIds: data.messageIds,
        status: 'read'
      });
      console.log('Read status sent for messages:', data.messageIds);
    } else if (senderSocketId && data.messageId) {
      io.to(senderSocketId).emit('message-status', {
        messageId: data.messageId,
        status: 'read'
      });
      console.log('Read status sent for message:', data.messageId);
    }
  });

  // Handle message delivery confirmation
  socket.on('message-delivered', (data) => {
    console.log('Message delivered:', data);
    if (data && data.messageId) {
      socket.emit('message-status', {
        messageId: data.messageId,
        status: 'delivered'
      });
      console.log('Delivery status sent for message:', data.messageId);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    for (const [email, socketId] of activeUsers) {
      if (socketId === socket.id) {
        activeUsers.delete(email);
        console.log(`User ${email} disconnected`);
        break;
      }
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', connections: activeUsers.size });
});

// Start server
httpServer.listen(port, () => {
  console.log(`Socket.IO server running on port ${port}`);
  console.log(`Socket.IO endpoint: ws://localhost:${port}/socket.io`);
});