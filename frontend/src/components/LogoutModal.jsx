import React from 'react';

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-md bg-black/50 backdrop-blur-sm">
      <div className="bg-surface dark:bg-background border-4 border-border-primary w-full max-w-[400px] p-lg shadow-[8px_8px_0px_#1A1A1A] animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-lg">
          <h2 className="font-page-title text-page-title uppercase tracking-tighter flex items-center gap-2">
            <span className="material-symbols-outlined text-status-error">logout</span>
            Sign Out
          </h2>
          <button onClick={onClose} className="hover:text-primary transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <p className="font-body-copy text-body-copy text-text-secondary mb-lg">
          Are you sure you want to sign out? You will need to enter your credentials again to manage torrents.
        </p>

        <div className="flex gap-md">
          <button
            onClick={onClose}
            className="flex-1 py-md font-section-head text-section-head uppercase border-2 border-border-primary bg-white neubrutal-shadow neubrutal-hover neubrutal-active transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 py-md font-section-head text-section-head uppercase border-2 border-border-primary bg-status-error text-white neubrutal-shadow neubrutal-hover neubrutal-active transition-all"
          >
            Sign Out
          </button>
        </div>

        <p className="mt-md text-[10px] font-metadata text-text-secondary text-center uppercase tracking-widest">
          Admin session will be terminated
        </p>
      </div>
    </div>
  );
}
