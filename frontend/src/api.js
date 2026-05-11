import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

export async function addTorrent(magnet) {
  const res = await api.post('/api/torrent', { magnet });
  return res.data;
}

export async function listTorrents() {
  const res = await api.get('/api/torrents');
  return res.data;
}

export async function getTorrent(id) {
  const res = await api.get(`/api/torrent/${id}`);
  return res.data;
}

export async function removeTorrent(id, keepFiles = false) {
  const res = await api.delete(`/api/torrent/${id}?keepFiles=${keepFiles}`);
  return res.data;
}

export function getStreamUrl(torrentId, fileIndex) {
  return `${API_BASE}/api/stream/${torrentId}/${fileIndex}`;
}

export function getDownloadUrl(torrentId, fileIndex) {
  return `${API_BASE}/download/${torrentId}/${fileIndex}`;
}

export default api;
