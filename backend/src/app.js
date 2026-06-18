const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const connectDB = require('./config/db');
const seedPolicies = require('./utils/seed');

// Routes
const authRoutes = require('./routes/auth.routes');
const submissionRoutes = require('./routes/submissions.routes');
const imageRoutes = require('./routes/images.routes');
const appealRoutes = require('./routes/appeals.routes');
const adminAppealRoutes = require('./routes/admin/appeals.routes');
const adminPolicyRoutes = require('./routes/admin/policies.routes');
const adminAnalyticsRoutes = require('./routes/admin/analytics.routes');
const adminImageRoutes = require('./routes/admin/images.routes');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,  // Required for cookies to be sent cross-origin
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Routes ─────────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/appeals', appealRoutes);
app.use('/api/admin/appeals', adminAppealRoutes);
app.use('/api/admin/policies', adminPolicyRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/images', adminImageRoutes);

// ── Health check ───────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── 404 handler ────────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ───────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  await seedPolicies();
  app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

start().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
