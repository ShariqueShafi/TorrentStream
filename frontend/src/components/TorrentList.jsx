import React from 'react';

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const TorrentList = ({ torrents, activeTorrentId, onSelect, onRemove }) => {
  return (
    <div className="torrents-grid">
      {torrents.map((torrent, index) => {
        const fileCount = torrent.files ? torrent.files.length : 0;
        const animationDelay = `fade-up-${(index % 4) + 1}`;
        
        return (
          <div 
            key={torrent.id} 
            className={`torrent-card fade-up ${animationDelay}`}
            onClick={() => onSelect(torrent)}
          >
            <div className="torrent-card-top">
              🎬
              <div className="torrent-card-badge">{fileCount} files</div>
            </div>
            
            <div className="torrent-card-bottom">
              <div className="torrent-card-title" title={torrent.name}>
                {torrent.name}
              </div>
              <div className="torrent-card-size">
                {formatSize(torrent.totalSize)}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-md)' }}>
                {torrent.ready ? (
                  <div className="pill success">READY ON R2</div>
                ) : (
                  <div className="pill warning">LOCAL ONLY</div>
                )}

                <button 
                  className="btn-secondary" 
                  style={{ border: 'none', padding: '4px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to remove this torrent?')) {
                      onRemove(torrent.id);
                    }
                  }}
                  title="Remove from list"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TorrentList;
