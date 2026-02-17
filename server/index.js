const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./src/database');

// Models
const User = require('./src/models/User');
const Jersey = require('./src/models/Jersey');
const Message = require('./src/models/Message');
const JerseyLike = require('./src/models/JerseyLike');
const CollectionItem = require('./src/models/CollectionItem');
const PendingUser = require('./src/models/PendingUser');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploads - allow override via env var
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));

// Routes will be added here
const authRoutes = require('./src/routes/auth');
const entityRoutes = require('./src/routes/entities');
const uploadRoutes = require('./src/routes/upload');

app.use('/api/auth', authRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/upload', uploadRoutes);

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  
  // Handle SPA routing - send index.html for any unknown route
  // Using app.use with a callback matches everything and avoids path-to-regexp issues in Express 5
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Socket.io for realtime updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible in routes
app.set('io', io);

// Sync database and start server
const PORT = process.env.PORT || 3001;

async function checkAndPromoteAdmin() {
  try {
    // Check Pending Users
    const pendingUsers = await PendingUser.findAll();
    for (const pUser of pendingUsers) {
      const data = pUser.data || {};
      // Check for display_name 'Admin' (case insensitive if needed, but strict is safer for now)
      if (data.display_name === 'Admin') {
        console.log('Found Pending Admin user. Promoting...');
        await User.create({
          email: pUser.email,
          password: pUser.password,
          role: 'admin',
          data: { ...data, role: 'admin' }
        });
        await pUser.destroy();
        console.log('Admin user promoted and approved.');
      }
    }

    // Check Existing Users
    const users = await User.findAll();
    for (const user of users) {
      const data = user.data || {};
      if (data.display_name === 'Admin' && user.role !== 'admin') {
        console.log('Found existing User "Admin". Updating role...');
        user.role = 'admin';
        user.data = { ...data, role: 'admin' };
        await user.save();
        console.log('User "Admin" is now an admin.');
      }
    }
  } catch (err) {
    console.error('Error promoting admin:', err);
  }
}

sequelize.sync({ alter: true }).then(async () => {
  await checkAndPromoteAdmin();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Unable to connect to the database:', err);
});
