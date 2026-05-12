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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Admin Login"
      icon="lock"
      showAction={false}
      footer={null} // We'll use the button inside the form
    >
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
    </Modal>
  );
}

