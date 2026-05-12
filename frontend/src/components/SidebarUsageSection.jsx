import React from 'react';

function UsageBar({ label, used, limit, unit, status }) {
  const pct = Math.min((used / limit) * 100, 100);
  return (
    <div className="sidebar-usage-row">
      <div className="sidebar-usage-meta">
        <span className="sidebar-usage-label">{label}</span>
        <span className="sidebar-usage-numbers">
          {used} / {limit} {unit}
        </span>
      </div>
      <div className="usage-bar-track">
        <div
          className={`usage-bar-fill ${status}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function SidebarUsageSection({ usage, onRefresh }) {
  if (!usage) return null;

  return (
    <div className="sidebar-usage-section">
      <div className="sidebar-usage-title">
        PLATFORM USAGE
      </div>

      {/* Cloudflare R2 */}
      <div className="sidebar-platform-block">
        <div className={`sidebar-platform-name ${['warning', 'critical'].includes(usage.cloudflare?.storage?.status) ? 'usage-' + usage.cloudflare.storage.status : ''}`}>
          ☁️ CLOUDFLARE R2
          <span className="warn-icon">⚠️</span>
        </div>
        {usage.cloudflare?.storage && (
          <UsageBar
            label="STORAGE"
            used={usage.cloudflare.storage.usedGB}
            limit={usage.cloudflare.storage.limitGB}
            unit="GB"
            status={usage.cloudflare.storage.status}
          />
        )}
        {usage.cloudflare?.requests && (
          <div style={{ marginTop: '10px' }}>
            <UsageBar
              label="REQUESTS"
              used={(usage.cloudflare.requests.used / 1000000).toFixed(1)}
              limit={(usage.cloudflare.requests.limit / 1000000).toFixed(1)}
              unit="M this month"
              status={usage.cloudflare.requests.status}
            />
          </div>
        )}
      </div>

      <div style={{ height: '1px', background: '#E8E8E8', margin: '14px 0' }} />

      {/* GCP VM */}
      <div className="sidebar-platform-block">
        <div className={`sidebar-platform-name ${['warning', 'critical'].includes(usage.render?.hours?.status) ? 'usage-' + usage.render.hours.status : ''}`}>
          ⚡ GCP VM
          <span className="warn-icon">⚠️</span>
        </div>
        {usage.render?.hours && (
          <UsageBar
            label="COMPUTE HOURS"
            used={usage.render.hours.used}
            limit={usage.render.hours.limit}
            unit="hrs this month"
            status={usage.render.hours.status}
          />
        )}
      </div>

      <div style={{ height: '1px', background: '#E8E8E8', margin: '14px 0' }} />

      <div className="sidebar-usage-timestamp">
        <span>Last updated: just now</span>
        <button className="refresh-btn" onClick={onRefresh}>
          ↻ Refresh
        </button>
      </div>
    </div>
  );
}
