import express from 'express';
import cors from 'cors';
import path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

// Startup guard — crash early rather than silently failing in production
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is not set. Refusing to start in production.');
  process.exit(1);
}

import torrentRoutes from './routes/torrent.js';
import streamRoutes from './routes/stream.js';
import downloadRoutes from './routes/download.js';
import usageRoutes from './routes/usage.js';
import { initTempStorage, startCleanupSweep } from './tempStorage.js';
import { generateToken, authenticateToken } from './auth.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize temp storage on startup
initTempStorage();

// Start background cleanup sweep (removes stale HLS sessions every 5min)
startCleanupSweep();

// CORS: allow the main domain and all subdomains (covers Cloudflare Pages preview deployments)
const ALLOWED_ORIGINS = [
  /^https?:\/\/([\w-]+\.)?shamstailors\.com$/,
  /^https?:\/\/([\w-]+\.)?torrentstream\.pages\.dev$/,
];

app.use(cors({
  origin: '*',
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

// Secure cache default: every route starts with no-store.
// Individual routes that are safe to cache will explicitly override this.
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, private');
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

// Torrent management (both /api/torrent and /api/torrents for compatibility)
app.use('/api/torrent', torrentRoutes);
app.use('/api/torrents', torrentRoutes);

// Stream pipeline (direct range stream + stats)
app.use('/api/stream', streamRoutes);

// Platform usage stats
app.use('/api/usage', usageRoutes);

// Download route (raw file download to user device)
app.use('/download', downloadRoutes);

// Serve HLS segments as static files.
// .ts segments are immutable once written — Cloudflare will cache them at the edge.
// .m3u8 playlists change as new segments appear — never cache.
app.use('/hls', express.static('/tmp/torrentstream/hls', {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache, no-store');
    } else if (filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/MP2T');
      // public + s-maxage: Cloudflare edge caches segments for 1h.
      // Segments are content-addressed (seg0001.ts never changes once written).
      res.setHeader('Cache-Control', 'public, s-maxage=3600, immutable');
    }
  }
}));

// Health check — safe to cache at CF edge for 30s.
// Cloudflare will serve cached responses; GCP only gets hit once every 30s.
app.get('/api/health', (req, res) => {
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=10');
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
  console.log(`  ➜ Stream:   http://localhost:${PORT}/api/stream/direct/:torrentId/:fileIndex`);
  console.log(`  ➜ Download: http://localhost:${PORT}/download/:torrentId/:fileIndex`);
  console.log(`  ➜ Health:   http://localhost:${PORT}/api/health`);
  console.log('');
});
