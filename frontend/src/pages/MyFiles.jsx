import React from 'react';
import TorrentList from '../components/TorrentList';
import { useNavigate } from 'react-router-dom';

export default function MyFiles({ torrents, onRemoveTorrent }) {
  const navigate = useNavigate();

  return (
    <div className="fade-up fade-up-1">
      <div className="recent-header" style={{ marginBottom: 'var(--space-md)' }}>
        📁 MY FILES ({torrents.length})
      </div>
      
      {torrents.length > 0 ? (
        <TorrentList
          torrents={torrents}
          activeTorrentId={null}
          onSelect={(torrent) => navigate(`/files/${torrent.id}`)}
          onRemove={onRemoveTorrent}
        />
      ) : (
        <div style={{ color: 'var(--text-secondary)', padding: 'var(--space-xl)' }}>
          No files currently active in this session.
        </div>
      )}
    </div>
  );
}
