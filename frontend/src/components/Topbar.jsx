import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Topbar({ onMenuClick, isAdmin, onLoginClick, onLogoutClick }) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex items-center px-lg bg-surface dark:bg-background border-b-2 border-border-primary h-[52px]">
      <div className="flex items-center justify-between w-full max-w-[1440px] mx-auto">
        <div className="flex items-center gap-4">
          <button 
            className="material-symbols-outlined text-primary hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#1A1A1A] transition-all active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
            onClick={onMenuClick}
          >
            menu
          </button>
          <NavLink to="/" className="font-page-title text-page-title font-bold text-on-surface dark:text-primary-fixed flex items-center gap-2 uppercase tracking-tighter">
            TORRENTSTREAM
          </NavLink>
        </div>
        <div className="hidden md:flex items-center gap-lg">
          <nav className="flex items-center gap-md">
            <NavLink to="/" className={({ isActive }) => `font-label-caps text-label-caps ${isActive ? 'text-primary border-2 border-border-primary px-sm py-xs neubrutal-shadow font-bold' : 'text-on-surface-variant hover:translate-x-[1px] hover:translate-y-[1px] transition-all'}`} end>
              Home
            </NavLink>
            <NavLink to="/files" className={({ isActive }) => `font-label-caps text-label-caps ${isActive ? 'text-primary border-2 border-border-primary px-sm py-xs neubrutal-shadow font-bold' : 'text-on-surface-variant hover:translate-x-[1px] hover:translate-y-[1px] transition-all'}`}>
              My Files
            </NavLink>
          </nav>
          
          <button 
            onClick={isAdmin ? onLogoutClick : onLoginClick}
            className="w-8 h-8 rounded-full border-2 border-border-primary flex items-center justify-center neubrutal-shadow neubrutal-hover neubrutal-active overflow-hidden bg-white"
          >
            {isAdmin ? (
               <span className="material-symbols-outlined text-sm">logout</span>
            ) : (
               <span className="material-symbols-outlined text-sm">person</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
