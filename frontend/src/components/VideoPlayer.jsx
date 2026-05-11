import { useEffect, useRef } from 'react';
import { getStreamUrl } from '../api';

export default function VideoPlayer({ torrentId, fileIndex, fileName, onClose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [torrentId, fileIndex]);

  if (torrentId === null || fileIndex === null) return null;

  const streamUrl = getStreamUrl(torrentId, fileIndex);

  return (
    <section className="player-section">
      <div className="player-card glass-card">
        <div className="player-header">
          <div className="player-now-playing">
            <span className="dot"></span>
            <span>Now Streaming</span>
            <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>—</span>
            <span style={{
              color: 'var(--text-secondary)', fontWeight: 400,
              maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {fileName}
            </span>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>✕ Close</button>
        </div>
        <div className="player-wrapper">
          <video
            ref={videoRef}
            controls
            autoPlay
            playsInline
            style={{ width: '100%', maxHeight: '70vh' }}
          >
            <source src={streamUrl} />
            Your browser does not support HTML5 video.
          </video>
        </div>
      </div>
    </section>
  );
}
