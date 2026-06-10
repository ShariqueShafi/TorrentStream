import WebTorrent from 'webtorrent';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage path for torrent data — uses temp storage only
const TORRENT_PATH = '/tmp/torrentstream/torrents';
const STATE_FILE = path.join(__dirname, 'torrents_state.json');

// Ensure storage directory exists
if (!fs.existsSync(TORRENT_PATH)) {
  fs.mkdirSync(TORRENT_PATH, { recursive: true });
}

// WebTorrent client singleton
const client = new WebTorrent();

function saveState() {
  try {
    const state = [];
    for (const [hash, entry] of activeTorrents) {
      if (entry.torrent.magnetURI) {
        state.push(entry.torrent.magnetURI);
      } else if (entry.torrent.infoHash) {
        state.push(entry.torrent.infoHash);
      }
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state));
  } catch (err) {
    console.error('[TorrentManager] Error saving state:', err);
  }
}

// Load state on startup
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      console.log(`[TorrentManager] Restoring ${state.length} torrents from state file...`);
      for (const magnet of state) {
        // Extract infoHash from magnet URI to check against destroyed set
        const hashMatch = magnet.match?.(/xt=urn:btih:([a-zA-Z0-9]+)/i);
        const hash = hashMatch?.[1]?.toLowerCase();
        if (hash && isRecentlyDestroyed(hash)) {
          console.log(`[TorrentManager] Skipping recently-destroyed torrent: ${hash}`);
          continue;
        }
        addTorrent(magnet).catch(err => console.error(`Failed to restore ${magnet}:`, err.message));
      }
    }
  } catch (err) {
    console.error('[TorrentManager] Error loading state:', err);
  }
}


// Active torrent registry: infoHash → { torrent, lastAccessed }
const activeTorrents = new Map();

// Recently-destroyed hashes — prevents zombie resurrection during loadState
// or when WebTorrent throws a "duplicate torrent" error for a torrent that
// is still being torn down. Entries auto-expire after 60 seconds.
const destroyedHashes = new Map(); // infoHash → destroyedAt timestamp
const DESTROYED_TTL_MS = 60_000;

function markDestroyed(hash) {
  destroyedHashes.set(hash, Date.now());
}

function isRecentlyDestroyed(hash) {
  const ts = destroyedHashes.get(hash);
  if (!ts) return false;
  if (Date.now() - ts > DESTROYED_TTL_MS) {
    destroyedHashes.delete(hash);
    return false;
  }
  return true;
}

// Age-based eviction: remove torrents inactive for more than 3 days
const MAX_IDLE_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Touch the last-accessed timestamp for a torrent.
 */
function touchTorrent(infoHash) {
  const entry = activeTorrents.get(infoHash);
  if (entry) entry.lastAccessed = Date.now();
}

/**
 * MIME type detection from file extension
 */
