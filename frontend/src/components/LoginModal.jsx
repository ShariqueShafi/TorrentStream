import React, { useState } from 'react';

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await onLogin(username, password);
    setLoading(false);
    if (success) {
      onClose();
      setUsername('');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-md bg-black/50 backdrop-blur-sm">
      <div className="bg-surface dark:bg-background border-4 border-border-primary w-full max-w-[400px] p-lg shadow-[8px_8px_0px_#1A1A1A] animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-lg">
          <h2 className="font-page-title text-page-title uppercase tracking-tighter flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">lock</span>
            Admin Login
          </h2>
          <button onClick={onClose} className="hover:text-primary transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="font-label-caps text-label-caps uppercase text-text-secondary">Admin ID</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white border-2 border-border-primary p-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-[2px_2px_0px_#1A1A1A]"
              placeholder="Enter ID"
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-caps text-label-caps uppercase text-text-secondary">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border-2 border-border-primary p-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-[2px_2px_0px_#1A1A1A]"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-lg w-full bg-primary text-on-primary font-section-head text-section-head uppercase py-md border-2 border-border-primary neubrutal-shadow neubrutal-hover neubrutal-active disabled:opacity-50 disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-none transition-all"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-md text-[10px] font-metadata text-text-secondary text-center uppercase tracking-widest">
          Secure Administrative Access Only
        </p>
      </div>
    </div>
  );
}
