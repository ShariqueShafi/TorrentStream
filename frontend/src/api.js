import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ts_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mutation timestamp — used to cache-bust polls after add/remove.
// When a mutation occurs, polls within the next CACHE_BUST_WINDOW_MS
// will append a _t= query param to bypass stale CF edge cache.
let lastMutationTs = 0;
const CACHE_BUST_WINDOW_MS = 8000;

export function signalMutation() {
  lastMutationTs = Date.now();
}

export async function addTorrent(magnet) {
  const res = await api.post('/api/torrent', { magnet });
  signalMutation();
  return res.data;
}

export async function listTorrents() {
  const needsBust = Date.now() - lastMutationTs < CACHE_BUST_WINDOW_MS;
  const params = needsBust ? { _t: Date.now() } : {};
  const res = await api.get('/api/torrents', { params });
  return res.data;
}

export async function getTorrent(id) {
  const res = await api.get(`/api/torrent/${id}`);
  return res.data;
}

export async function removeTorrent(id, keepFiles = false) {
  const res = await api.delete(`/api/torrent/${id}?keepFiles=${keepFiles}`);
  signalMutation();
  return res.data;
}


export function getDownloadUrl(torrentId, fileIndex) {
  return `${API_BASE}/download/${torrentId}/${fileIndex}`;
}

export default api;

