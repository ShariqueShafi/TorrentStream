import React from 'react';
import { getDownloadUrl } from '../api';

const formatSize = (bytes) => {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '—';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (category) => {
  switch (category) {
    case 'video': return '🎬';
    case 'audio': return '🎵';
    case 'image': return '🖼️';
    case 'document': return '📄';
    case 'archive': return '📦';
    default: return '📄';
  }
};

export default function FileBrowser({ torrent, onPlay, isAdmin, onRemove }) {
  if (!torrent) return null;

  // Use totalSize (API field); fall back to length for safety
  const totalBytes = torrent.totalSize ?? torrent.length ?? 0;
  const totalFiles = torrent.files ? torrent.files.length : 0;
  const hasFiles = totalFiles > 0;

  return (
    <div className="flex-grow p-lg md:p-xl w-full max-w-[1200px] mx-auto">
      {/* Torrent Header Card */}
      <section className="bg-border-primary text-on-primary p-lg mb-xl border-2 border-border-primary shadow-[6px_6px_0px_#F5E642] relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-md">
            <div className="flex flex-col gap-xs">
              <h1 className="font-page-title text-2xl md:text-3xl font-extrabold uppercase leading-tight tracking-tighter">
                {torrent.name || 'Unnamed Torrent'}
              </h1>
              <div className="flex items-center gap-md font-metadata text-metadata text-surface-variant">
                <span>{hasFiles ? `${totalFiles} files` : 'Fetching file list…'}</span>
                {hasFiles && (
                  <>
                    <span className="w-[4px] h-[4px] bg-primary-container rounded-full" />
                    <span>{formatSize(totalBytes)}</span>
                  </>
                )}
              </div>
            </div>
            {!torrent.ready && (
              <div className="bg-primary-fixed text-on-background font-label-caps text-label-caps px-md py-sm border-2 border-border-primary flex items-center gap-sm animate-pulse ml-auto sm:ml-0">
                <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                FETCHING METADATA
              </div>
            )}
          </div>
        </div>
      </section>

      {/* File Browser List */}
      <div className="flex flex-col gap-md">
        {!hasFiles ? (
          <div className="bg-white border-2 border-border-primary p-2xl text-center shadow-[4px_4px_0px_#1A1A1A]">
            <div className="text-4xl mb-md animate-bounce">🛰️</div>
            <h3 className="font-section-head text-section-head uppercase font-black">Waiting for metadata</h3>
            <p className="font-body-copy text-text-secondary mt-sm">
              Fetching torrent info from peers. This usually takes a few seconds.
            </p>
            <div className="flex justify-center gap-1 mt-lg">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-border-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            {isAdmin && onRemove && (
              <div className="mt-xl flex justify-center">
                <button
                  onClick={() => {
                    if (window.confirm('Cancel and remove this stuck torrent?')) {
                      onRemove(torrent.id);
                    }
                  }}
                  className="bg-white text-status-error font-bold px-xl py-md flex items-center justify-center gap-sm border-2 border-border-primary shadow-[4px_4px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1A1A1A] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                >
                  <span className="material-symbols-outlined">delete_forever</span>
                  <span>CANCEL & REMOVE</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          [...torrent.files]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((file) => {
              const extension = file.name.split('.').pop() || '';
              return (
              <div
                key={file.index}
                className="group flex flex-wrap items-center gap-md p-md bg-white border-2 border-border-primary shadow-[4px_4px_0px_#1A1A1A] hover:border-l-primary-fixed hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1A1A1A] transition-all"
              >
                <div className="w-12 h-12 bg-primary-container border-2 border-border-primary flex items-center justify-center text-2xl">
                  {getFileIcon(file.category)}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <h3 className="font-card-title text-card-title font-bold break-all" title={file.name}>
                    {file.name}
                  </h3>
                  <p className="font-metadata text-metadata text-text-secondary mt-xs uppercase">
                    {extension} · {formatSize(file.size)}
                  </p>
                </div>
                <div className="flex items-center gap-md ml-auto">
                  {file.category === 'video' && (
                    <button
                      className={`bg-primary-container border-2 border-border-primary px-md py-sm font-label-caps text-label-caps flex items-center gap-sm shadow-[3px_3px_0px_#1A1A1A] transition-all ${
                        !torrent.ready
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1A1A1A] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none'
                      }`}
                      onClick={() => torrent.ready && onPlay(torrent.id, file.index, file.name)}
                      disabled={!torrent.ready}
                    >
                      <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                      {torrent.ready ? 'STREAM' : 'WAIT...'}
                    </button>
                  )}
                  <a
                    href={torrent.ready ? getDownloadUrl(torrent.id, file.index) : '#'}
                    download={torrent.ready ? file.name : undefined}
                    target={torrent.ready ? '_blank' : '_self'}
                    rel="noreferrer"
                    className={`bg-white border-2 border-border-primary px-lg py-sm font-label-caps text-label-caps flex items-center gap-sm shadow-[3px_3px_0px_#1A1A1A] transition-all ${
                      !torrent.ready
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1A1A1A] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none'
                    }`}
                    onClick={(e) => !torrent.ready && e.preventDefault()}
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    {torrent.ready ? 'DOWNLOAD' : 'WAIT...'}
                  </a>
                  {isAdmin && onRemove && (
                    <button
                      className="bg-white text-status-error border-2 border-border-primary p-sm flex items-center justify-center shadow-[3px_3px_0px_#1A1A1A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1A1A1A] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all w-[42px] h-[42px] shrink-0"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to remove this file/torrent?')) {
                          onRemove(torrent.id);
                        }
                      }}
                      title="Remove File"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
