import React, { useState, useEffect, useRef } from 'react';
import api from '../api';

const API_BASE = api.defaults.baseURL || '';

export default function VideoPlayer({ torrent, fileIndex, fileName, onClose }) {
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const videoRef = useRef(null);

  const torrentId = torrent?.id;

  // Build the direct stream URL — no POST needed, the backend serves
  // HTTP range requests directly at this endpoint.
  const streamUrl = `${API_BASE}/api/stream/direct/${torrentId}/${fileIndex}`;

  useEffect(() => {
    setStatus('loading');
    setErrorMsg('');
  }, [torrentId, fileIndex]);

  const subtitles = torrent?.files?.filter(f => f.name.endsWith('.vtt') || f.name.endsWith('.srt')) || [];

  const handleVideoCanPlay = () => setStatus('ready');
  const handleVideoError = (e) => {
    const code = e.target?.error?.code;
    const msg = e.target?.error?.message || 'Could not load video stream.';
    setStatus('error');
    setErrorMsg(`Media error ${code}: ${msg}`);
  };

  const handleRetry = () => {
    setStatus('loading');
    setErrorMsg('');
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  return (
    <div className="flex flex-col gap-lg px-lg md:px-xl max-w-7xl mx-auto w-full mb-xl">
      <section className="relative">
        <div className="aspect-video bg-black border-4 border-border-primary flex items-center justify-center group overflow-hidden relative">
          
          {status === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 text-white p-lg text-center pointer-events-none">
              <span className="material-symbols-outlined text-4xl animate-spin mb-md" style={{ fontVariationSettings: "'FILL' 1" }}>sync</span>
              <h3 className="font-section-head text-section-head uppercase mb-sm">CONNECTING TO PEERS</h3>
              <p className="font-metadata text-metadata uppercase mt-sm text-white/70">
                Buffering stream — playback starts automatically…
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 text-status-error p-lg text-center">
              <span className="material-symbols-outlined text-4xl mb-md">error</span>
              <h3 className="font-section-head text-section-head uppercase mb-sm">STREAM ERROR</h3>
              <p className="font-metadata text-metadata uppercase mb-md text-white/70">{errorMsg}</p>
              <button 
                onClick={handleRetry}
                className="bg-status-error text-white font-bold px-lg py-sm border-2 border-border-primary neubrutal-shadow neubrutal-hover neubrutal-active"
              >
                RETRY CONNECTION
              </button>
            </div>
          )}

          {/* Video element is always in DOM so the browser can start buffering immediately */}
          <video
            ref={videoRef}
            src={streamUrl}
            controls
            autoPlay
            crossOrigin="anonymous"
            className="w-full h-full object-contain z-10"
            onCanPlay={handleVideoCanPlay}
            onError={handleVideoError}
          >
            {subtitles.map((sub, idx) => (
              <track 
                key={sub.index}
                kind="subtitles"
                src={`${API_BASE}/download/${torrentId}/${sub.index}`}
                srcLang="en"
                label={sub.name}
                default={idx === 0}
              />
            ))}
          </video>
        </div>
      </section>

      <div className="bg-white border-2 border-border-primary shadow-[4px_4px_0px_#1A1A1A] p-lg flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div className="flex flex-col gap-xs">
          <div className="flex items-center gap-sm flex-wrap">
            <h2 className="font-page-title text-card-title text-xl font-bold uppercase line-clamp-1" title={fileName}>
              {fileName}
            </h2>
            <span className="bg-status-success/20 text-status-success border-2 border-status-success px-sm py-xs font-label-caps text-label-caps flex items-center gap-xs whitespace-nowrap">
              DIRECT STREAM
              <span className="material-symbols-outlined text-[12px]">bolt</span>
            </span>
          </div>
          <p className="font-metadata text-metadata text-on-surface-variant">
             Streaming natively via HTTP Range Requests
          </p>
        </div>
        <div className="flex items-center gap-sm shrink-0">
          <button 
             className="bg-primary-container text-on-primary-fixed border-2 border-border-primary px-lg py-sm font-label-caps text-label-caps shadow-[3px_3px_0px_#1A1A1A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#1A1A1A] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-2"
             onClick={onClose}
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            BACK TO FOLDER
          </button>
        </div>
      </div>
    </div>
  );
}
