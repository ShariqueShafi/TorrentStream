import React from 'react';
import { NavLink } from 'react-router-dom';

function UsageBar({ label, data }) {
  if (!data || data.error) return null;
  
  const formatValue = (val, unit) => {
    if (val === null || val === undefined || isNaN(val)) return '0';
    if (unit === 'ops' || unit === 'reqs/day' || unit === 'builds') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
      return val.toString();
    }
    return val.toString();
  };

  const formatLimit = (val, unit) => {
    if (val === null || val === undefined || isNaN(val)) return '0';
    if (unit === 'ops' || unit === 'reqs/day' || unit === 'builds') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
      return val.toString();
    }
    return val.toString();
  };

  const barColor = data.status === 'safe' ? 'bg-status-success'
    : data.status === 'warning' ? 'bg-status-warning'
    : 'bg-status-error';

  const percent = (data.percent === null || data.percent === undefined || isNaN(data.percent)) ? 0 : data.percent;

  return (
    <div className="flex flex-col gap-[2px]">
      <div className="flex justify-between font-metadata text-[9px] uppercase">
        <span className="truncate">{label}</span>
        <span className="whitespace-nowrap ml-1">{percent}%</span>
      </div>
      <div className="h-[10px] bg-[#E8E8E8] border border-border-primary relative overflow-hidden">
        <div 
          className={`absolute inset-y-0 left-0 transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <div className="text-[8px] font-metadata text-text-secondary text-right">
        {formatValue(data.used, data.unit)} / {formatLimit(data.limit, data.unit)} {data.unit === 'GB' || data.unit === 'hrs' ? data.unit : ''}
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose, isAdmin, onLoginClick, onLogoutClick, usage, onRefreshUsage }) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={onClose} />
      )}

      {/* Desktop & Mobile Sidebar */}
      <aside className={`${isOpen ? 'flex' : 'hidden'} fixed left-0 top-0 h-full w-[260px] bg-surface dark:bg-background border-r-2 border-border-primary flex-col gap-md p-lg z-40 shadow-[5px_0_0_0_#1A1A1A] pt-[72px] transition-all duration-300 overflow-y-auto`}>
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

        {/* Usage Section */}
        <div className="mt-auto border-t-2 border-border-primary pt-md flex flex-col gap-md cursor-pointer" onClick={onRefreshUsage}>
          
          {/* Google Cloud Section */}
          <div>
            <div className="font-metadata text-[9px] uppercase text-primary font-bold mb-xs tracking-widest flex items-center gap-1">
              <span className="text-[10px]">☁️</span> Google Cloud
            </div>
            <div className="flex flex-col gap-sm">
              <UsageBar label="VM Hours" data={usage?.gcp?.vmHours} />
              <UsageBar label="Disk" data={usage?.gcp?.disk} />
              <UsageBar label="Egress" data={usage?.gcp?.egress} />
            </div>
          </div>

          {/* Cloudflare Section */}
          <div>
            <div className="font-metadata text-[9px] uppercase text-primary font-bold mb-xs tracking-widest flex items-center gap-1">
              <span className="text-[10px]">🔶</span> Cloudflare
            </div>
            <div className="flex flex-col gap-sm">
              <UsageBar label="R2 Storage" data={usage?.cloudflare?.r2Storage} />
              <UsageBar label="R2 Writes" data={usage?.cloudflare?.r2ClassA} />
              <UsageBar label="R2 Reads" data={usage?.cloudflare?.r2ClassB} />
              <UsageBar label="Pages Builds" data={usage?.cloudflare?.pagesBuilds} />
              <UsageBar label="Workers Reqs" data={usage?.cloudflare?.workersRequests} />
            </div>
          </div>

          <div className="text-[8px] font-metadata text-text-secondary text-center uppercase tracking-widest">
            Free tier limits • Click to refresh
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
