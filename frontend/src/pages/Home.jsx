import React, { useState } from 'react';
import TorrentInput from '../components/TorrentInput';
import TorrentList from '../components/TorrentList';
import { useNavigate } from 'react-router-dom';

export default function Home({ torrents, onAddTorrent, onRemoveTorrent }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSelect = (torrent) => {
    navigate(`/files/${torrent.id}`);
  };

  return (
    <div className="fade-up fade-up-1">
      <TorrentInput onLoaded={onAddTorrent} loading={loading} setLoading={setLoading} />

      <div className="recent-header">RECENT TORRENTS</div>
      
      {torrents.length > 0 ? (
        <TorrentList
          torrents={torrents}
          activeTorrentId={null}
          onSelect={handleSelect}
          onRemove={onRemoveTorrent}
        />
      ) : (
        <div style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-xl)', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
          <div style={{ fontSize: '20px', fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>YOUR ARCHIVE IS EMPTY</div>
          <div style={{ fontSize: '14px' }}>Add a magnet link above to start streaming.</div>
        </div>
      )}
    </div>
  );
}
