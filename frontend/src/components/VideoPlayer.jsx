import React, { useState, useEffect } from 'react';
import api from '../api';

const API_BASE = api.defaults.baseURL || '';

export default function VideoPlayer({ torrentId, fileIndex, fileName, onClose }) {
  const [streamUrl, setStreamUrl] = useState(null);
  const [status, setStatus] = useState('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    startStream();
  }, [torrentId, fileIndex]);

  const startStream = async () => {
    setStatus('processing');
    setErrorMsg('');
    try {
      // The backend now returns the direct streaming URL instantly
      const res = await fetch(`${API_BASE}/api/stream/${torrentId}/${fileIndex}`, {
        method: 'POST'
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to start stream');

      if (data.status === 'ready' && data.hlsUrl) {
        setStreamUrl(`${API_BASE}${data.hlsUrl}`);
        setStatus('ready');
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-lg px-lg md:px-xl max-w-7xl mx-auto w-full mb-xl">
      <section className="relative">
        <div className="aspect-video bg-black border-4 border-border-primary shadow-[8px_8px_0px_#1A1A1A] flex items-center justify-center group overflow-hidden relative">
          
          {status === 'processing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 text-white p-lg text-center">
              <span className="material-symbols-outlined text-4xl animate-spin mb-md" style={{ fontVariationSettings: "'FILL' 1" }}>sync</span>
              <h3 className="font-section-head text-section-head uppercase mb-sm">CONNECTING TO PEERS</h3>
              <p className="font-metadata text-metadata uppercase mt-sm text-white/70">
                Fetching video stream directly...
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

          {status === 'ready' && streamUrl && (
            <video 
              src={streamUrl}
              controls 
              autoPlay
              className="w-full h-full object-contain z-10"
            />
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
