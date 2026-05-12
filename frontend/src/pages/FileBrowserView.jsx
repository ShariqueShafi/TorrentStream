import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FileBrowser from '../components/FileBrowser';
import HLSPlayer from '../components/HLSPlayer';
import { getTorrent } from '../api';

export default function FileBrowserView({ isAdmin }) {
  const { torrentId } = useParams();
  const navigate = useNavigate();
  const [torrent, setTorrent] = useState(null);
  const [player, setPlayer] = useState({ fileIndex: null, fileName: '' });

  useEffect(() => {
    getTorrent(torrentId)
      .then((data) => setTorrent(data))
      .catch((err) => {
        console.error(err);
        navigate('/');
      });
  }, [torrentId, navigate]);

  if (!torrent) {
    return <div className="text-text-disabled p-lg font-metadata">Loading torrent data...</div>;
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
