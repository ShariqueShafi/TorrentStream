import React from 'react';
import { getDownloadUrl } from '../api';

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (category) => {
  switch (category) {
    case 'video': return '🎬';
    case 'audio': return '🎵';
    case 'image': return '🖼️';
    case 'document': return '📄';
    case 'archive': return '📦';
    default: return '📄';
  }
};

const FileBrowser = ({ torrent, onPlay }) => {
  if (!torrent) return null;

  const totalFiles = torrent.files ? torrent.files.length : 0;

  return (
    <div>
      <div className="file-browser-header">
        <div className="file-browser-title-area">
          <div className="file-browser-icon">🎬</div>
          <div>
            <div className="file-browser-title" title={torrent.name}>
              {torrent.name.length > 50 ? torrent.name.substring(0, 50) + '...' : torrent.name}
            </div>
            <div className="file-browser-meta">
              {totalFiles} files • {formatSize(torrent.totalSize)}
            </div>
          </div>
        </div>
      </div>

      <div className="file-list">
        {torrent.files && torrent.files.map((file) => (
          <div key={file.index} className="file-row">
            <div className="file-row-icon">{getFileIcon(file.category)}</div>
            
            <div className="file-row-info">
              <div className="file-row-name" title={file.name}>{file.name}</div>
              <div className="file-row-meta">
                {file.type.split('/')[1]?.toUpperCase() || 'UNKNOWN'} • {formatSize(file.size)}
              </div>
            </div>
            
            <div className="file-row-actions">
              {file.category === 'video' && (
                <button 
                  className="btn btn-primary pulse-anim" 
                  style={{ padding: '8px 20px', fontSize: '12px' }}
                  onClick={() => onPlay(torrent.id, file.index, file.name)}
                >
                  ▶ STREAM
                </button>
              )}
              <a 
                href={getDownloadUrl(torrent.id, file.index)} 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ textDecoration: 'none' }}
              >
                ⬇ DOWNLOAD
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileBrowser;
