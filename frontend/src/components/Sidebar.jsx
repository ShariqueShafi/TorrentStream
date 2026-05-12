import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ isOpen, onClose, isAdmin, onLoginClick, onLogoutClick, usage, onRefreshUsage }) {
  // Mobile Nav is separate, but we render both here for layout simplicity
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={onClose} />
      )}

      {/* Desktop & Mobile Sidebar */}
      <aside className={`${isOpen ? 'flex' : 'hidden'} fixed left-0 top-0 h-full w-[260px] bg-surface dark:bg-background border-r-2 border-border-primary flex-col gap-md p-lg z-40 shadow-[5px_0_0_0_#1A1A1A] pt-[72px] transition-all duration-300`}>
        <div className="mb-lg">
          <h2 className="font-section-head text-section-head uppercase text-primary mb-md">
            NAVIGATION
          </h2>
        </div>
        <nav className="flex flex-col gap-sm">
          <NavLink to="/" className={({ isActive }) => `flex items-center gap-sm p-sm font-bold transition-all ${isActive ? 'bg-primary-container text-on-primary-container border-2 border-border-primary neubrutal-shadow' : 'text-on-surface hover:bg-surface-variant border-2 border-transparent hover:border-border-primary hover:shadow-[2px_2px_0px_#1A1A1A]'}`} end onClick={onClose}>
            <span className="material-symbols-outlined">home</span>
            <span className="font-section-head text-section-head uppercase">Home</span>
          </NavLink>
          <NavLink to="/files" className={({ isActive }) => `flex items-center gap-sm p-sm font-bold transition-all ${isActive ? 'bg-primary-container text-on-primary-container border-2 border-border-primary neubrutal-shadow' : 'text-on-surface hover:bg-surface-variant border-2 border-transparent hover:border-border-primary hover:shadow-[2px_2px_0px_#1A1A1A]'}`} onClick={onClose}>
            <span className="material-symbols-outlined">folder_open</span>
            <span className="font-section-head text-section-head uppercase">My Files</span>
          </NavLink>
        </nav>

        {/* Cloudflare Account Storage */}
        <div className="mt-auto border-t-2 border-border-primary pt-md">
          <div className="flex flex-col gap-xs">
            <div className="flex justify-between font-metadata text-metadata uppercase mb-1">
              <span>Account Storage</span>
              <span>
                {usage?.cloudflare?.storage?.percent != null && !usage?.cloudflare?.storage?.error
                  ? `${usage.cloudflare.storage.percent}%`
                  : '—'}
              </span>
            </div>
            <div className="h-4 bg-[#E8E8E8] border-2 border-border-primary relative overflow-hidden cursor-pointer" onClick={onRefreshUsage}>
              {usage?.cloudflare?.storage?.percent != null && !usage?.cloudflare?.storage?.error ? (
                <div 
                  className={`absolute inset-y-0 left-0 border-r-2 border-border-primary transition-all duration-500 ${
                    usage.cloudflare.storage.status === 'safe' ? 'bg-status-success' 
                    : usage.cloudflare.storage.status === 'warning' ? 'bg-status-warning' 
                    : 'bg-status-error'
                  }`}
                  style={{ width: `${Math.min(usage.cloudflare.storage.percent, 100)}%` }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-metadata text-text-secondary uppercase">
                  Click to refresh
                </div>
              )}
            </div>
            <div className="text-[10px] font-metadata text-text-secondary text-right">
              {usage?.cloudflare?.storage?.usedGB != null && !usage?.cloudflare?.storage?.error
                ? `${usage.cloudflare.storage.usedGB} GB / 10 GB`
                : 'Server • Hosting • Cache'}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav Bar */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center py-sm bg-surface dark:bg-background border-t-2 border-border-primary md:hidden shadow-[0_-2px_0_0_#1A1A1A]">
        <NavLink to="/" className={({ isActive }) => `flex flex-col items-center p-sm rounded-xl active:scale-95 transition-transform ${isActive ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`} end>
          <span className="material-symbols-outlined">home</span>
        </NavLink>
        <NavLink to="/files" className={({ isActive }) => `flex flex-col items-center p-sm rounded-xl active:scale-95 transition-transform ${isActive ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
          <span className="material-symbols-outlined">folder_open</span>
        </NavLink>
        <button className="flex flex-col items-center p-sm text-on-surface-variant hover:bg-surface-container-high active:scale-95 transition-transform" onClick={isAdmin ? onLogoutClick : onLoginClick}>
          <span className="material-symbols-outlined">{isAdmin ? 'logout' : 'person'}</span>
        </button>
      </nav>
    </>
  );
}
