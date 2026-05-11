import React, { useState } from 'react';

const TorrentInput = ({ onLoaded, loading, setLoading }) => {
  const [magnet, setMagnet] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!magnet.trim()) return;
    setLoading(true);
    try {
      await onLoaded(magnet.trim());
      setMagnet('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="magnet-hero-card">
      <div className="magnet-hero-label">Add a new torrent</div>
      <form className="magnet-hero-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="magnet-input"
          placeholder="magnet:?xt=urn:btih:..."
          value={magnet}
          onChange={(e) => setMagnet(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !magnet.trim()}>
          {loading ? 'LOADING...' : 'BROWSE FILES'}
        </button>
      </form>
    </div>
  );
};

export default TorrentInput;
