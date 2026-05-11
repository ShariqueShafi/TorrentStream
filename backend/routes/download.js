import express from 'express';
import { getTorrent, detectMimeType } from '../torrentManager.js';

const router = express.Router();

/**
 * GET /download/:torrentId/:fileIndex
 * Streams the raw torrent file to the browser for local device download.
 * No transcoding, no R2, no permanent storage.
 */
router.get('/:torrentId/:fileIndex', (req, res) => {
  const { torrentId, fileIndex } = req.params;
  const idx = parseInt(fileIndex);

  // 1. Get torrent
  const torrent = getTorrent(torrentId);
  if (!torrent) {
    return res.status(404).json({ error: 'Torrent not found. Re-add the magnet link.' });
  }

  // 2. Get file
  const file = torrent.files[idx];
  if (!file) {
    return res.status(404).json({ error: 'File not found at that index.' });
  }

  // 3. Select the file to prioritize downloading
  file.select();

  // 4. Set response headers for browser download
  const mimeType = detectMimeType(file.name);
  const sanitizedName = file.name.replace(/[^\w\s.\-()[\]]/g, '_');

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Length', file.length);
  res.setHeader('Content-Disposition', `attachment; filename="${sanitizedName}"`);
  res.setHeader('Accept-Ranges', 'bytes');

  // 5. Support Range requests for resumable downloads
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
      console.error('[Download] Range stream error:', err.message);
      if (!res.headersSent) res.status(500).end();
    });
  } else {
    // Full file stream
    const stream = file.createReadStream();
    stream.pipe(res);
    stream.on('error', (err) => {
      console.error('[Download] Stream error:', err.message);
      if (!res.headersSent) res.status(500).end();
    });
  }

  // 6. Log the download
  console.log(`[Download] Streaming file: ${file.name} (${(file.length / 1e6).toFixed(1)} MB)`);
});

export default router;
