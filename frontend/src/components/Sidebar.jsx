import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ torrentCount = 0 }) => {
  const navClass = ({ isActive }) => isActive ? 'nav-item active' : 'nav-item';

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        🎬 TORRENTSTREAM
      </div>
      
      <div className="sidebar-nav">
        <NavLink to="/" className={navClass} end>
          {({ isActive }) => (<><span>{isActive ? '◉' : '○'}</span> Home</>)}
        </NavLink>
        <NavLink to="/files" className={navClass} end>
          {({ isActive }) => (
            <>
              <span>{isActive ? '◉' : '○'}</span> My Files
              {torrentCount > 0 && <span className="nav-badge">{torrentCount}</span>}
            </>
          )}
        </NavLink>

        <div className="nav-section-title">ACCOUNT</div>
        <NavLink to="/settings" className={navClass}>
          {({ isActive }) => (<><span>{isActive ? '◉' : '○'}</span> Settings</>)}
        </NavLink>
      </div>

      <div className="sidebar-footer">
        <div style={{ fontSize: '11px', color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}>
          TorrentStream v2
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-disabled)', marginTop: '4px' }}>
          Live streaming • No cloud storage
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
