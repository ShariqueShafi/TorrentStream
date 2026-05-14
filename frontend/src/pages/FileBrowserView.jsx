import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FileBrowser from '../components/FileBrowser';
import VideoPlayer from '../components/VideoPlayer';
import { getTorrent } from '../api';

export default function FileBrowserView({ torrents, isAdmin }) {
  const { torrentId } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState({ fileIndex: null, fileName: '' });
  const [localTorrent, setLocalTorrent] = useState(null);
  const pollIntervalRef = useRef(null);

  // Prefer live-polled global state; fall back to our local fetch
  const torrent = torrents.find((t) => t.id === torrentId) || localTorrent;

  // Determine if we still need to keep polling for metadata
  const needsPolling = !torrent || !torrent.files || torrent.files.length === 0;

  useEffect(() => {
    // Fetch once immediately
    const fetchTorrent = () => {
      getTorrent(torrentId)
        .then((data) => setLocalTorrent(data))
        .catch(() => {});
    };

    fetchTorrent();

    // Poll every 2 seconds while files are empty (metadata not yet arrived)
    // Stop once files are populated or the torrent is ready
    pollIntervalRef.current = setInterval(() => {
      getTorrent(torrentId)
        .then((data) => {
          setLocalTorrent(data);
          // Stop polling once we have files
          if (data && data.files && data.files.length > 0) {
            clearInterval(pollIntervalRef.current);
          }
        })
        .catch(() => {});
    }, 2000);

    return () => clearInterval(pollIntervalRef.current);
  }, [torrentId]);

  // Stop the local poll once the global state has files (App.jsx polls every 3s)
  useEffect(() => {
    if (!needsPolling) {
      clearInterval(pollIntervalRef.current);
    }
  }, [needsPolling]);

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
        <button
          onClick={() => navigate(-1)}
          className="hover:text-primary transition-colors cursor-pointer font-bold border-b border-transparent hover:border-primary"
        >
          Back
        </button>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-on-surface font-bold truncate">{torrent.name}</span>
      </nav>

      {player.fileIndex !== null ? (
        <VideoPlayer
          torrent={torrent}
          fileIndex={player.fileIndex}
          fileName={player.fileName}
          onClose={() => setPlayer({ fileIndex: null, fileName: '' })}
        />
      ) : (
        <FileBrowser 
          torrent={torrent} 
          onPlay={handlePlay} 
          isAdmin={isAdmin} 
          onRemove={(id) => {
            if (onRemoveTorrent) {
              onRemoveTorrent(id);
              navigate('/');
            }
          }}
        />
      )}
    </div>
  );
}
