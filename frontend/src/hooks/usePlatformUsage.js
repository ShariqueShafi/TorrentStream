import { useState, useEffect, useCallback } from 'react';

const WARNED_KEY = 'ts_warned_thresholds';

export function usePlatformUsage() {
  const [usage, setUsage]       = useState(null);
  const [banners, setBanners]   = useState([]);
  const [newToasts, setToasts]  = useState([]);

  const checkThresholds = useCallback((data) => {
    const warned = JSON.parse(localStorage.getItem(WARNED_KEY) || '{}');
    const newBanners = [];
    const toasts     = [];

    const checks = [
      // GCP
      { key: 'gcp_vm',     label: 'GCP VM Hours',        data: data?.gcp?.vmHours },
      { key: 'gcp_disk',   label: 'GCP Disk',            data: data?.gcp?.disk },
      { key: 'gcp_egress', label: 'GCP Egress',          data: data?.gcp?.egress },
      // Cloudflare
      { key: 'cf_r2',      label: 'R2 Storage',          data: data?.cloudflare?.r2Storage },
      { key: 'cf_r2a',     label: 'R2 Write Ops',        data: data?.cloudflare?.r2ClassA },
      { key: 'cf_r2b',     label: 'R2 Read Ops',         data: data?.cloudflare?.r2ClassB },
      { key: 'cf_pages',   label: 'Pages Builds',        data: data?.cloudflare?.pagesBuilds },
      { key: 'cf_workers', label: 'Workers Requests',    data: data?.cloudflare?.workersRequests },
    ];

    checks.forEach(({ key, label, data: metric }) => {
      if (!metric || metric.error || !metric.percent || metric.status === 'safe') return;

      newBanners.push({
        key,
        label,
        icon: key.startsWith('gcp') ? '☁️' : '🔶',
        percent: metric.percent,
        status: metric.status,
        detail: `${metric.used} / ${metric.limit} ${metric.unit || ''}`,
      });

      const toastKey = `${key}_${metric.status}`;
      if (!warned[toastKey]) {
        const emoji = metric.status === 'exceeded' ? '🛑' : metric.status === 'critical' ? '🚨' : '⚠️';
        toasts.push({
          id: toastKey,
          type: metric.status === 'safe' ? 'info' : metric.status,
          message: `${emoji} ${label} at ${Math.round(metric.percent)}%`,
          autoDismiss: metric.status === 'exceeded' ? false : metric.status === 'critical' ? 12000 : 8000,
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
    const interval = setInterval(fetchUsage, 60_000);
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
