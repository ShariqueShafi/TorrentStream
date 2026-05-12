import express from 'express';
import cors from 'cors';
import path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

import torrentRoutes from './routes/torrent.js';
import streamRoutes from './routes/stream.js';
import downloadRoutes from './routes/download.js';
import usageRoutes from './routes/usage.js';
import { initTempStorage, startCleanupSweep, getHLSDir } from './tempStorage.js';
import { generateToken, authenticateToken } from './auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize temp storage on startup
initTempStorage();

// Start background cleanup sweep (removes stale sessions every 5min)
startCleanupSweep();

const CORS_ORIGIN = process.env.NODE_ENV === 'production'
  ? 'https://shamstailors.com'
  : '*';

app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Range', 'Authorization'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
}));
app.use(express.json());

// Request logging (skip noisy HLS segment requests)
app.use((req, res, next) => {
  if (!req.url.startsWith('/hls/') && !req.url.includes('/status/')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// ---- Routes ----

// Auth
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASSWORD) {
    const token = generateToken(username);
    return res.json({ token, username });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Torrent management (Protected for POST and DELETE)
// We'll apply protection inside the router or here
app.use('/api/torrent', torrentRoutes);
app.use('/api/torrents', torrentRoutes);

// Stream pipeline (start, status, session cleanup)
app.use('/api/stream', streamRoutes);

// Platform usage stats
app.use('/api/usage', usageRoutes);

// Download route (raw file download to user device)
app.use('/download', downloadRoutes);

// Serve HLS segments as static files
// The liveTranscoder writes to /tmp/torrentstream/hls/<jobId>/
// This serves them at /hls/<jobId>/index.m3u8, /hls/<jobId>/seg0001.ts, etc.
app.use('/hls', express.static('/tmp/torrentstream/hls', {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache, no-store');  // Live playlist changes
    } else if (filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/MP2T');
      res.setHeader('Cache-Control', 'max-age=3600');  // Segments are immutable
    }
  }
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`[Error]`, err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log('');
  console.log('  🎬 TorrentStream — Live Streaming');
  console.log(`  ➜ Server:   http://localhost:${PORT}`);
  console.log(`  ➜ API:      http://localhost:${PORT}/api/torrent`);
  console.log(`  ➜ Stream:   http://localhost:${PORT}/api/stream/:torrentId/:fileIndex`);
  console.log(`  ➜ Download: http://localhost:${PORT}/download/:torrentId/:fileIndex`);
  console.log(`  ➜ HLS:      http://localhost:${PORT}/hls/<jobId>/index.m3u8`);
  console.log(`  ➜ Health:   http://localhost:${PORT}/api/health`);
  console.log('');
});
