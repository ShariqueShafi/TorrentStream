import React from 'react';

export default function Settings() {
  return (
    <div className="fade-up fade-up-1">
      <div className="recent-header" style={{ marginBottom: 'var(--space-xl)' }}>
        ⚙️ APP SETTINGS
      </div>
      
      <div className="magnet-hero-card" style={{ padding: 'var(--space-xl)' }}>
        <p style={{ color: 'var(--text-disabled)', fontSize: '14px' }}>
          Settings module coming soon. Configuration is currently handled via the backend .env file.
        </p>
      </div>
    </div>
  );
}
