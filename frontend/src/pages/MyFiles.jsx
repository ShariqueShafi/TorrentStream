import React from 'react';
import TorrentList from '../components/TorrentList';
import { useNavigate } from 'react-router-dom';

export default function MyFiles({ torrents, onRemoveTorrent, isAdmin }) {
  const navigate = useNavigate();

  return (
    <div className="flex-grow flex flex-col pt-lg">
      <TorrentList
        torrents={torrents}
        onSelect={(torrent) => navigate(`/files/${torrent.id}`)}
        onRemove={onRemoveTorrent}
        isAdmin={isAdmin}
      />
    </div>
  );
}
