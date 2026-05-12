import { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import LoginModal from './components/LoginModal';
import PlatformUsageBanners from './components/PlatformUsageBanners';
import Home from './pages/Home';
import FileBrowserView from './pages/FileBrowserView';
import MyFiles from './pages/MyFiles';
import Settings from './pages/Settings';
import { usePlatformUsage } from './hooks/usePlatformUsage';
import api, {
  addTorrent,
  listTorrents,
  removeTorrent as apiRemoveTorrent,
} from './api';

export default function App() {
  const [torrents, setTorrents] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('ts_admin') === '1');
  const pollRef = useRef(null);

  const { usage, banners, newToasts, dismissBanner, refetch } = usePlatformUsage();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = async (username, password) => {
    try {
      const res = await api.post('/api/login', { username, password });
      setIsAdmin(true);
      localStorage.setItem('ts_admin', '1');
      localStorage.setItem('ts_token', res.data.token);
      showToast('Signed in as Admin', 'success');
      return true;
    } catch (err) {
      showToast(err.response?.data?.error || 'Login failed', 'error');
      return false;
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      setIsAdmin(false);
      localStorage.removeItem('ts_admin');
      localStorage.removeItem('ts_token');
      showToast('Signed out', 'info');
    }
  };

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // Sync newToasts from platform usage hook
  useEffect(() => {
    if (newToasts && newToasts.length > 0) {
      setToasts(prev => {
        const toAdd = newToasts.filter(nt => !prev.find(pt => pt.id === nt.id));
        if (toAdd.length === 0) return prev;
        
        // Auto-dismiss logic handled by hook timeout definitions, but we need to implement it here
        toAdd.forEach(nt => {
          if (nt.autoDismiss) {
            setTimeout(() => {
              setToasts(p => p.filter(t => t.id !== nt.id));
            }, nt.autoDismiss);
          }
        });
        
        return [...prev, ...toAdd];
      });
    }
  }, [newToasts]);

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
    <div className="min-h-screen bg-bg-page text-on-background font-body-copy">
      <Topbar 
        onMenuClick={() => setIsSidebarOpen(prev => !prev)} 
        isAdmin={isAdmin} 
        onLoginClick={() => setIsLoginModalOpen(true)} 
        onLogoutClick={handleLogout} 
      />
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isAdmin={isAdmin} 
        onLoginClick={() => setIsLoginModalOpen(true)} 
        onLogoutClick={handleLogout} 
        usage={usage} 
        onRefreshUsage={refetch} 
      />

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLogin={handleLogin} 
      />

      <main className={`${isSidebarOpen ? 'md:ml-[260px]' : 'md:ml-0'} transition-all duration-300 pt-[52px] pb-[72px] md:pb-0 min-h-screen flex flex-col`}>
        <div className="flex-grow flex flex-col">
          <PlatformUsageBanners banners={banners} onDismiss={dismissBanner} />
          
          <Routes>
            <Route 
              path="/" 
              element={<Home torrents={torrents} onAddTorrent={handleAddTorrent} onRemoveTorrent={handleRemoveTorrent} isAdmin={isAdmin} />} 
            />
            <Route 
              path="/files/:torrentId" 
              element={<FileBrowserView isAdmin={isAdmin} />} 
            />
            <Route 
              path="/files" 
              element={<MyFiles torrents={torrents} onRemoveTorrent={handleRemoveTorrent} isAdmin={isAdmin} />} 
            />
            <Route 
              path="/settings" 
              element={<Settings />} 
            />
          </Routes>
        </div>
      </main>

      {/* Global Toasts */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              {toast.type === 'error' && <span>❌</span>}
              {toast.type === 'success' && <span>✅</span>}
              {toast.type === 'info' && <span>ℹ️</span>}
              {toast.type === 'warning' && <span>⚠️</span>}
              {toast.type === 'critical' && <span>🚨</span>}
              {toast.type === 'exceeded' && <span>🛑</span>}
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
