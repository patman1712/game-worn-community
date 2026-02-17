const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./src/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Models
const User = require('./src/models/User');
const Jersey = require('./src/models/Jersey');
const Message = require('./src/models/Message');
const JerseyLike = require('./src/models/JerseyLike');
const CollectionItem = require('./src/models/CollectionItem');
const PendingUser = require('./src/models/PendingUser');
const SiteContent = require('./src/models/SiteContent');

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
const adminRoutes = require('./src/routes/admin'); // New admin routes

// Emergency Admin Setup Route
app.get('/api/admin/setup', async (req, res) => {
  try {
    const targetEmail = 'info@foto-scheiber.de';
    const JWT_SECRET = 'your-secret-key-change-this-in-production';
    
    // Find User
    let user = await User.findOne({ where: { email: targetEmail } });
    if (!user) {
        // Check Pending
        const pendingUser = await PendingUser.findOne({ where: { email: targetEmail } });
        if (pendingUser) {
            user = await User.create({
                email: pendingUser.email,
                password: pendingUser.password,
                role: 'admin',
                data: { ...pendingUser.data, role: 'admin' }
            });
            await pendingUser.destroy();
        }
    }

    if (!user) {
        return res.send('<h1>Error</h1><p>User not found. Please register first.</p>');
    }

    // Ensure Admin
    if (user.role !== 'admin') {
        user.role = 'admin';
        user.data = { ...user.data, role: 'admin' };
        await user.save();
    }

    // Force Password Reset to '123456' so user knows it
    const newPasswordHash = await bcrypt.hash('123456', 10);
    user.password = newPasswordHash;
    await user.save();

    // Generate Token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);

    // Return HTML to auto-login
    res.send(`
      <html>
        <body>
          <h1>Logging you in as Admin...</h1>
          <script>
            localStorage.setItem('token', '${token}');
            localStorage.setItem('user', '${JSON.stringify(user).replace(/'/g, "\\'")}' );
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
          </script>
        </body>
      </html>
    `);

  } catch (err) {
    res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

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
      // Check for display_name 'Admin' OR specific email 'info@foto-scheiber.de'
      if (data.display_name === 'Admin' || pUser.email === 'info@foto-scheiber.de') {
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
      if ((data.display_name === 'Admin' || user.email === 'info@foto-scheiber.de') && user.role !== 'admin') {
        console.log('Found existing User Admin/Email. Updating role...');
        user.role = 'admin';
        user.data = { ...data, role: 'admin' };
        await user.save();
        console.log('User is now an admin.');
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
