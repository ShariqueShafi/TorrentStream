import { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import FileBrowserView from './pages/FileBrowserView';
import MyFiles from './pages/MyFiles';
import Settings from './pages/Settings';
import {
  addTorrent,
  listTorrents,
  removeTorrent as apiRemoveTorrent,
} from './api';

export default function App() {
  const [torrents, setTorrents] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [toasts, setToasts] = useState([]);
  const pollRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // Poll for torrent list every 3 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        const data = await listTorrents();
        setTorrents(data.torrents || []);
        setGlobalStats(data.stats || null);
      } catch {
        // silent fail for polling
      }
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => clearInterval(pollRef.current);
  }, []);

  const handleAddTorrent = async (magnet) => {
    try {
      const info = await addTorrent(magnet);
      setTorrents((prev) => {
        const exists = prev.find((t) => t.id === info.id);
        if (exists) return prev.map((t) => (t.id === info.id ? info : t));
        return [...prev, info];
      });
      showToast(`Torrent loaded — ${info.files?.length || 0} files found`, 'success');
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Could not load torrent', 'error');
    }
  };

  const handleRemoveTorrent = async (id) => {
    try {
      await apiRemoveTorrent(id);
      setTorrents((prev) => prev.filter((t) => t.id !== id));
      showToast('Torrent removed', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to remove', 'error');
    }
  };

  return (
    <div className="app-layout">
      <Sidebar torrentCount={torrents.length} />

      <main className="main-content">
        <Routes>
          <Route 
            path="/" 
            element={<Home torrents={torrents} onAddTorrent={handleAddTorrent} onRemoveTorrent={handleRemoveTorrent} />} 
          />
          <Route 
            path="/files/:torrentId" 
            element={<FileBrowserView />} 
          />
          <Route 
            path="/files" 
            element={<MyFiles torrents={torrents} onRemoveTorrent={handleRemoveTorrent} />} 
          />
          <Route 
            path="/settings" 
            element={<Settings />} 
          />
        </Routes>
      </main>

      {/* Global Toasts */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              {toast.type === 'error' && <span>⚠️</span>}
              {toast.type === 'success' && <span>✅</span>}
              {toast.type === 'info' && <span>ℹ️</span>}
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