export function detectMimeType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const mimeMap = {
    mp4: 'video/mp4', mkv: 'video/x-matroska', avi: 'video/x-msvideo',
    webm: 'video/webm', mov: 'video/quicktime', wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv', m4v: 'video/x-m4v',
    mp3: 'audio/mpeg', flac: 'audio/flac', aac: 'audio/aac',
    ogg: 'audio/ogg', wav: 'audio/wav',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp',
    pdf: 'application/pdf', txt: 'text/plain', srt: 'text/plain',
    vtt: 'text/vtt', nfo: 'text/plain',
    zip: 'application/zip', rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed', tar: 'application/x-tar',
    gz: 'application/gzip',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

function getFileCategory(mimeType) {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf' || mimeType.startsWith('text/')) return 'document';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || mimeType.includes('tar') || mimeType.includes('gzip')) return 'archive';
  return 'other';
}

function formatFileInfo(file, index) {
  const mimeType = detectMimeType(file.name);
  return {
    index,
    name: file.name,
    path: file.path,
    size: file.length,
    type: mimeType,
    category: getFileCategory(mimeType),
    downloaded: file.downloaded,
    progress: file.length > 0 ? file.downloaded / file.length : 0,
  };
}

export function formatTorrentInfo(torrent) {
  return {
    id: torrent.infoHash || torrent.pendingId,
    name: torrent.name || 'Pending Metadata...',
    totalSize: torrent.length,
    downloaded: torrent.downloaded,
    uploaded: torrent.uploaded,
    progress: torrent.progress,
    downloadSpeed: torrent.downloadSpeed,
    uploadSpeed: torrent.uploadSpeed,
    numPeers: torrent.numPeers,
    ratio: torrent.ratio,
    timeRemaining: torrent.timeRemaining,
    ready: torrent.ready,
    paused: torrent.paused,
    files: torrent.files.map((f, i) => formatFileInfo(f, i)),
  };
}

export function addTorrent(magnetOrUrl) {
  return new Promise((resolve, reject) => {
    for (const [hash, entry] of activeTorrents) {
      const t = entry.torrent;
      if (t.magnetURI === magnetOrUrl || hash === magnetOrUrl) {
        touchTorrent(hash);
        return resolve(formatTorrentInfo(t));
      }
    }

    // Pre-check: if this magnet's hash was recently destroyed, reject early
    const preHash = magnetOrUrl.match?.(/xt=urn:btih:([a-zA-Z0-9]+)/i)?.[1]?.toLowerCase();
    if (preHash && isRecentlyDestroyed(preHash)) {
      return reject(new Error('Torrent was recently removed. Please wait a moment and try again.'));
    }

    try {
      const torrent = client.add(magnetOrUrl, { path: TORRENT_PATH });
      
      const pendingId = torrent.infoHash || magnetOrUrl.match(/xt=urn:btih:([a-zA-Z0-9]+)/i)?.[1]?.toLowerCase() || uuidv4();
      torrent.pendingId = pendingId;

      if (!torrent.infoHash) {
        activeTorrents.set(pendingId, { torrent, lastAccessed: Date.now() });
        saveState();
      }
      
      // Once the infoHash is populated, migrate the registry entry
      torrent.on('infoHash', () => {
        if (torrent.destroyed || torrent._isBeingDestroyed) return;
        // Guard: don't re-register a torrent that was destroyed between add and infoHash
        if (isRecentlyDestroyed(torrent.infoHash)) {
          console.log(`[TorrentManager] Refusing to register recently-destroyed torrent: ${torrent.infoHash}`);
          torrent.destroy({ destroyStore: true });
          activeTorrents.delete(pendingId);
          return;
        }
        if (activeTorrents.has(pendingId) && pendingId !== torrent.infoHash) {
          activeTorrents.delete(pendingId);
        }
        activeTorrents.set(torrent.infoHash, { torrent, lastAccessed: Date.now() });
        saveState();
      });
      
      // Deselect files when it eventually becomes ready (saves bandwidth)
      torrent.on('ready', () => {
        torrent.files.forEach((file) => file.deselect());
        console.log(`[TorrentManager] Ready: ${torrent.name} (${torrent.infoHash})`);
        // Refresh timestamp when metadata arrives
        touchTorrent(torrent.infoHash);
      });

      // Resolve immediately — prevents Cloudflare 522 timeouts while waiting for metadata
      resolve({
        id: pendingId,
        name: 'Pending Metadata...',
        totalSize: 0,
        downloaded: 0,
        uploaded: 0,
        progress: 0,
        ready: false,
        files: []
      });

    } catch (err) {
      // WebTorrent throws synchronously if a duplicate infoHash is added
      if (err.message.includes('duplicate')) {
        const hashMatch = err.message.match(/duplicate torrent ([a-f0-9]+)/i);
        if (hashMatch && hashMatch[1]) {
           const dupHash = hashMatch[1];
           // If this torrent is being destroyed, don't resurrect it
           if (isRecentlyDestroyed(dupHash)) {
             return reject(new Error('Torrent was recently removed. Please wait a moment and try again.'));
           }
           const entry = activeTorrents.get(dupHash);
           const existing = entry?.torrent || client.get(dupHash);
           if (existing && !existing._isBeingDestroyed && !existing.destroyed) {
             activeTorrents.set(existing.infoHash, { torrent: existing, lastAccessed: Date.now() });
             return resolve(formatTorrentInfo(existing));
           }
        }
      }
      reject(err);
    }
  });
}

export function getTorrent(infoHash) {
  const entry = activeTorrents.get(infoHash);
  if (!entry) return null;
  touchTorrent(infoHash);
  return entry.torrent;
}

export function listTorrents() {
  const result = [];
  for (const [, entry] of activeTorrents) {
    result.push(formatTorrentInfo(entry.torrent));
  }
  return result;
}

export function removeTorrent(infoHash, deleteFiles = true) {
  return new Promise((resolve, reject) => {
    const entry = activeTorrents.get(infoHash);
    if (!entry) return reject(new Error('Torrent not found'));

    const { torrent } = entry;
    const name = torrent.name;
    
    // Mark as destroyed BEFORE removing from registry and saving state.
    // This prevents loadState() and the duplicate error handler from
    // resurrecting the torrent during the async destroy() callback.
    markDestroyed(infoHash);
    torrent._isBeingDestroyed = true;

    // Remove from registry immediately so UI reflects it
    activeTorrents.delete(infoHash);
    saveState();

    // Destroy in background (can hang if metadata is still fetching)
    torrent.destroy({ destroyStore: deleteFiles }, (err) => {
      if (err) console.error(`[TorrentManager] Error removing ${infoHash}:`, err);
      else console.log(`[TorrentManager] Removed: ${name} (${infoHash})`);
    });

    resolve({ success: true, id: infoHash });
  });
}

export function getClientStats() {
  return {
    totalDownloadSpeed: client.downloadSpeed,
    totalUploadSpeed: client.uploadSpeed,
    activeTorrents: activeTorrents.size,
    totalRatio: client.ratio,
  };
}

// ==========================================
// BACKGROUND MAINTENANCE: AUTO-CLEAR STORAGE
// ==========================================
// Runs every hour to:
//  1. Evict torrents that have been idle for > 3 days (age-based eviction)
//  2. Remove orphaned files in /tmp that no active torrent is using
//     (matches by infoHash directory name, not just torrent.name)
setInterval(() => {
  try {
    console.log('[Maintenance] Running automated storage cleanup...');
    const now = Date.now();

    // --- Step 1: Age-based eviction is DISABLED by user request ---
    let evictedCount = 0;

    // --- Step 2: Orphaned file cleanup ---
    // Collect all known infoHashes and torrent names currently active
    const activePaths = new Set();
    for (const [hash, entry] of activeTorrents) {
      // Match by infoHash (the directory WebTorrent creates)
      activePaths.add(hash);
      if (entry.torrent.name) activePaths.add(entry.torrent.name);
      if (entry.torrent.files) {
        entry.torrent.files.forEach(f => {
          const topLevelName = f.path.split(path.sep)[0];
          activePaths.add(topLevelName);
        });
      }
    }

    // Scan the torrents directory for items not belonging to any active torrent
    const items = fs.readdirSync(TORRENT_PATH);
    let deletedCount = 0;

    for (const item of items) {
      if (!activePaths.has(item)) {
        const itemPath = path.join(TORRENT_PATH, item);
        // Only delete items older than 1 hour to avoid touching freshly downloaded files
        try {
          const stat = fs.statSync(itemPath);
          const ageMs = now - stat.mtimeMs;
          if (ageMs > 60 * 60 * 1000) {
            fs.rmSync(itemPath, { recursive: true, force: true });
            deletedCount++;
            console.log(`[Maintenance] Auto-cleared orphaned data: ${item}`);
          }
        } catch { /* skip unreadable items */ }
      }
    }
    
    console.log(`[Maintenance] Cleanup complete. Evicted ${evictedCount} idle torrents, removed ${deletedCount} orphaned items.`);
  } catch (err) {
    console.error('[Maintenance] Error during storage cleanup:', err);
  }
}, 60 * 60 * 1000); // Every 1 hour

// Restore previous torrents on startup
setTimeout(loadState, 1000);
