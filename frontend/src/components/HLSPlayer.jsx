import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import api from '../api';

const API_BASE = api.defaults.baseURL;

export default function HLSPlayer({ torrentId, fileIndex, fileName, onClose }) {
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

  const startTranscodePoll = () => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/stream/status/${torrentId}/${fileIndex}`);
        const data = await res.json();
        setTranscodePercent(data.transcodePercent || 0);

        if (data.transcodeComplete) {
          setTranscodeComplete(true);
          setTranscodePercent(100);
          if (hlsRef.current) {
            hlsRef.current.loadSource(`${API_BASE}${data.hlsUrl}`);
          }
          return;
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
    <div className="flex flex-col gap-lg px-lg md:px-xl max-w-7xl mx-auto w-full mb-xl">
      <section className="relative">
        <div className="aspect-video bg-black border-4 border-border-primary shadow-[8px_8px_0px_#1A1A1A] flex items-center justify-center group overflow-hidden relative">
          
          {status === 'processing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 text-white p-lg text-center">
              <span className="material-symbols-outlined text-4xl animate-spin mb-md" style={{ fontVariationSettings: "'FILL' 1" }}>sync</span>
              <h3 className="font-section-head text-section-head uppercase mb-sm">BUFFERING STREAM</h3>
              <div className="w-full max-w-md h-4 border-2 border-white/30 relative mt-sm">
                <div 
                  className="absolute inset-y-0 left-0 bg-primary-fixed transition-all duration-300" 
                  style={{ width: `${transcodePercent}%` }}
                />
              </div>
              <p className="font-metadata text-metadata uppercase mt-sm text-white/70">
                {transcodePercent > 0 
                  ? `Transcoding chunk ${transcodePercent}%...` 
                  : 'Downloading initial metadata from peers...'}
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 text-status-error p-lg text-center">
              <span className="material-symbols-outlined text-4xl mb-md">error</span>
              <h3 className="font-section-head text-section-head uppercase mb-sm">STREAM ERROR</h3>
              <p className="font-metadata text-metadata uppercase mb-md text-white/70">{errorMsg}</p>
              <button 
                onClick={startStream}
                className="bg-status-error text-white font-bold px-lg py-sm border-2 border-border-primary neubrutal-shadow neubrutal-hover neubrutal-active"
              >
                RETRY CONNECTION
              </button>
            </div>
          )}

          <video 
            ref={videoRef} 
            controls 
            className="w-full h-full object-contain z-10"
            style={{ display: status === 'ready' ? 'block' : 'none' }}
          />

          {status === 'ready' && !transcodeComplete && (
            <div className="absolute top-md right-md z-20 bg-status-warning text-black font-label-caps text-label-caps px-sm py-xs border-2 border-border-primary shadow-[2px_2px_0px_#1A1A1A] flex items-center gap-xs">
              <span className="w-2 h-2 rounded-full bg-status-error animate-pulse"></span>
              TRANSCODING LIVE: {transcodePercent}%
            </div>
          )}
        </div>
      </section>

      <div className="bg-white border-2 border-border-primary shadow-[4px_4px_0px_#1A1A1A] p-lg flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div className="flex flex-col gap-xs">
          <div className="flex items-center gap-sm flex-wrap">
            <h2 className="font-page-title text-card-title text-xl font-bold uppercase line-clamp-1" title={fileName}>
              {fileName}
            </h2>
            <span className="bg-status-success/20 text-status-success border-2 border-status-success px-sm py-xs font-label-caps text-label-caps flex items-center gap-xs whitespace-nowrap">
              STREAMING FROM R2
              <span className="material-symbols-outlined text-[12px]">cloud</span>
            </span>
          </div>
          <p className="font-metadata text-metadata text-on-surface-variant">
             Streaming via Cloudflare R2 Edge
          </p>
        </div>
        <div className="flex items-center gap-sm shrink-0">
          <button 
             className="bg-primary-container text-on-primary-fixed border-2 border-border-primary px-lg py-sm font-label-caps text-label-caps shadow-[3px_3px_0px_#1A1A1A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#1A1A1A] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
             onClick={onClose}
          >
            CLOSE PLAYER
          </button>
        </div>
      </div>
    </div>
  );
}
