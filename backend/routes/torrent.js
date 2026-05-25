import express from 'express';
import {
  addTorrent,
  getTorrent,
  listTorrents,
  removeTorrent,
  getClientStats,
  formatTorrentInfo,
} from '../torrentManager.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  const { magnet } = req.body;
  if (!magnet) return res.status(400).json({ error: 'Magnet link is required' });
  if (!magnet.startsWith('magnet:') && !magnet.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid magnet link or torrent URL' });
  }
  try {
    console.log(`[API] Adding torrent: ${magnet.substring(0, 60)}...`);
    const info = await addTorrent(magnet);
    res.json(info);
  } catch (err) {
    console.error(`[API] Error adding torrent:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  try {
    const torrents = listTorrents();
    const stats = getClientStats();
    // Cache at CF edge for 3s — enough to absorb the 2-4s polling loop
    // without becoming stale. stale-while-revalidate lets CF serve the
    // cached copy instantly while fetching fresh data in the background.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3, stale-while-revalidate=2');
    res.json({ torrents, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  const torrent = getTorrent(req.params.id);
  if (!torrent) return res.status(404).json({ error: 'Torrent not found' });
  try {
    // Individual torrent status is safe to cache for 3s at CF edge.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3, stale-while-revalidate=2');
    res.json(formatTorrentInfo(torrent));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const deleteFiles = req.query.keepFiles !== 'true';
  try {
    const result = await removeTorrent(req.params.id, deleteFiles);
    res.json(result);
  } catch (err) {
    if (err.message === 'Torrent not found') return res.status(404).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

export default router;
