require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const http       = require('http');
const { Server } = require('socket.io');
const connectDB  = require('./config/db');

connectDB();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    /\.vercel\.app$/
  ],
  credentials: true
}));

app.use(express.json());

// ─── Test Route ───────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '🩸 BloodBridge API is running!' });
});

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// ─── Routes ───────────────────────────────────────────────
try {
  app.use('/api/auth',         require('./routes/authRoutes'));
  console.log('✅ authRoutes loaded');
} catch(e) { console.error('❌ authRoutes error:', e.message); }

try {
  app.use('/api/donors',       require('./routes/donorRoutes'));
  console.log('✅ donorRoutes loaded');
} catch(e) { console.error('❌ donorRoutes error:', e.message); }

try {
  app.use('/api/blogs',        require('./routes/blogRoutes'));
  console.log('✅ blogRoutes loaded');
} catch(e) { console.error('❌ blogRoutes error:', e.message); }

try {
  app.use('/api/requests',     require('./routes/requestRoutes'));
  console.log('✅ requestRoutes loaded');
} catch(e) { console.error('❌ requestRoutes error:', e.message); }

try {
  app.use('/api/notifications',require('./routes/notificationRoutes'));
  console.log('✅ notificationRoutes loaded');
} catch(e) { console.error('❌ notificationRoutes error:', e.message); }

try {
  app.use('/api/bookmarks',    require('./routes/bookmarkRoutes'));
  console.log('✅ bookmarkRoutes loaded');
} catch(e) { console.error('❌ bookmarkRoutes error:', e.message); }

try {
  app.use('/api/chat',         require('./routes/chatRoutes'));
  console.log('✅ chatRoutes loaded');
} catch(e) { console.error('❌ chatRoutes error:', e.message); }

try {
  app.use('/api/admin',        require('./routes/adminRoutes'));
  console.log('✅ adminRoutes loaded');
} catch(e) { console.error('❌ adminRoutes error:', e.message); }

try {
  app.use('/api/responses',    require('./routes/responseRoutes'));
  console.log('✅ responseRoutes loaded');
} catch(e) { console.error('❌ responseRoutes error:', e.message); }

try {
  app.use('/api/leaderboard',  require('./routes/leaderboardRoutes'));
  console.log('✅ leaderboardRoutes loaded');
} catch(e) { console.error('❌ leaderboardRoutes error:', e.message); }

try {
  app.use('/api/reviews',      require('./routes/reviewRoutes'));
  console.log('✅ reviewRoutes loaded');
} catch(e) { console.error('❌ reviewRoutes error:', e.message); }

// ─── Global Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Global Error:', err.message);
  res.status(500).json({ message: err.message });
});

// ─── Socket.io ────────────────────────────────────────────
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('user_online', (userId) => {
    onlineUsers.set(String(userId), socket.id);
    io.emit('online_users', Array.from(onlineUsers.keys()));
    console.log(`User online: ${userId}`);
  });

  socket.on('send_message', async ({ senderId, receiverId, content }) => {
    try {
      const Message = require('./models/Message');

      const message = await Message.create({
        sender:   senderId,
        receiver: receiverId,
        content
      });

      const populated = await Message.findById(message._id)
        .populate('sender',   'name phone bloodGroup')
        .populate('receiver', 'name phone bloodGroup');

      const receiverSocket = onlineUsers.get(String(receiverId));
      if (receiverSocket) {
        io.to(receiverSocket).emit('receive_message', {
          _id:       populated._id,
          sender:    populated.sender,
          receiver:  populated.receiver,
          content:   populated.content,
          createdAt: populated.createdAt
        });
      }

      socket.emit('message_sent', {
        _id:       populated._id,
        sender:    populated.sender,
        receiver:  populated.receiver,
        content:   populated.content,
        createdAt: populated.createdAt
      });

      console.log(`Message: ${senderId} → ${receiverId}: ${content}`);

    } catch (err) {
      console.error('send_message error:', err.message);
      socket.emit('message_error', { error: err.message });
    }
  });

  socket.on('typing', ({ senderId, receiverId }) => {
    const receiverSocket = onlineUsers.get(String(receiverId));
    if (receiverSocket) {
      io.to(receiverSocket).emit('user_typing', { senderId });
    }
  });

  socket.on('stop_typing', ({ senderId, receiverId }) => {
    const receiverSocket = onlineUsers.get(String(receiverId));
    if (receiverSocket) {
      io.to(receiverSocket).emit('user_stop_typing', { senderId });
    }
  });

  socket.on('disconnect', () => {
    onlineUsers.forEach((sid, userId) => {
      if (sid === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User offline: ${userId}`);
      }
    });
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });
});

// ─── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 8000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is busy!`);
    process.exit(1);
  }
});