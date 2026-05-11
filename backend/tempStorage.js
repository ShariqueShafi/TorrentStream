import fs from 'fs';
import path from 'path';

const TEMP_BASE = '/tmp/torrentstream';
const TEMP_HLS = path.join(TEMP_BASE, 'hls');
const TEMP_TORRENTS = path.join(TEMP_BASE, 'torrents');

// Session tracker: jobId → { createdAt, lastAccessed }
const sessions = new Map();

// Stale session timeout: 30 minutes
const STALE_TIMEOUT_MS = 30 * 60 * 1000;

// Cleanup sweep interval: 5 minutes
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Initialize temp directories on startup.
 */
export function initTempStorage() {
  fs.mkdirSync(TEMP_HLS, { recursive: true });
  fs.mkdirSync(TEMP_TORRENTS, { recursive: true });
  console.log(`[TempStorage] Initialized: ${TEMP_BASE}`);
}

/**
 * Get the HLS output directory for a specific job.
 */
export function getHLSDir(jobId) {
  return path.join(TEMP_HLS, jobId);
}

/**
 * Get the torrents download directory.
 */
export function getTorrentsDir() {
  return TEMP_TORRENTS;
}

/**
 * Create an HLS directory for a new stream job.
 */
export function createJobDir(jobId) {
  const dir = getHLSDir(jobId);
  fs.mkdirSync(dir, { recursive: true });
  sessions.set(jobId, { createdAt: Date.now(), lastAccessed: Date.now() });
  console.log(`[TempStorage] Created job dir: ${dir}`);
  return dir;
}

/**
 * Touch a session to reset its stale timer.
 */
export function touchSession(jobId) {
  const session = sessions.get(jobId);
  if (session) {
    session.lastAccessed = Date.now();
  }
}

/**
 * Clean up a specific job's temp files.
 */
export function cleanupJob(jobId) {
  const dir = getHLSDir(jobId);
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`[TempStorage] Cleaned up job: ${jobId}`);
    }
    sessions.delete(jobId);
  } catch (err) {
    console.error(`[TempStorage] Failed to cleanup ${jobId}:`, err.message);
  }
}

/**
 * Clean up ALL temp files (nuclear option).
 */
export function cleanupAll() {
  try {
    if (fs.existsSync(TEMP_HLS)) {
      fs.rmSync(TEMP_HLS, { recursive: true, force: true });
      fs.mkdirSync(TEMP_HLS, { recursive: true });
    }
    sessions.clear();
    console.log('[TempStorage] Cleaned up all temp data');
  } catch (err) {
    console.error('[TempStorage] Failed to cleanup all:', err.message);
  }
}

/**
 * Sweep stale sessions — removes jobs inactive for > STALE_TIMEOUT_MS.
 */
function sweepStaleSessions() {
  const now = Date.now();
  for (const [jobId, session] of sessions) {
    if (now - session.lastAccessed > STALE_TIMEOUT_MS) {
      console.log(`[TempStorage] Sweeping stale job: ${jobId} (inactive ${Math.round((now - session.lastAccessed) / 60000)}min)`);
      cleanupJob(jobId);
    }
  }
}

/**
 * Start the background cleanup sweep.
 * Call this once from server.js at startup.
 */
let sweepInterval = null;
export function startCleanupSweep() {
  if (sweepInterval) clearInterval(sweepInterval);
  sweepInterval = setInterval(sweepStaleSessions, SWEEP_INTERVAL_MS);
  console.log(`[TempStorage] Cleanup sweep started (every ${SWEEP_INTERVAL_MS / 60000}min, stale after ${STALE_TIMEOUT_MS / 60000}min)`);
}

/**
 * Get temp storage stats.
 */
export function getTempStats() {
  let totalSize = 0;
  let fileCount = 0;

  if (fs.existsSync(TEMP_HLS)) {
    const jobs = fs.readdirSync(TEMP_HLS);
    for (const job of jobs) {
      const jobDir = path.join(TEMP_HLS, job);
      try {
        const files = fs.readdirSync(jobDir);
        for (const f of files) {
          const stat = fs.statSync(path.join(jobDir, f));
          totalSize += stat.size;
          fileCount++;
        }
      } catch { /* skip unreadable dirs */ }
    }
  }

  return {
    activeJobs: sessions.size,
    totalSizeMB: Math.round(totalSize / 1e6),
    fileCount,
  };
}
