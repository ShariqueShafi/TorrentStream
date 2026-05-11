import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FileBrowser from '../components/FileBrowser';
import HLSPlayer from '../components/HLSPlayer';
import { getTorrent } from '../api';

export default function FileBrowserView() {
  const { torrentId } = useParams();
  const navigate = useNavigate();
  const [torrent, setTorrent] = useState(null);
  const [player, setPlayer] = useState({ fileIndex: null, fileName: '' });

  useEffect(() => {
    // Fetch fresh torrent data on mount
    getTorrent(torrentId)
      .then((data) => setTorrent(data))
      .catch((err) => {
        console.error(err);
        navigate('/');
      });
  }, [torrentId, navigate]);

  if (!torrent) {
    return <div style={{ color: 'var(--text-disabled)', padding: 'var(--space-xl)' }}>Loading torrent...</div>;
  }

  const handlePlay = (tId, fileIndex, fileName) => {
    setPlayer({ fileIndex, fileName });
  };

  return (
    <div className="fade-up fade-up-1">
      <div 
        style={{ cursor: 'pointer', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', fontSize: '13px', fontWeight: 500 }} 
        onClick={() => navigate('/')}
      >
        ← Home &gt; {torrent.name.substring(0, 30)}
      </div>
      
      {player.fileIndex !== null ? (
        <div className="fade-up fade-up-2">
          <HLSPlayer
            torrentId={torrent.id}
            fileIndex={player.fileIndex}
            fileName={player.fileName}
            onClose={() => setPlayer({ fileIndex: null, fileName: '' })}
          />
        </div>
      ) : (
        <div className="fade-up fade-up-2">
          <FileBrowser torrent={torrent} onPlay={handlePlay} />
        </div>
      )}
    </div>
  );
}
