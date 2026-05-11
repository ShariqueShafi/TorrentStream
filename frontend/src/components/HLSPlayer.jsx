import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import api from '../api';

const API_BASE = api.defaults.baseURL;

const HLSPlayer = ({ torrentId, fileIndex, fileName, onClose }) => {
  const [status, setStatus] = useState('idle');
  const [streamUrl, setStreamUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [transcodePercent, setTranscodePercent] = useState(0);
  const [transcodeComplete, setTranscodeComplete] = useState(false);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const pollTimer = useRef(null);
  const transcodePollTimer = useRef(null);

  useEffect(() => {
    startStream();
    return () => cleanup();
  }, [torrentId, fileIndex]);

  const cleanup = () => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    if (transcodePollTimer.current) clearTimeout(transcodePollTimer.current);
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };

  const startStream = async () => {
    setStatus('processing');
    setErrorMsg('');
    setTranscodePercent(0);
    setTranscodeComplete(false);
    try {
      const res = await fetch(`${API_BASE}/api/stream/${torrentId}/${fileIndex}`, {
        method: 'POST'
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to start stream');

      if (data.status === 'ready' && data.hlsUrl) {
        setStreamUrl(`${API_BASE}${data.hlsUrl}`);
        setStatus('ready');
        setTranscodeComplete(data.transcodeComplete || false);
        setTranscodePercent(data.transcodePercent || 0);
        if (!data.transcodeComplete) {
          startTranscodePoll();
        }
        return;
      }

      pollStatus();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  const pollStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stream/status/${torrentId}/${fileIndex}`);
      const data = await res.json();

      setTranscodePercent(data.transcodePercent || 0);

      if (data.status === 'ready' && data.hlsUrl) {
        setStreamUrl(`${API_BASE}${data.hlsUrl}`);
        setStatus('ready');
        setTranscodeComplete(data.transcodeComplete || false);
        if (!data.transcodeComplete) {
          startTranscodePoll();
        }
      } else if (data.status === 'error') {
        setStatus('error');
        setErrorMsg(data.error || 'Transcoding failed');
      } else {
        pollTimer.current = setTimeout(pollStatus, 3000);
      }
    } catch (err) {
      pollTimer.current = setTimeout(pollStatus, 3000);
    }
  };

  // Continue polling transcode progress after playback starts
  const startTranscodePoll = () => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/stream/status/${torrentId}/${fileIndex}`);
        const data = await res.json();
        setTranscodePercent(data.transcodePercent || 0);

        if (data.transcodeComplete) {
          setTranscodeComplete(true);
          setTranscodePercent(100);
          // Transcode done! Playlist now has #EXT-X-ENDLIST.
          // Reload the HLS source so hls.js sees the full VOD timeline.
          if (hlsRef.current) {
            console.log('[Player] Transcode complete — reloading playlist for full timeline');
            hlsRef.current.loadSource(`${API_BASE}${data.hlsUrl}`);
          }
          return; // Stop polling
        }
        transcodePollTimer.current = setTimeout(poll, 5000);
      } catch {
        transcodePollTimer.current = setTimeout(poll, 5000);
      }
    };
    transcodePollTimer.current = setTimeout(poll, 5000);
  };

  useEffect(() => {
    if (status === 'ready' && streamUrl && videoRef.current) {
      const video = videoRef.current;
      
      if (Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 10,
          maxMaxBufferLength: 30,
          liveSyncDurationCount: 3,
          // Enable live→VOD transition when ENDLIST appears
          liveDurationInfinity: false,
        });
        hlsRef.current = hls;
        
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(e => console.error('Auto-play prevented', e));
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error('[HLS] Fatal error:', data.type, data.details);
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(e => console.error('Auto-play prevented', e));
        });
      }
    }
  }, [status, streamUrl]);

  return (
    <div className="player-container">
      {status === 'idle' && (
        <div className="player-idle">
          <div className="player-idle-icon pulse-anim">▶</div>
          <div className="player-title">PREPARING STREAM</div>
          <div className="player-subtitle">Connecting to backend...</div>
        </div>
      )}

      {status === 'processing' && (
        <div className="player-idle player-transcoding">
          <div className="player-spinner"></div>
          <div className="player-title" style={{ color: 'var(--accent)' }}>BUFFERING...</div>
          {transcodePercent > 0 ? (
            <div className="player-progress-bar" style={{ width: '300px' }}>
              <div style={{
                height: '100%',
                width: `${transcodePercent}%`,
                background: 'var(--accent)',
                borderRadius: '2px',
                transition: 'width 1s ease'
              }} />
            </div>
          ) : (
            <div className="player-progress-bar">
              <div className="progress-indeterminate" style={{ height: '100%' }}></div>
            </div>
          )}
          <div className="player-subtitle">
            {transcodePercent > 0 
              ? `Transcoding: ${transcodePercent}% — playback will start soon.`
              : 'Downloading from peers & preparing HLS stream.'}
          </div>
        </div>
      )}

      {status === 'ready' && (
        <video 
          ref={videoRef} 
          controls 
          style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }}
        />
      )}

      {status === 'error' && (
        <div className="player-idle">
          <div className="player-idle-icon" style={{ background: 'var(--error)' }}>⚠️</div>
          <div className="player-title" style={{ color: 'var(--error)' }}>STREAM FAILED</div>
          <div className="player-subtitle" style={{ marginBottom: 'var(--space-lg)' }}>{errorMsg}</div>
          <button className="btn btn-secondary" onClick={startStream}>TRY AGAIN</button>
        </div>
      )}
      
      {/* Close button */}
      <button 
        onClick={onClose}
        style={{
          position: 'absolute', top: '24px', right: '24px',
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', width: '36px', height: '36px', borderRadius: '50%',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10, backdropFilter: 'blur(4px)'
        }}
      >✕</button>

      {/* Now Playing + Transcode progress overlay */}
      {status === 'ready' && (
        <div style={{
          position: 'absolute', top: '24px', left: '24px',
          background: 'rgba(0,0,0,0.7)', border: '1px solid var(--border)',
          padding: '8px 16px', borderRadius: 'var(--radius-md)',
          backdropFilter: 'blur(4px)', zIndex: 10
        }}>
          <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 600, letterSpacing: '1px', marginBottom: '2px' }}>NOW PLAYING</div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>{fileName}</div>
          {!transcodeComplete && (
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="pulse-anim" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }}></span>
              Transcoding {transcodePercent}% — full timeline after completion
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HLSPlayer;
