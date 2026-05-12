import React, { useState } from 'react';
import Modal from './Modal';

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  const footer = (
    <>
      <button 
        type="button"
        onClick={onClose}
        className="flex-1 bg-white border-2 border-border-primary py-sm font-label-caps text-label-caps neubrutal-shadow neubrutal-hover neubrutal-active transition-all"
      >
        CANCEL
      </button>
      <button 
        type="submit"
        form="login-form"
        disabled={loading}
        className="flex-1 bg-on-background text-on-primary border-2 border-border-primary py-sm font-label-caps text-label-caps neubrutal-shadow neubrutal-hover neubrutal-active transition-all disabled:opacity-50"
      >
        {loading ? 'WAIT...' : 'SIGN IN'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ADMIN ACCESS"
      icon="🔐"
      footer={footer}
    >
      <form id="login-form" onSubmit={handleSubmit} className="flex flex-col gap-md">
        <div className="flex flex-col gap-xs">
          <label className="font-label-caps text-[10px] uppercase text-text-secondary">Admin ID</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-white border-2 border-border-primary p-sm font-bold focus:outline-none focus:ring-0 shadow-[2px_2px_0px_#1A1A1A] text-text-primary"
            placeholder="Enter ID"
            required
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-xs">
          <label className="font-label-caps text-[10px] uppercase text-text-secondary">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border-2 border-border-primary p-sm font-bold focus:outline-none focus:ring-0 shadow-[2px_2px_0px_#1A1A1A] text-text-primary"
            placeholder="••••••••"
            required
          />
        </div>
        <p className="text-[10px] font-metadata text-text-secondary uppercase tracking-widest text-center mt-xs">
          Secure Administrative Access Only
        </p>
      </form>
    </Modal>
  );
}
