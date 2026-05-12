import WebTorrent from 'webtorrent';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage path for torrent data — uses temp storage only
const TORRENT_PATH = '/tmp/torrentstream/torrents';

// Ensure storage directory exists
if (!fs.existsSync(TORRENT_PATH)) {
  fs.mkdirSync(TORRENT_PATH, { recursive: true });
}

// WebTorrent client singleton
const client = new WebTorrent();

// Active torrent registry: infoHash -> torrent object
const activeTorrents = new Map();

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
    id: torrent.infoHash,
    name: torrent.name,
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
    for (const [hash, t] of activeTorrents) {
      if (t.magnetURI === magnetOrUrl || hash === magnetOrUrl) {
        return resolve(formatTorrentInfo(t));
      }
    }

    try {
      const torrent = client.add(magnetOrUrl, { path: TORRENT_PATH });
      
      // Store it immediately so listTorrents can see it
      activeTorrents.set(torrent.infoHash, torrent);
      
      // Deselect files when it eventually becomes ready
      torrent.on('ready', () => {
        torrent.files.forEach((file) => file.deselect());
        console.log(`[TorrentManager] Ready: ${torrent.name} (${torrent.infoHash})`);
      });

      // Resolve immediately, don't wait for metadata (prevents Cloudflare 522 timeouts)
      resolve(formatTorrentInfo(torrent));

    } catch (err) {
      // WebTorrent throws synchronously if a duplicate infoHash is added
      if (err.message.includes('duplicate')) {
        const hashMatch = err.message.match(/duplicate torrent ([a-f0-9]+)/i);
        if (hashMatch && hashMatch[1]) {
           const existing = activeTorrents.get(hashMatch[1]) || client.get(hashMatch[1]);
           if (existing) {
             activeTorrents.set(existing.infoHash, existing);
             return resolve(formatTorrentInfo(existing));
           }
        }
      }
      reject(err);
    }
  });
}

export function getTorrent(infoHash) {
  return activeTorrents.get(infoHash) || null;
}

export function listTorrents() {
  const result = [];
  for (const [, torrent] of activeTorrents) {
    result.push(formatTorrentInfo(torrent));
  }
  return result;
}

export function removeTorrent(infoHash, deleteFiles = true) {
  return new Promise((resolve, reject) => {
    const torrent = activeTorrents.get(infoHash);
    if (!torrent) return reject(new Error('Torrent not found'));

    const name = torrent.name;
    
    // Remove from our active registry immediately so UI reflects it
    activeTorrents.delete(infoHash);
    
    // Destroy in background (can hang if metadata is fetching)
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
