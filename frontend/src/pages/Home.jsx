import React, { useState } from 'react';
import TorrentInput from '../components/TorrentInput';
import TorrentList from '../components/TorrentList';
import { useNavigate } from 'react-router-dom';

export default function Home({ torrents, onAddTorrent, onRemoveTorrent, isAdmin }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSelect = (torrent) => {
    navigate(`/files/${torrent.id}`);
  };

  return (
    <>
      <TorrentInput 
        onLoaded={onAddTorrent} 
        loading={loading} 
        setLoading={setLoading} 
        isAdmin={isAdmin}
      />
      <TorrentList
        torrents={torrents}
        onSelect={handleSelect}
        onRemove={onRemoveTorrent}
        isAdmin={isAdmin}
      />
    </>
  );
}
