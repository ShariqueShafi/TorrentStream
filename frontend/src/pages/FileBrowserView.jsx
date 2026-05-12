import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FileBrowser from '../components/FileBrowser';
import HLSPlayer from '../components/HLSPlayer';
import { getTorrent } from '../api';

export default function FileBrowserView({ torrents, isAdmin }) {
  const { torrentId } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState({ fileIndex: null, fileName: '' });
  const [localTorrent, setLocalTorrent] = useState(null);

  // Find from global state first (polled live)
  const torrent = torrents.find(t => t.id === torrentId) || localTorrent;

  useEffect(() => {
    // If not in global state, fetch it specifically once
    if (!torrent) {
      getTorrent(torrentId)
        .then(data => setLocalTorrent(data))
        .catch(() => {
          // If poll also fails, then we might be in trouble
        });
    }
  }, [torrentId, torrent]);

  if (!torrent) {
    return (
      <div className="flex-grow flex items-center justify-center p-xl">
        <div className="text-center animate-pulse">
          <div className="w-16 h-16 bg-primary-fixed border-2 border-border-primary mb-md mx-auto flex items-center justify-center text-2xl">
            📡
          </div>
          <p className="font-metadata text-metadata uppercase tracking-widest text-text-secondary">
            Locating stream data...
          </p>
        </div>
      </div>
    );
  }

  const handlePlay = (tId, fileIndex, fileName) => {
    setPlayer({ fileIndex, fileName });
  };

  return (
    <div className="flex-grow flex flex-col w-full">
      <nav className="flex items-center gap-xs font-metadata text-metadata uppercase tracking-widest text-text-secondary px-lg md:px-xl pt-lg pb-md">
        <button onClick={() => navigate(-1)} className="hover:text-primary transition-colors cursor-pointer font-bold border-b border-transparent hover:border-primary">
          Back
        </button>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-on-surface font-bold truncate">{torrent.name}</span>
      </nav>

      {player.fileIndex !== null ? (
        <HLSPlayer
          torrentId={torrent.id}
          fileIndex={player.fileIndex}
          fileName={player.fileName}
          onClose={() => setPlayer({ fileIndex: null, fileName: '' })}
        />
      ) : (
        <FileBrowser torrent={torrent} onPlay={handlePlay} isAdmin={isAdmin} />
      )}
    </div>
  );
}
