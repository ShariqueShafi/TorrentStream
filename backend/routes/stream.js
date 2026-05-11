import express from 'express';
import path from 'path';
import fs from 'fs';
import { getTorrent } from '../torrentManager.js';
import { liveTranscode, isPlaylistReady } from '../liveTranscoder.js';
import {
  createJobDir,
  getHLSDir,
  touchSession,
  cleanupJob,
  getTempStats,
} from '../tempStorage.js';

const router = express.Router();

// Track ongoing jobs: jobId → { status, hlsUrl, error, ffmpegProcess }
const streamJobs = new Map();

/**
 * Generate a consistent job ID from torrent + file.
 */
function jobId(torrentId, fileIndex) {
  return `${torrentId}_${fileIndex}`;
}

/**
 * POST /api/stream/:torrentId/:fileIndex
 * Starts the live torrent → FFmpeg → HLS pipeline.
 */
router.post('/:torrentId/:fileIndex', async (req, res) => {
  const { torrentId, fileIndex } = req.params;
  const idx = parseInt(fileIndex);
  const jid = jobId(torrentId, idx);

  // 1. Already streaming or ready?
  const existing = streamJobs.get(jid);
  if (existing) {
    if (existing.status === 'ready') {
      touchSession(jid);
      return res.json({ status: 'ready', hlsUrl: existing.hlsUrl });
    }
    if (existing.status === 'processing') {
      return res.json({ status: 'processing', message: 'Transcoding in progress...' });
    }
    // If previous attempt errored, allow retry by falling through
  }

  // 2. Get torrent + file
  const torrent = getTorrent(torrentId);
  if (!torrent) {
    return res.status(404).json({ error: 'Torrent not found. Re-add the magnet link.' });
  }

  const file = torrent.files[idx];
  if (!file) {
    return res.status(404).json({ error: 'File not found at that index.' });
  }

  // 3. Set up temp directory
  const hlsDir = createJobDir(jid);
  streamJobs.set(jid, { status: 'processing', hlsUrl: null, error: null, transcodeComplete: false, transcodePercent: 0 });

  // 4. Respond immediately — don't block the request
  res.json({
    status: 'started',
    message: 'Live stream pipeline started. Poll /api/stream/status/:torrentId/:fileIndex',
  });

  // 5. Start the pipeline in background
  try {
    // Select the file to start downloading from peers
    file.select();

    // Create a readable stream from the torrent file
    const inputStream = file.createReadStream();

    console.log(`[Stream] Starting live transcode: ${file.name} → ${hlsDir}`);

    // Pipe into FFmpeg
    await liveTranscode(inputStream, hlsDir, (info) => {
      if (info.event === 'playlist_ready') {
        // As soon as the first segment is ready, mark as playable
        const hlsUrl = `/hls/${jid}/index.m3u8`;
        const job = streamJobs.get(jid) || {};
        streamJobs.set(jid, { ...job, status: 'ready', hlsUrl, error: null });
        console.log(`[Stream] Playlist ready: ${hlsUrl}`);
      }
      if (info.event === 'progress') {
        const job = streamJobs.get(jid);
        if (job) job.transcodePercent = info.percent || 0;
      }
    });

    // Transcode finished — full file processed, playlist now has #EXT-X-ENDLIST
    const job = streamJobs.get(jid);
    if (job) {
      job.transcodeComplete = true;
      job.transcodePercent = 100;
      if (job.status !== 'ready') {
        job.status = 'ready';
        job.hlsUrl = `/hls/${jid}/index.m3u8`;
      }
    }
    console.log(`[Stream] Transcode complete for: ${file.name}`);
  } catch (err) {
    console.error(`[Stream] Pipeline failed for ${file.name}:`, err.message);
    streamJobs.set(jid, { status: 'error', hlsUrl: null, error: err.message });
  }
});

/**
 * GET /api/stream/status/:torrentId/:fileIndex
 * Poll this to check if the HLS playlist is ready.
 */
router.get('/status/:torrentId/:fileIndex', (req, res) => {
  const { torrentId, fileIndex } = req.params;
  const idx = parseInt(fileIndex);
  const jid = jobId(torrentId, idx);

  const job = streamJobs.get(jid);

  if (!job) {
    return res.json({ status: 'not_started' });
  }

  // Double-check: even if our callback hasn't fired, check filesystem
  if (job.status === 'processing') {
    const hlsDir = getHLSDir(jid);
    if (isPlaylistReady(hlsDir)) {
      const hlsUrl = `/hls/${jid}/index.m3u8`;
      streamJobs.set(jid, { status: 'ready', hlsUrl, error: null });
      return res.json({ status: 'ready', hlsUrl });
    }
  }

  if (job.status === 'ready') {
    touchSession(jid);
  }

  res.json({
    status: job.status,
    hlsUrl: job.hlsUrl || null,
    error: job.error || null,
    transcodeComplete: job.transcodeComplete || false,
    transcodePercent: job.transcodePercent || 0,
  });
});

/**
 * DELETE /api/session/:torrentId/:fileIndex
 * Cleanup a specific stream session and its temp files.
 */
router.delete('/session/:torrentId/:fileIndex', (req, res) => {
  const { torrentId, fileIndex } = req.params;
  const idx = parseInt(fileIndex);
  const jid = jobId(torrentId, idx);

  cleanupJob(jid);
  streamJobs.delete(jid);

  res.json({ success: true, message: `Session ${jid} cleaned up.` });
});

/**
 * GET /api/stream/stats
 * Returns temp storage stats for the UI.
 */
router.get('/stats', (req, res) => {
  res.json(getTempStats());
});

export default router;
