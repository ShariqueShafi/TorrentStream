import { useState, useEffect, useCallback } from 'react';

const WARNED_KEY = 'ts_warned_thresholds'; // localStorage key

export function usePlatformUsage() {
  const [usage, setUsage]       = useState(null);
  const [banners, setBanners]   = useState([]);
  const [newToasts, setToasts]  = useState([]);

  const checkThresholds = useCallback((data) => {
    const warned = JSON.parse(localStorage.getItem(WARNED_KEY) || '{}');
    const newBanners = [];
    const toasts     = [];

    const checks = [
      {
        key:     'r2_storage',
        label:   'Cloudflare R2 Storage',
        icon:    '☁️',
        percent: data?.cloudflare?.storage?.percent,
        status:  data?.cloudflare?.storage?.status,
        detail:  `${data?.cloudflare?.storage?.freeGB} GB remaining`,
        action:  { label: 'MANAGE R2', href: '/manage-r2' },
      },
      {
        key:     'r2_requests',
        label:   'Cloudflare R2 Requests',
        icon:    '☁️',
        percent: data?.cloudflare?.requests?.percent,
        status:  data?.cloudflare?.requests?.status,
        detail:  `${(data?.cloudflare?.requests?.remaining || 0).toLocaleString()} requests remaining this month`,
        action:  { label: 'VIEW USAGE', href: '/manage-r2' },
      },
      {
        key:     'render_hours',
        label:   'GCP VM Uptime',
        icon:    '⚡',
        percent: data?.render?.hours?.percent,
        status:  data?.render?.hours?.status,
        detail:  `${data?.render?.hours?.remaining} hours remaining this month`,
        action:  { label: 'VIEW USAGE', href: '/settings' },
      },
    ];

    checks.forEach(({ key, label, icon, percent, status, detail, action }) => {
      if (!percent || status === 'safe') return;

      // Show sticky banner for warning+ states
      newBanners.push({ key, label, icon, percent, status, detail, action });

      // Fire toast only ONCE per threshold crossing
      const toastKey = `${key}_${status}`;
      if (!warned[toastKey]) {
        const emoji = status === 'exceeded' ? '🛑' : status === 'critical' ? '🚨' : '⚠️';
        toasts.push({
          id: toastKey,
          type: status === 'safe' ? 'info' : status,
          message: `${emoji} ${label} at ${Math.round(percent)}% — ${detail}`,
          autoDismiss: status === 'exceeded' ? false : status === 'critical' ? 12000 : 8000,
        });
        warned[toastKey] = true;
      }
    });

    localStorage.setItem(WARNED_KEY, JSON.stringify(warned));
    setBanners(newBanners);
    if (toasts.length > 0) setToasts(toasts);
  }, []);

  const fetchUsage = useCallback(async () => {
    try {
      const res  = await fetch(import.meta.env.VITE_API_BASE + '/api/usage');
      const data = await res.json();
      setUsage(data);
      checkThresholds(data);
    } catch (err) {
      console.error('Usage fetch failed:', err);
    }
  }, [checkThresholds]);

  useEffect(() => {
    fetchUsage();
    const interval = setInterval(fetchUsage, 60_000); // every 60s
    return () => clearInterval(interval);
  }, [fetchUsage]);

  // Reset warned thresholds at start of each new month
  useEffect(() => {
    const now = new Date();
    const resetKey = `ts_warned_month_${now.getMonth()}_${now.getFullYear()}`;
    if (!localStorage.getItem(resetKey)) {
      localStorage.removeItem(WARNED_KEY);
      localStorage.setItem(resetKey, '1');
    }
  }, []);

  const dismissBanner = (key) => {
    setBanners(prev => prev.filter(b => b.key !== key));
  };

  return { usage, banners, newToasts, dismissBanner, refetch: fetchUsage };
}
