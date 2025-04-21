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
const port = process.env.SOCKET_PORT || 3001;

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
    origin: [clientUrl, 'https://admin.socket.io'],
    methods: ["GET", "POST"],
    credentials: true
  }));
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));

  // Apply rate limiting to API routes
  server.use('/api/', apiLimiter);

  // HTTP server
  const httpServer = createServer(server);

  // Enhanced Socket.IO server configuration
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
    },
    allowUpgrades: true,
    serveClient: false,
    cookie: false
  });

  // Database connection with retry logic
  const connectWithRetry = async () => {
    try {
      await dbConnect();
      console.log('Database connected successfully');
    } catch (err) {
      console.error('Database connection failed, retrying in 5 seconds...', err);
      setTimeout(connectWithRetry, 5000);
    }
  };

  connectWithRetry();

  // Enhanced Connection Manager
  class ConnectionManager {
    constructor() {
      this.connections = new Map();
      this.cleanupInterval = setInterval(() => this.cleanupInactive(), 30 * 60 * 1000); // 30 minutes
    }

    addConnection(userId, socket) {
      this.connections.set(userId, {
        socketId: socket.id,
        status: 'online',
        lastActivity: new Date(),
        socket: socket
      });
      console.log(`User ${userId} connected`);
    }

    removeConnection(userId) {
      if (this.connections.delete(userId)) {
        console.log(`User ${userId} disconnected`);
        return true;
      }
      return false;
    }

    getConnection(userId) {
      return this.connections.get(userId);
    }

    updateActivity(userId) {
      const connection = this.getConnection(userId);
      if (connection) {
        connection.lastActivity = new Date();
      }
    }

    cleanupInactive(hours = 1) {
      const now = new Date();
      const inactiveUsers = [];
      
      this.connections.forEach((connection, userId) => {
        if (now - connection.lastActivity > hours * 3600000) {
          inactiveUsers.push(userId);
          this.removeConnection(userId);
        }
      });

      return inactiveUsers;
    }

    destroy() {
      clearInterval(this.cleanupInterval);
    }
  }

  const connectionManager = new ConnectionManager();

  // Socket.IO events with enhanced error handling
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Register user with their email as ID
    socket.on('register', async (userEmail) => {
      try {
        if (!userEmail || typeof userEmail !== 'string') {
          throw new Error('Invalid user email');
        }

        connectionManager.addConnection(userEmail, socket);
        socket.join(userEmail);
        
        await User.findOneAndUpdate(
          { email: userEmail },
          { 
            status: 'online',
            lastSeen: new Date()
          },
          { upsert: false }
        );
        
        console.log(`User ${userEmail} registered successfully`);
      } catch (err) {
        console.error('Registration error:', err);
        socket.emit('error', { message: 'Registration failed' });
      }
    });

    // Handle incoming messages with validation
    socket.on('message', async (message) => {
      try {
        // Basic validation
        if (!message || !message.receiver || !message.content) {
          throw new Error('Invalid message format');
        }

        // Save to database
        const newMessage = new Message({
          ...message,
          timestamp: new Date(message.timestamp || Date.now())
        });
        await newMessage.save();

        // Emit to recipient
        socket.to(message.receiver).emit('message', newMessage);

        // Send delivery confirmation to sender
        socket.emit('message-status', {
          messageId: message.id,
          status: 'delivered'
        });

        // Update activity
        if (message.sender) {
          connectionManager.updateActivity(message.sender);
        }
      } catch (err) {
        console.error('Message handling error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle disconnections
    socket.on('disconnect', async (reason) => {
      console.log('Client disconnected:', socket.id, 'Reason:', reason);
      
      for (const [userEmail, connection] of connectionManager.connections) {
        if (connection.socketId === socket.id) {
          connectionManager.removeConnection(userEmail);
          
          try {
            await User.findOneAndUpdate(
              { email: userEmail },
              { 
                status: 'offline',
                lastSeen: new Date()
              }
            );
          } catch (err) {
            console.error('Status update error:', err);
          }
          break;
        }
      }
    });

    // Error handling
    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
  });

  // API endpoints with improved error handling
  server.get('/api/users', async (req, res) => {
    try {
      const users = await User.find({}, 'name email status lastSeen').lean();
      res.json(users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      res.status(500).json({ 
        error: 'Failed to fetch users',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

  server.get('/api/messages/:userId', async (req, res) => {
    try {
      if (!req.params.userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const messages = await Message.find({
        $or: [
          { sender: req.params.userId },
          { receiver: req.params.userId }
        ]
      }).sort({ timestamp: 1 }).lean();

      res.json(messages);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      res.status(500).json({ 
        error: 'Failed to fetch messages',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

  // Health check endpoint
  server.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy',
      connections: connectionManager.connections.size,
      uptime: process.uptime(),
      timestamp: new Date()
    });
  });

  // Handle all other requests by Next.js
  server.all('*', (req, res) => handle(req, res));

  // Start the server with error handling
  httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Socket.IO endpoint: ws://localhost:${port}/socket.io`);
  }).on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down server...');
    
    try {
      // Update all connected users to offline
      const userEmails = Array.from(connectionManager.connections.keys());
      await User.updateMany(
        { email: { $in: userEmails } },
        { status: 'offline', lastSeen: new Date() }
      );
      
      connectionManager.destroy();
      httpServer.close(() => {
        console.log('Server shut down gracefully');
        process.exit(0);
      });
    } catch (err) {
      console.error('Shutdown error:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
});