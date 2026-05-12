import React, { useState, useEffect } from 'react';

export default function R2StorageBox() {
  const [storage, setStorage] = useState({ used: 0, total: 10, percent: 0, free: 10 });

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_BASE + '/api/usage');
        const data = await res.json();
        if (data.cloudflare?.storage) {
          setStorage({
            used: data.cloudflare.storage.usedGB,
            total: data.cloudflare.storage.limitGB,
            percent: data.cloudflare.storage.percent,
            free: data.cloudflare.storage.freeGB
          });
        }
      } catch (err) {
        console.error('Storage fetch failed:', err);
      }
    };

    fetchStorage();
    const interval = setInterval(fetchStorage, 60000); // 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="storage-box">
      <div className="storage-eyebrow">
        <div className="storage-live-dot"></div>
        ☁️ LIVE R2 STORAGE
      </div>
      
      <div className="storage-number">{storage.used}</div>
      <div className="storage-unit">of {storage.total} GB used</div>
      
      <div className="storage-bar-track">
        <div 
          className="storage-bar-fill" 
          style={{ width: `${storage.percent}%`, background: storage.percent > 90 ? '#EF4444' : storage.percent > 80 ? '#F59E0B' : '#F5E642' }} 
        />
      </div>
      
      <div className="storage-free">{storage.free} GB free</div>
    </div>
  );
}
