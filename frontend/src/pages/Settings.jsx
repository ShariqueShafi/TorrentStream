import React from 'react';

export default function Settings() {
  return (
    <div className="flex-grow p-lg md:p-xl max-w-[1200px] mx-auto w-full">
      <div className="mb-xl">
        <h1 className="font-section-head text-section-head uppercase border-l-4 border-primary pl-md">
          ⚙️ App Settings
        </h1>
      </div>

      <div className="bg-white border-2 border-border-primary shadow-[4px_4px_0px_#1A1A1A] p-xl">
        <p className="font-body-copy text-body-copy text-text-secondary">
          Settings module coming soon. Configuration is currently handled via the backend <code className="bg-surface-variant border border-border-primary px-xs font-mono text-sm">.env</code> file on the server.
        </p>

        <div className="mt-xl border-t-2 border-border-primary pt-lg">
          <h2 className="font-section-head text-section-head uppercase mb-md text-on-surface">Backend Variables</h2>
          <div className="flex flex-col gap-sm font-mono text-sm text-text-secondary">
            {[
              ['PORT', 'HTTP port for the backend server (default: 8080)'],
              ['NODE_ENV', 'production or development'],
              ['ADMIN_USER', 'Admin username for torrent management'],
              ['ADMIN_PASSWORD', 'Admin password'],
              ['JWT_SECRET', 'Secret key for signing auth tokens'],
            ].map(([key, desc]) => (
              <div key={key} className="flex flex-wrap gap-md p-sm bg-surface-variant border border-border-primary">
                <span className="font-bold text-on-surface w-40 shrink-0">{key}</span>
                <span className="text-text-secondary">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
