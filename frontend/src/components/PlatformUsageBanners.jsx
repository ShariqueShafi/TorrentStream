import React from 'react';

export default function PlatformUsageBanners({ banners, onDismiss }) {
  if (!banners || banners.length === 0) return null;

  return (
    <div className="platform-usage-banners">
      {banners.map((banner) => {
        const isCritical = banner.status === 'critical' || banner.status === 'exceeded';
        const bannerClass = isCritical ? 'banner-critical' : 'banner-warning';
        
        return (
          <div key={banner.key} className={`platform-warning-banner ${bannerClass}`}>
            <div className="banner-icon">{isCritical ? '🚨' : '⚠️'}</div>
            <div className="banner-text">
              <div className="banner-title">
                {banner.label.toUpperCase()} — {Math.round(banner.percent)}% USED
              </div>
              <div className="banner-desc">{banner.detail}</div>
            </div>
            
            {banner.action && (
              <button className="banner-action" onClick={() => window.location.href = banner.action.href}>
                {banner.action.label}
              </button>
            )}
            
            {banner.status !== 'exceeded' && (
              <button className="banner-dismiss" onClick={() => onDismiss(banner.key)}>
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
