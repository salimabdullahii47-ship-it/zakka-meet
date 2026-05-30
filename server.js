require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Import modules
const db = require('./db');
const auth = require('./auth');
const meetings = require('./meetings');
const recordings = require('./recordings');
const monetization = require('./monetization');
const i18n = require('./i18n');

const app = express();

// Middleware
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json());
app.use(express.static(__dirname));

// ==========================================
// ===== AUTHENTICATION API ENDPOINTS =====
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, displayName, gender, language } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = await auth.registerUser(username, email, password, displayName);
  
  if (result.success) {
    const user = auth.getUserById(result.userId);
    const token = auth.generateToken(result.userId, email);
    res.json({ 
      success: true, 
      userId: result.userId,
      token,
      user,
      message: 'Registration successful'
    });
  } else {
    res.status(400).json({ error: result.error });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const result = await auth.loginUser(email, password);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(401).json({ error: result.error });
  }
});

app.get('/api/auth/user/:userId', auth.authenticateToken, (req, res) => {
  const user = auth.getUserById(req.params.userId);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// ==========================================
// ===== USER PREFERENCES API =====
// ==========================================

app.get('/api/user/:userId/preferences', auth.authenticateToken, (req, res) => {
  const prefs = auth.getUserPreferences(req.params.userId);
  res.json(prefs || {});
});

app.post('/api/user/:userId/preferences', auth.authenticateToken, (req, res) => {
  const result = auth.updateUserPreferences(req.params.userId, req.body);
  res.json(result);
});

// ==========================================
// ===== MEETING API ENDPOINTS =====
// ==========================================

app.post('/api/meetings/create', auth.authenticateToken, (req, res) => {
  const { name, isPrivate, maxParticipants } = req.body;
  const result = meetings.createMeeting(req.userId, name, isPrivate, maxParticipants);
  res.json(result);
});

app.get('/api/meetings/:meetingId', (req, res) => {
  const meeting = meetings.getMeeting(req.params.meetingId);
  if (meeting) {
    const participants = meetings.getActiveParticipants(req.params.meetingId);
    res.json({ ...meeting, participants });
  } else {
    res.status(404).json({ error: 'Meeting not found' });
  }
});

app.get('/api/user/:userId/meetings', auth.authenticateToken, (req, res) => {
  const meetingHistory = meetings.getUserMeetingHistory(req.params.userId);
  res.json(meetingHistory);
});

// ==========================================
// ===== RECORDING API ENDPOINTS =====
// ==========================================

app.get('/api/user/:userId/recordings', auth.authenticateToken, (req, res) => {
  const userRecordings = recordings.getUserRecordings(req.params.userId);
  res.json(userRecordings);
});

app.post('/api/recordings/log', auth.authenticateToken, (req, res) => {
  const { meetingId, filePath, fileSizeMb, durationSeconds } = req.body;
  const result = recordings.saveRecording(meetingId, req.userId, filePath, fileSizeMb, durationSeconds);
  res.json(result);
});

app.get('/api/user/:userId/call-history', auth.authenticateToken, (req, res) => {
  const callHistory = recordings.getCallHistory(req.params.userId);
  res.json(callHistory);
});

// ==========================================
// ===== MONETIZATION API ENDPOINTS =====
// ==========================================

app.get('/api/pricing', (req, res) => {
  res.json(monetization.PRICING_PLANS);
});

app.get('/api/user/:userId/transactions', auth.authenticateToken, (req, res) => {
  const transactions = monetization.getUserTransactions(req.params.userId);
  res.json(transactions);
});

app.post('/api/payment/create-transaction', auth.authenticateToken, async (req, res) => {
  const { amount, type, description } = req.body;
  const result = await monetization.createTransaction(req.userId, amount, type, description);
  res.json(result);
});

// ==========================================
// ===== LOCALIZATION API =====
// ==========================================

app.get('/api/i18n/:language', (req, res) => {
  const translations = i18n.getAllTranslations(req.params.language);
  res.json(translations);
});

// Get active participants for a meeting (public)
app.get('/api/meetings/:meetingId/participants', (req, res) => {
  const participants = meetings.getActiveParticipants(req.params.meetingId);
  res.json({ participants });
});

// Authenticated: get current user from token
app.get('/api/auth/me', auth.authenticateToken, (req, res) => {
  const user = auth.getUserById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const prefs = auth.getUserPreferences(req.userId) || {};
  res.json({ user, preferences: prefs });
});

// ==========================================
// ===== STATIC PAGES =====
// ==========================================

app.get('/user-guide', (req, res) => {
  res.sendFile(path.join(__dirname, 'user-guide.html'));
});

app.get('/terms-conditions', (req, res) => {
  res.sendFile(path.join(__dirname, 'terms-conditions.html'));
});

// ==========================================
// ===== SOCKET.IO HANDLERS =====
// ==========================================

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const rooms = {}; // Store room data
const userSockets = {}; // Map userId to socketId

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Join meeting room
  socket.on('join-room', (roomId, userId) => {
    // attach userId to socket for later checks
    socket.userId = userId;
    socket.join(roomId);
    userSockets[userId] = socket.id;
    
    if (!rooms[roomId]) {
      rooms[roomId] = { participants: [], createdAt: new Date() };
    }
    
    rooms[roomId].participants.push({ userId, socketId: socket.id });
    // Persist participant join
    try {
      meetings.addParticipant(roomId, userId);
    } catch (err) {
      console.error('Error persisting participant:', err);
    }
    
    // Send a private welcome to the joining user with meeting info and preferences
    try {
      const meeting = meetings.getMeeting(roomId);
      const participants = meetings.getActiveParticipants(roomId);
      const user = auth.getUserById(userId) || { id: userId };
      const prefs = auth.getUserPreferences(userId) || {};

      socket.emit('welcome', {
        message: `Welcome ${user.displayName || user.username || userId} to ${meeting ? meeting.name : 'the meeting'}`,
        meeting: meeting || null,
        participants,
        preferences: prefs
      });
    } catch (err) {
      console.error('Error sending welcome data:', err);
    }
    
    // Broadcast user joined
    io.to(roomId).emit('user-joined', {
      userId,
      socketId: socket.id,
      participantCount: rooms[roomId].participants.length
    });

    // Emit a system chat message announcing the join
    io.to(roomId).emit('system-message', {
      type: 'join',
      text: `${auth.getUserById(userId)?.displayName || userId} joined the meeting`,
      timestamp: new Date()
    });
    
    console.log(`👤 User ${userId} joined room ${roomId}`);
  });

  // Leave meeting room
  socket.on('leave-room', (roomId, userId) => {
    socket.leave(roomId);
    
    if (rooms[roomId]) {
      rooms[roomId].participants = rooms[roomId].participants.filter(
        p => p.userId !== userId
      );
      
      // Persist participant leave
      try {
        meetings.removeParticipant(roomId, userId);
      } catch (err) {
        console.error('Error persisting participant leave:', err);
      }

      if (rooms[roomId].participants.length === 0) {
        delete rooms[roomId];
      }
    }
    
    io.to(roomId).emit('user-left', {
      userId,
      participantCount: rooms[roomId]?.participants.length || 0
    });

    // Emit a system chat message announcing the leave
    io.to(roomId).emit('system-message', {
      type: 'leave',
      text: `${auth.getUserById(userId)?.displayName || userId} left the meeting`,
      timestamp: new Date()
    });
    
    console.log(`👋 User ${userId} left room ${roomId}`);
  });

  // Handle offer/answer for peer connection
  socket.on('offer', (data) => {
    io.to(data.to).emit('offer', {
      from: socket.id,
      offer: data.offer
    });
  });

  socket.on('answer', (data) => {
    io.to(data.to).emit('answer', {
      from: socket.id,
      answer: data.answer
    });
  });

  // ICE candidates
  socket.on('ice-candidate', (data) => {
    io.to(data.to).emit('ice-candidate', {
      from: socket.id,
      candidate: data.candidate
    });
  });

  // Chat messages
  socket.on('chat-message', (data) => {
    io.to(data.room).emit('chat-message', {
      sender: data.sender,
      text: data.text,
      timestamp: new Date()
    });
  });

  // Screen sharing started
  socket.on('screen-share-started', (roomId) => {
    io.to(roomId).emit('screen-share-started', { userId: socket.id });
  });

  socket.on('screen-share-ended', (roomId) => {
    io.to(roomId).emit('screen-share-ended', { userId: socket.id });
  });

  // Recording events
  socket.on('recording-started', (data) => {
    io.to(data.roomId).emit('recording-started', {
      userId: socket.id,
      timestamp: new Date()
    });
  });

  socket.on('recording-stopped', (data) => {
    io.to(data.roomId).emit('recording-stopped', {
      userId: socket.id,
      timestamp: new Date()
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    // Find and remove user from all rooms
    Object.keys(rooms).forEach(roomId => {
      const userIndex = rooms[roomId].participants.findIndex(p => p.socketId === socket.id);
      if (userIndex !== -1) {
        const userId = rooms[roomId].participants[userIndex].userId;
        rooms[roomId].participants.splice(userIndex, 1);
        
        // Persist participant leave on disconnect
        try {
          meetings.removeParticipant(roomId, userId);
        } catch (err) {
          console.error('Error persisting participant leave on disconnect:', err);
        }

        io.to(roomId).emit('user-left', {
          userId,
          participantCount: rooms[roomId].participants.length
        });

        io.to(roomId).emit('system-message', {
          type: 'leave',
          text: `${auth.getUserById(userId)?.displayName || userId} disconnected`,
          timestamp: new Date()
        });
      }
    });

    // Remove from userSockets mapping
    Object.keys(userSockets).forEach(userId => {
      if (userSockets[userId] === socket.id) {
        delete userSockets[userId];
      }
    });
    
    console.log(`❌ User disconnected: ${socket.id}`);
  });

  // Administrative actions from meeting owner (mute, remove, pin)
  socket.on('admin-action', async (data) => {
    // data: { roomId, action: 'mute'|'remove'|'pin', targetUserId }
    try {
      const { roomId, action, targetUserId } = data || {};
      if (!roomId || !action || !targetUserId) return;

      const meeting = meetings.getMeeting(roomId);
      if (!meeting) return socket.emit('admin-action-result', { success: false, error: 'Meeting not found' });

      // Only meeting owner can perform admin actions
      if (String(meeting.owner_id) !== String(socket.userId)) {
        return socket.emit('admin-action-result', { success: false, error: 'Not authorized' });
      }

      // Handle actions
      if (action === 'remove') {
        // Persist removal
        meetings.removeParticipant(roomId, targetUserId);
        // Kick socket if connected
        const targetSocketId = userSockets[targetUserId];
        if (targetSocketId) {
          io.to(targetSocketId).emit('admin-action', { action: 'remove', roomId });
          // force leave
          io.sockets.sockets.get(targetSocketId)?.leave(roomId);
        }
        io.to(roomId).emit('system-message', { type: 'remove', text: `${targetUserId} was removed by host`, timestamp: new Date() });
        return socket.emit('admin-action-result', { success: true });
      }

      if (action === 'mute') {
        const targetSocketId = userSockets[targetUserId];
        if (targetSocketId) {
          io.to(targetSocketId).emit('admin-action', { action: 'mute' });
        }
        io.to(roomId).emit('system-message', { type: 'mute', text: `${targetUserId} was muted by host`, timestamp: new Date() });
        return socket.emit('admin-action-result', { success: true });
      }

      if (action === 'pin') {
        io.to(roomId).emit('admin-action', { action: 'pin', targetUserId });
        return socket.emit('admin-action-result', { success: true });
      }
    } catch (err) {
      console.error('Admin action error:', err);
      socket.emit('admin-action-result', { success: false, error: err.message });
    }
  });
});

// ==========================================
// ===== CATCH-ALL FOR FRONTEND ROUTING =====
// ==========================================

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// ===== SERVER START =====
// ==========================================

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Zakka Meet Pro running on port ${PORT}`);
  console.log(`Developer: Salim Abdullahi Zakka`);
  console.log(`Database initialized at: ${path.join(__dirname, 'zakka-meet.db')}`);
});
