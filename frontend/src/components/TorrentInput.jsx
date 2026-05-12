import React, { useState } from 'react';

export default function TorrentInput({ onLoaded, loading, setLoading, isAdmin }) {
  const [magnet, setMagnet] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!magnet.trim() || !isAdmin) return;

    setLoading(true);
    try {
      await onLoaded(magnet.trim());
      setMagnet('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-primary-fixed border-b-2 border-border-primary p-lg md:p-2xl">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-hero-display text-hero-display text-on-background mb-lg leading-none">Drop your magnet link.</h2>
        <form className="flex flex-col md:flex-row gap-md" onSubmit={handleSubmit}>
          <div className="flex-grow flex items-center bg-white border-2 border-border-primary neubrutal-shadow transition-all group focus-within:translate-x-[2px] focus-within:translate-y-[2px] focus-within:shadow-[1px_1px_0px_#1A1A1A]">
            <span className="material-symbols-outlined pl-md text-on-surface-variant">link</span>
            <textarea
              className={`w-full p-md font-body-copy bg-transparent border-none outline-none focus:ring-0 resize-none min-h-[48px] max-h-[150px] ${!isAdmin ? 'cursor-not-allowed text-text-disabled' : 'text-text-primary'}`}
              placeholder={isAdmin ? "Paste magnet links (one per line)..." : "Sign in as admin to add torrents..."}
              value={magnet}
              onChange={(e) => setMagnet(e.target.value)}
              disabled={!isAdmin || loading}
              rows="1"
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
          </div>
          {isAdmin ? (
            <button 
              type="submit" 
              className="bg-on-background text-on-primary font-bold px-lg py-md flex items-center justify-center gap-sm border-2 border-border-primary neubrutal-shadow neubrutal-hover neubrutal-active whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={loading || !magnet.trim()}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              <span className="font-label-caps text-label-caps">{loading ? 'LOADING...' : 'ADD STREAM'}</span>
            </button>
          ) : (
            <button 
              type="button" 
              className="bg-on-background text-on-primary font-bold px-lg py-md flex items-center justify-center gap-sm border-2 border-border-primary neubrutal-shadow neubrutal-hover neubrutal-active whitespace-nowrap"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              <span className="font-label-caps text-label-caps">ADMIN REQUIRED</span>
            </button>
          )}
        </form>
        <p className="mt-md font-metadata text-metadata text-on-surface-variant uppercase tracking-widest opacity-70">
          {isAdmin ? "ADMIN MODE ENABLED • FULL ACCESS" : "GUEST MODE ENABLED • READ-ONLY ACCESS"}
        </p>
      </div>
    </section>
  );
}
