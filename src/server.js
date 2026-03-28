require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dns = require('node:dns');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

// Fix DNS for MongoDB Atlas SRV resolution
dns.setServers(['1.1.1.1', '8.8.8.8']);
// Fix for Render blocking outbound IPv6 connections (nodemailer ENETUNREACH)
dns.setDefaultResultOrder('ipv4first');

const progressRoutes = require('./routes/progress.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const todoRoutes = require('./routes/todo.routes');
const authRoutes = require('./routes/auth.routes');
const syllabusRoutes = require('./routes/syllabus.routes');

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// Trust the reverse proxy (Render load balancer) so rate limiting identifies client IPs correctly
app.set('trust proxy', 1);

// ── Security Middleware ─────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: isProd ? undefined : false,  // Disable CSP in dev (Vite needs inline scripts)
}));

app.use(cors({
  origin: isProd ? process.env.CLIENT_URL || true : true,
  credentials: true,                                     // Allow cookies to be sent cross-origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

app.use(express.json({ limit: '1mb' }));          // Body size limit
app.use(cookieParser());                           // Parse cookies from requests

// Express 5 makes req.query a read-only getter — make it writable for mongo-sanitize
app.use((req, _res, next) => {
  Object.defineProperty(req, 'query', {
    value: { ...req.query },
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
});
app.use(mongoSanitize());                          // Prevent NoSQL injection ($gt, $ne etc.)

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/todos', todoRoutes);
// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// ── Serve React frontend in production ───────────────────────
if (isProd) {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  // Express 5 requires named wildcard parameter syntax
  app.get('/{*path}', (_, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ── Connect to MongoDB then start server ─────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
