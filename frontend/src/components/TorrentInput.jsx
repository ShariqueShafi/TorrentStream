import React, { useState } from 'react';

export default function TorrentInput({ onLoaded, loading, setLoading, isAdmin }) {
  const [magnet, setMagnet] = useState('');

  const lineCount = magnet.trim()
    ? magnet.trim().split('\n').filter((l) => l.trim()).length
    : 0;

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

  // Enter submits; Shift+Enter inserts a newline for multiple links
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <section className="bg-primary-fixed border-b-2 border-border-primary p-lg md:p-2xl">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-hero-display text-hero-display text-on-background mb-lg leading-none">
          Drop your magnet link.
        </h2>
        <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
          <div className="flex items-start bg-white border-2 border-border-primary neubrutal-shadow transition-all group focus-within:translate-x-[2px] focus-within:translate-y-[2px] focus-within:shadow-[1px_1px_0px_#1A1A1A]">
            <span className="material-symbols-outlined pl-md pt-[14px] text-on-surface-variant shrink-0">link</span>
            <textarea
              rows={3}
              className={`w-full p-md font-body-copy bg-transparent border-none outline-none focus:ring-0 resize-none ${
                !isAdmin ? 'cursor-not-allowed text-text-disabled' : 'text-text-primary'
              }`}
              placeholder={
                isAdmin
                  ? 'magnet:?xt=urn:btih:...\nPaste multiple links — one per line\nShift+Enter = new line · Enter = submit'
                  : 'Sign in as admin to add torrents...'
              }
              value={magnet}
              onChange={(e) => setMagnet(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isAdmin || loading}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-md items-start sm:items-center">
            {isAdmin ? (
              <button
                type="submit"
                className="bg-on-background text-on-primary font-bold px-lg py-md flex items-center justify-center gap-sm border-2 border-border-primary neubrutal-shadow neubrutal-hover neubrutal-active whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !magnet.trim()}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  add_circle
                </span>
                <span className="font-label-caps text-label-caps">
                  {loading
                    ? 'LOADING...'
                    : lineCount > 1
                    ? `ADD ${lineCount} STREAMS`
                    : 'ADD STREAM'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                className="bg-on-background text-on-primary font-bold px-lg py-md flex items-center justify-center gap-sm border-2 border-border-primary neubrutal-shadow neubrutal-hover neubrutal-active whitespace-nowrap"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  lock
                </span>
                <span className="font-label-caps text-label-caps">ADMIN REQUIRED</span>
              </button>
            )}
            <p className="font-metadata text-metadata text-on-surface-variant uppercase tracking-widest opacity-70 text-sm">
              {isAdmin
                ? 'ADMIN MODE · SHIFT+ENTER FOR MULTIPLE LINKS'
                : 'GUEST MODE · READ-ONLY ACCESS'}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
