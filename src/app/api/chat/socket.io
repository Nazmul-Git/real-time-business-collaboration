require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');
const dbConnect = require('./app/lib/dbConnect');
const Message = require('./app/models/Message');
const User = require('./app/models/User');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Configuration
const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000";
const port = process.env.PORT || 8080;

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

app.prepare().then(() => {
  const server = express();
  
  // Security middleware
  server.use(helmet());
  server.use(cors({
    origin: clientUrl,
    methods: ["GET", "POST"],
    credentials: true
  }));
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));

  // Apply rate limiting to API routes
  server.use('/api/', apiLimiter);

  // HTTP server
  const httpServer = createServer(server);

  // Socket.IO server configuration
  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: clientUrl,
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true
    }
  });

  // Database connection
  dbConnect().then(() => console.log('Database connected'));

  // Connection manager
  const activeUsers = new Map();

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Register user
    socket.on('register', async (userEmail) => {
      activeUsers.set(userEmail, socket.id);
      await User.findOneAndUpdate(
        { email: userEmail },
        { status: 'online', lastSeen: new Date() }
      );
      console.log(`User ${userEmail} registered`);
    });

    // Handle messages
    socket.on('message', async (message) => {
      try {
        // Save to database
        const newMessage = new Message({
          ...message,
          timestamp: new Date(message.timestamp || Date.now())
        });
        await newMessage.save();

        // Send to recipient
        socket.to(activeUsers.get(message.receiver)).emit('message', newMessage);
        
        // Send delivery confirmation
        socket.emit('message-status', {
          messageId: message.id,
          status: 'delivered'
        });
      } catch (err) {
        console.error('Message handling error:', err);
      }
    });

    // Mark messages as read
    socket.on('mark-as-read', async (data) => {
      await Message.updateMany(
        { _id: { $in: data.messageIds } },
        { status: 'read' }
      );
      io.to(activeUsers.get(data.sender)).emit('message-status', {
        messageIds: data.messageIds,
        status: 'read'
      });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      for (const [email, socketId] of activeUsers) {
        if (socketId === socket.id) {
          activeUsers.delete(email);
          await User.findOneAndUpdate(
            { email },
            { status: 'offline', lastSeen: new Date() }
          );
          console.log(`User ${email} disconnected`);
          break;
        }
      }
    });
  });

  // REST API endpoints
  server.get('/api/users', async (req, res) => {
    try {
      const users = await User.find({}, 'name email status lastSeen');
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  server.get('/api/messages/:userId', async (req, res) => {
    try {
      const messages = await Message.find({
        $or: [
          { sender: req.params.userId },
          { receiver: req.params.userId }
        ]
      }).sort({ timestamp: 1 });
      res.json(messages);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  // Health check
  server.get('/health', (req, res) => {
    res.json({ status: 'ok', connections: activeUsers.size });
  });

  // Next.js request handler
  server.all('*', (req, res) => handle(req, res));

  // Start server
  httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Socket.IO endpoint: ws://localhost:${port}/socket.io`);
  });
});