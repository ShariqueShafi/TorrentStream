import React from 'react';

export default function Modal({ isOpen, onClose, title, children, icon, actionLabel, onAction, actionVariant = 'danger', footer, showAction = true }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-md bg-black/50 backdrop-blur-sm">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      <div className="relative bg-surface dark:bg-background border-4 border-border-primary w-full max-w-[450px] p-lg shadow-[8px_8px_0px_#1A1A1A] animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-lg">
          <h2 className="font-page-title text-page-title uppercase tracking-tighter flex items-center gap-2">
            {icon && <span className="material-symbols-outlined text-primary">{icon}</span>}
            {title}
          </h2>
          <button onClick={onClose} className="hover:text-primary transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="font-body-copy text-body-copy text-text-secondary mb-lg">
          {children}
        </div>

        <div className="flex gap-md">
          {footer ? footer : (
            <>
              <button 
                onClick={onClose}
                className="flex-1 py-md font-section-head text-section-head uppercase border-2 border-border-primary bg-white neubrutal-shadow neubrutal-hover neubrutal-active transition-all"
              >
                Cancel
              </button>
              {showAction && onAction && (
                <button 
                  onClick={() => { onAction(); onClose(); }}
                  className={`flex-1 py-md font-section-head text-section-head uppercase border-2 border-border-primary text-white neubrutal-shadow neubrutal-hover neubrutal-active transition-all ${
                    actionVariant === 'danger' ? 'bg-status-error' : 'bg-primary'
                  }`}
                >
                  {actionLabel || 'Confirm'}
                </button>
              )}
            </>
          )}
        </div>

        <p className="mt-md text-[10px] font-metadata text-text-secondary text-center uppercase tracking-widest">
          Action requires administrative confirmation
        </p>
      </div>
    </div>
  );
}
