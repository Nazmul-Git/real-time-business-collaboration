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
const userRooms = new Map();   
const roomMembers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Register user
  socket.on('register', (userEmail) => {
    activeUsers.set(userEmail, socket.id);
    console.log(`User ${userEmail} registered`);
  });

  // Join room
  socket.on('join-room', ({ roomId, userEmail }) => {
    try {
      // Add user to room
      socket.join(roomId);
      
      // Track room membership
      if (!roomMembers.has(roomId)) {
        roomMembers.set(roomId, new Set());
      }
      roomMembers.get(roomId).add(userEmail);
      
      // Track user's rooms
      if (!userRooms.has(userEmail)) {
        userRooms.set(userEmail, new Set());
      }
      userRooms.get(userEmail).add(roomId);
      
      // Notify room members
      socket.to(roomId).emit('user-joined', { 
        userEmail,
        roomId,
        members: Array.from(roomMembers.get(roomId))
      });
      
      console.log(`User ${userEmail} joined room ${roomId}`);
    } catch (err) {
      console.error('Error joining room:', err);
    }
  });

  // Leave room
  socket.on('leave-room', ({ roomId, userEmail }) => {
    try {
      // Remove user from room
      socket.leave(roomId);
      
      // Update room membership
      if (roomMembers.has(roomId)) {
        roomMembers.get(roomId).delete(userEmail);
        
        // Notify remaining members
        socket.to(roomId).emit('user-left', {
          userEmail,
          roomId,
          members: Array.from(roomMembers.get(roomId))
        });
        
        // Clean up empty rooms
        if (roomMembers.get(roomId).size === 0) {
          roomMembers.delete(roomId);
        }
      }
      
      // Update user's room list
      if (userRooms.has(userEmail)) {
        userRooms.get(userEmail).delete(roomId);
        if (userRooms.get(userEmail).size === 0) {
          userRooms.delete(userEmail);
        }
      }
      
      console.log(`User ${userEmail} left room ${roomId}`);
    } catch (err) {
      console.error('Error leaving room:', err);
    }
  });

  // Room message handler
  socket.on('room-message', (message) => {
    try {
      console.log('Room message received:', message);
      
      // Broadcast to all in room except sender
      socket.to(message.roomId).emit('room-message', message);
      
      // Send delivery confirmation
      socket.emit('message-status', {
        messageId: message.id,
        status: 'delivered'
      });
      
      console.log(`Room message broadcast to room ${message.roomId}`);
    } catch (err) {
      console.error('Room message handling error:', err);
    }
  });

  // Typing indicator in room
  socket.on('room-typing', (data) => {
    try {
      socket.to(data.roomId).emit('room-typing', {
        userEmail: data.userEmail,
        isTyping: data.isTyping,
        roomId: data.roomId
      });
    } catch (err) {
      console.error('Error handling typing indicator:', err);
    }
  });

  // Original direct message handler (kept for backward compatibility)
  socket.on('message', (message) => {
    try {
      console.log('Direct message received:', message);
      const recipientSocketId = activeUsers.get(message.receiver);
      if (recipientSocketId) {
        socket.to(recipientSocketId).emit('message', message);
      }
      socket.emit('message-status', {
        messageId: message.id,
        status: 'delivered'
      });
    } catch (err) {
      console.error('Message handling error:', err);
    }
  });

  // Mark messages as read (works for both direct and room messages)
  socket.on('mark-as-read', (data) => {
    console.log('Marking messages as read:', data);
    const senderSocketId = activeUsers.get(data.sender);
    if (senderSocketId) {
      io.to(senderSocketId).emit('message-status', {
        messageIds: data.messageIds || [data.messageId],
        status: 'read'
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Clean up from all rooms
    for (const [email, socketId] of activeUsers) {
      if (socketId === socket.id) {
        // Leave all rooms this user was in
        if (userRooms.has(email)) {
          userRooms.get(email).forEach(roomId => {
            socket.leave(roomId);
            if (roomMembers.has(roomId)) {
              roomMembers.get(roomId).delete(email);
              // Notify room members
              io.to(roomId).emit('user-left', {
                userEmail: email,
                roomId,
                members: Array.from(roomMembers.get(roomId))
              });
              // Clean up empty rooms
              if (roomMembers.get(roomId).size === 0) {
                roomMembers.delete(roomId);
              }
            }
          });
          userRooms.delete(email);
        }
        
        // Remove from active users
        activeUsers.delete(email);
        console.log(`User ${email} disconnected`);
        break;
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connections: activeUsers.size,
    rooms: roomMembers.size
  });
});

// Start server
httpServer.listen(port, () => {
  console.log(`Socket.IO server running on port ${port}`);
  console.log(`Socket.IO endpoint: ws://localhost:${port}/socket.io`);
  console.log(`Active rooms: ${roomMembers.size}`);
});