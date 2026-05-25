import React, { useState } from 'react';
import Modal from './Modal';

const formatSize = (bytes) => {
  if (!bytes) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function TorrentList({ torrents, onSelect, onRemove, isAdmin }) {
  const [deleteTarget, setDeleteTarget] = useState(null); // torrent to confirm-delete

  return (
    <section className="p-lg md:p-xl flex-grow">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-lg">
          <h3 className="font-section-head text-section-head uppercase border-l-4 border-primary pl-md">Active Torrents</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
          {torrents.map((torrent) => {
            const fileCount = torrent.files ? torrent.files.length : 0;
            // API returns totalSize; fallback to length for safety
            const sizeBytes = torrent.totalSize || torrent.length || 0;

            return (
              <div
                key={torrent.id}
                className="bg-bg-card border-2 border-border-primary neubrutal-shadow flex flex-col h-full hover:-translate-y-1 transition-transform cursor-pointer group"
                onClick={() => onSelect(torrent)}
              >
                <div className="h-48 bg-primary-fixed border-b-2 border-border-primary flex items-center justify-center text-6xl relative overflow-hidden group-hover:bg-accent-hover transition-colors">
                  <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#1A1A1A 1px, transparent 1px)', backgroundSize: '10px 10px' }}
                  />
                  <span>🎬</span>
                  {torrent.ready && (
                    <div className="absolute top-sm right-sm bg-status-success text-on-primary border-2 border-border-primary px-xs py-[2px] font-metadata text-[10px] shadow-[2px_2px_0px_#1A1A1A]">
                      READY
                    </div>
                  )}
                  {!torrent.ready && (
                    <div className="absolute top-sm right-sm bg-primary-fixed text-on-background border-2 border-border-primary px-xs py-[2px] font-metadata text-[10px] shadow-[2px_2px_0px_#1A1A1A] animate-pulse">
                      LOADING
                    </div>
                  )}
                </div>

                <div className="p-md flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-sm gap-2">
                    <h4 className="font-card-title text-card-title leading-tight line-clamp-2" title={torrent.name}>
                      {torrent.name || 'Unnamed Torrent'}
                    </h4>
                    <span className="bg-surface-variant border border-border-primary px-xs font-metadata text-[9px] whitespace-nowrap mt-1">
                      {fileCount} FILES
                    </span>
                  </div>

                  <div className="mt-auto pt-md">
                    <div className="flex justify-between font-metadata text-[10px] mb-1 uppercase text-text-secondary">
                      <span>Size</span>
                      <span>{formatSize(sizeBytes)}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        className="flex-grow bg-on-background text-on-primary font-bold py-sm flex items-center justify-center gap-sm border-2 border-border-primary neubrutal-shadow neubrutal-hover neubrutal-active"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(torrent);
                        }}
                      >
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                          folder_open
                        </span>
                        <span className="font-label-caps text-label-caps">BROWSE</span>
                      </button>

                      {isAdmin && (
                        <button
                          className="bg-white text-status-error font-bold px-sm py-sm flex items-center justify-center border-2 border-border-primary neubrutal-shadow neubrutal-hover neubrutal-active"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(torrent);
                          }}
                          title="Delete from R2"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {torrents.length === 0 && (
            <div className="col-span-full bg-surface-variant border-2 border-border-primary border-dashed flex flex-col h-full items-center justify-center p-xl opacity-60 min-h-[300px]">
              <span className="material-symbols-outlined text-4xl mb-md">cloud_off</span>
              <p className="font-metadata text-metadata uppercase text-center">
                Your archive is empty
                <br />
                Add a magnet link to begin
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Torrent"
        icon="delete_forever"
        actionLabel="Remove"
        actionVariant="danger"
        onAction={() => {
          if (deleteTarget) onRemove(deleteTarget.id);
        }}
      >
        <p>
          Are you sure you want to remove{' '}
          <strong>{deleteTarget?.name || 'this torrent'}</strong> from the server?
          <br />
          <span className="text-status-error font-bold">This action cannot be undone.</span>
        </p>
      </Modal>
    </section>
  );
}
