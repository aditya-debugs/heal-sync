// backend/server.js
require('dotenv').config(); // Load environment variables first

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

// Database
const { connectDB, getConnectionStatus } = require('./config/database');

// Routes
const { initAgents, setLogSender } = require('./agents/initAgents_DB'); // MongoDB version
const stateRoutes = require('./routes/stateRoutes');
const authRoutes = require('./routes/authRoutes');
const entityRoutes = require('./routes/entityRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { attachIO, getLogs, sendLog } = require('./logger');

const app = express();
app.use(cors());
app.use(express.json());

// HTTP + Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // in production, set specific frontend URL
  },
});

// ✅ connect Socket.io to logger
attachIO(io);

// ✅ give agents the logger's sendLog function
setLogSender(sendLog);

// ✅ REST routes
app.use('/api/auth', authRoutes); // Authentication & Registration
app.use('/api/entities', entityRoutes); // Entity management
app.use('/api/analytics', analyticsRoutes); // Analytics & Heatmap
app.use('/api', stateRoutes(null, getLogs, sendLog)); // State routes (MongoDB-powered)

// Basic health check
app.get('/', (req, res) => {
  res.send('HealSync backend is running');
});

// Health check with database status
app.get('/health', (req, res) => {
  res.json({
    status: 'running',
    database: getConnectionStatus() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Frontend connected:', socket.id);
  socket.emit('connected', { msg: 'Connected to HealSync backend' });
});

// Start server and initialize agents
const PORT = process.env.PORT || 4000;

async function startServer() {
  // Wait for database to connect
  await connectDB();
  
  // Start agents (they will run in intervals)
  console.log('🚀 Initializing AI agents...');
  await initAgents();
  
  // Start HTTP server with error handling
  server.listen(PORT, () => {
    console.log(`✅ Backend server listening on port ${PORT}`);
    console.log(`📊 Database: ${getConnectionStatus() ? 'Connected' : 'Fallback Mode'}`);
    console.log(`🤖 Agents: Running`);
  });

  // Handle port already in use error
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use!`);
      console.log('\n💡 Fix this by running:');
      console.log(`   lsof -ti:${PORT} | xargs kill -9`);
      console.log('   OR');
      console.log('   npm run kill-port\n');
      process.exit(1);
    } else {
      console.error('❌ Server error:', error);
      process.exit(1);
    }
  });
}

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
