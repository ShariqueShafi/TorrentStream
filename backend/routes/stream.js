import express from 'express';
import { getTorrent, detectMimeType } from '../torrentManager.js';
import { getTempStats } from '../tempStorage.js';

const router = express.Router();

/**
 * GET /api/stream/direct/:torrentId/:fileIndex
 * Direct HTTP range stream for native video playback without transcoding.
 */
router.get('/direct/:torrentId/:fileIndex', (req, res) => {
  const { torrentId, fileIndex } = req.params;
  const idx = parseInt(fileIndex);

  const torrent = getTorrent(torrentId);
  if (!torrent) {
    return res.status(404).json({ error: 'Torrent not found.' });
  }

  const file = torrent.files[idx];
  if (!file) {
    return res.status(404).json({ error: 'File not found.' });
  }

  // Prioritize this file
  file.select();

  const mimeType = detectMimeType(file.name);
  
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
    const chunkSize = end - start + 1;

    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${file.length}`);
    res.setHeader('Content-Length', chunkSize);

    const stream = file.createReadStream({ start, end });
    stream.pipe(res);
    stream.on('error', (err) => {
      console.error('[Stream] Range stream error:', err.message);
      if (!res.headersSent) res.status(500).end();
    });
  } else {
    res.setHeader('Content-Length', file.length);
    const stream = file.createReadStream();
    stream.pipe(res);
    stream.on('error', (err) => {
      console.error('[Stream] Stream error:', err.message);
      if (!res.headersSent) res.status(500).end();
    });
  }
});

/**
 * GET /api/stream/stats
 */
router.get('/stats', (req, res) => {
  res.json(getTempStats());
});

// Mock legacy endpoints to prevent errors during transition
router.post('/:torrentId/:fileIndex', (req, res) => {
  const { torrentId, fileIndex } = req.params;
  res.json({
    status: 'ready',
    hlsUrl: `/api/stream/direct/${torrentId}/${fileIndex}`
  });
});

router.get('/status/:torrentId/:fileIndex', (req, res) => {
  const { torrentId, fileIndex } = req.params;
  res.json({
    status: 'ready',
    hlsUrl: `/api/stream/direct/${torrentId}/${fileIndex}`,
    transcodePercent: 100,
    transcodeComplete: true
  });
});

router.delete('/session/:torrentId/:fileIndex', (req, res) => {
  res.json({ success: true, message: `Session cleaned up.` });
});

export default router;
