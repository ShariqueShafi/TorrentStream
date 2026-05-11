import React from 'react';

const Modal = ({ isOpen, title, children, onClose, onConfirm, confirmText, confirmDanger = false }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }} onClick={onClose}>
      <div 
        className="magnet-hero-card fade-up fade-up-1" 
        style={{ width: '400px', maxWidth: '90%', padding: '32px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '20px', fontFamily: 'var(--font-display)', marginBottom: '16px', letterSpacing: '1px' }}>
          {title}
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          {children}
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>CANCEL</button>
          <button 
            className="btn" 
            style={{ 
              background: confirmDanger ? 'var(--error)' : 'var(--accent)',
              color: confirmDanger ? '#fff' : 'var(--bg-primary)',
              fontWeight: 600, padding: '10px 20px', borderRadius: '4px', border: 'none'
            }}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
