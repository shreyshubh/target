require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const progressRoutes = require('./routes/progress.routes');

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: isProd ? process.env.CLIENT_URL || true : '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// ── API Routes ───────────────────────────────────────────────
app.use('/api/progress', progressRoutes);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// ── Serve React frontend in production ───────────────────────
if (isProd) {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  // Catch-all: send index.html for any non-API route (SPA routing)
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
