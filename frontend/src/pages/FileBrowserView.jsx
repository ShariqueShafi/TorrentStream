import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FileBrowser from '../components/FileBrowser';
import HLSPlayer from '../components/HLSPlayer';
import { getTorrent } from '../api';

export default function FileBrowserView({ torrents, isAdmin }) {
  const { torrentId } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState({ fileIndex: null, fileName: '' });

  // Find the current torrent from the global polled state
  const torrent = torrents.find(t => t.id === torrentId);

  // If torrent doesn't exist in global state, it might be loading or gone
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
