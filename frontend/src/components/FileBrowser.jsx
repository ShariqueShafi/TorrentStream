import React from 'react';
import { getDownloadUrl } from '../api';

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
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

export default function FileBrowser({ torrent, onPlay, isAdmin }) {
  if (!torrent) return null;

  const totalFiles = torrent.files ? torrent.files.length : 0;

  return (
    <div className="flex-grow p-lg md:p-xl w-full max-w-[1200px] mx-auto">
      {/* Torrent Header Card */}
      <section className="bg-border-primary text-on-primary p-lg mb-xl border-2 border-border-primary shadow-[6px_6px_0px_#F5E642] relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-md">
            <div className="flex flex-col gap-xs">
              <h1 className="font-page-title text-[32px] font-extrabold uppercase leading-none tracking-tighter">
                {torrent.name || 'Fetching metadata...'}
              </h1>
              <div className="flex items-center gap-md font-metadata text-metadata text-surface-variant">
                <span>{totalFiles} files</span>
                <span className="w-[4px] h-[4px] bg-primary-container rounded-full"></span>
                <span>{formatSize(torrent.totalSize)}</span>
              </div>
            </div>
            {torrent.ready ? (
              <div className="bg-status-success text-on-primary font-label-caps text-label-caps px-md py-sm border-2 border-on-primary flex items-center gap-sm">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_done</span>
                READY ON R2
              </div>
            ) : (
              <div className="bg-primary-fixed text-on-background font-label-caps text-label-caps px-md py-sm border-2 border-border-primary flex items-center gap-sm animate-pulse">
                <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                FETCHING METADATA
              </div>
            )}
          </div>
        </div>
      </section>

      {/* File Browser List */}
      <div className="flex flex-col gap-md">
        {(!torrent.files || torrent.files.length === 0) ? (
          <div className="bg-white border-2 border-border-primary p-2xl text-center shadow-[4px_4px_0px_#1A1A1A]">
            <div className="text-4xl mb-md">🛰️</div>
            <h3 className="font-section-head text-section-head uppercase font-black">Waiting for metadata</h3>
            <p className="font-body-copy text-text-secondary mt-sm">This usually takes a few seconds once peers are found.</p>
          </div>
        ) : (
          torrent.files.map((file) => {
            const extension = file.name.split('.').pop() || '';
            return (
              <div key={file.index} className="group flex flex-wrap items-center gap-md p-md bg-white border-2 border-border-primary shadow-[4px_4px_0px_#1A1A1A] hover:border-l-primary-fixed hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1A1A1A] transition-all">
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
                      className="bg-primary-container border-2 border-border-primary px-md py-sm font-label-caps text-label-caps flex items-center gap-sm shadow-[3px_3px_0px_#1A1A1A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1A1A1A] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
                      onClick={() => onPlay(torrent.id, file.index, file.name)}
                    >
                      <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                      ▶ STREAM
                    </button>
                  )}
                  <a 
                    href={getDownloadUrl(torrent.id, file.index)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-white border-2 border-border-primary px-md py-sm font-label-caps text-label-caps flex items-center gap-sm shadow-[3px_3px_0px_#1A1A1A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1A1A1A] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
                  >
                    <span className="material-symbols-outlined text-[14px]">download</span>
                    ↓ DL
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
