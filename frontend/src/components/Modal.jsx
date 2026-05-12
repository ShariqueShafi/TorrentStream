import React from 'react';

export default function Modal({ isOpen, onClose, title, children, icon, actionLabel, onAction, actionVariant = 'danger', footer, showAction = true }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-lg">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white border-2 border-border-primary neubrutal-shadow-xl animate-in zoom-in duration-200">
        <div className="bg-primary-fixed border-b-2 border-border-primary p-lg flex items-center gap-md">
          <div className="w-10 h-10 bg-white border-2 border-border-primary flex items-center justify-center text-xl">
            {icon || '🔔'}
          </div>
          <h2 className="font-page-title text-page-title font-black uppercase tracking-tight truncate">
            {title}
          </h2>
        </div>
        
        <div className="p-lg font-body-copy text-text-primary leading-relaxed">
          {children}
        </div>

        <div className="p-lg bg-primary-container border-t-2 border-border-primary flex flex-col sm:flex-row gap-md">
          {footer ? footer : (
            <>
              <button 
                onClick={onClose}
                className="flex-1 bg-white border-2 border-border-primary py-sm font-label-caps text-label-caps neubrutal-shadow neubrutal-hover neubrutal-active transition-all"
              >
                CANCEL
              </button>
              {showAction && onAction && (
                <button 
                  onClick={onAction}
                  className={`flex-1 text-on-primary border-2 border-border-primary py-sm font-label-caps text-label-caps neubrutal-shadow neubrutal-hover neubrutal-active transition-all ${
                    actionVariant === 'danger' ? 'bg-status-error' : 'bg-on-background'
                  }`}
                >
                  {actionLabel || 'CONFIRM'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
