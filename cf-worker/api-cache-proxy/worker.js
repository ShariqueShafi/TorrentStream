/**
 * TorrentStream — API Cache Proxy Worker
 *
 * Deployed on: api.shamstailors.com/*
 *
 * Architecture:
 *   Browser → Cloudflare Worker (this file) → GCP Backend (origin)
 *
 * What this does:
 *   - Cacheable GETs (torrent list, usage stats, health):
 *       CF edge serves from cache. GCP only gets hit on a cache MISS.
 *   - HLS segments (/hls/*.ts):
 *       Passed to origin with cacheEverything=true. CF respects the
 *       origin's "public, s-maxage=3600, immutable" header.
 *   - Video streams (/api/stream/direct/...) and downloads (/download/...):
 *       Bypassed completely — CF must not buffer streaming responses.
 *   - Auth, POST, DELETE:
 *       Bypassed completely — mutations are never cached.
 *
 * Response headers added:
 *   X-Cache: HIT | MISS | BYPASS   (for debugging in devtools)
 *   X-Cache-Route: <matched route> (which TTL rule fired)
 */

// ── Bypass rules ─────────────────────────────────────────────────────────────
// These patterns are NEVER cached. Order matters: checked top-to-bottom.
const BYPASS_PATTERNS = [
  { pattern: /^\/api\/stream\/direct\//, reason: 'video-stream' },
  { pattern: /^\/download\//,            reason: 'file-download' },
  { pattern: /^\/api\/login/,            reason: 'auth' },
];

// ── Cache TTL table (seconds) ─────────────────────────────────────────────────
// Maps route prefix → { ttl, swr } where swr = stale-while-revalidate window.
// These match the s-maxage values set on the origin for consistency.
const CACHE_ROUTES = [
  { prefix: '/api/health',        ttl: 30,  swr: 10, label: 'health'       },
  { prefix: '/api/usage',         ttl: 55,  swr: 10, label: 'usage'        },
  { prefix: '/api/stream/stats',  ttl: 10,  swr: 5,  label: 'stream-stats' },
  { prefix: '/api/torrents',      ttl: 3,   swr: 2,  label: 'torrent-list' },
  { prefix: '/api/torrent',       ttl: 3,   swr: 2,  label: 'torrent-id'   },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function matchCacheRoute(pathname) {
  return CACHE_ROUTES.find(r => pathname.startsWith(r.prefix)) || null;
}

function isBypass(method, pathname) {
  // Never cache non-GET methods
  if (method !== 'GET') return { bypass: true, reason: `method-${method}` };
  const match = BYPASS_PATTERNS.find(b => b.pattern.test(pathname));
  return match ? { bypass: true, reason: match.reason } : { bypass: false };
}

function addDebugHeaders(response, xCache, label) {
  const headers = new Headers(response.headers);
  headers.set('X-Cache', xCache);
  if (label) headers.set('X-Cache-Route', label);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const url      = new URL(request.url);
    const pathname = url.pathname;
    const method   = request.method;

    // ── 1. BYPASS: streaming, downloads, auth, mutations ──────────────────────
    const { bypass, reason } = isBypass(method, pathname);
    if (bypass) {
      const originResponse = await fetch(request);
      return addDebugHeaders(originResponse, `BYPASS (${reason})`, null);
    }

    // ── 2. HLS SEGMENTS: pass through but force CF edge caching ───────────────
    // Origin already sets "public, s-maxage=3600, immutable" on .ts files.
    // cacheEverything=true tells CF to respect that header for non-static content.
    if (pathname.startsWith('/hls/')) {
      const hlsResponse = await fetch(request, {
        cf: { cacheEverything: true },
      });
      return addDebugHeaders(hlsResponse, 'CF-CACHE', 'hls-segment');
    }

    // ── 3. API CACHING: torrent list, usage, health ───────────────────────────
    const route = matchCacheRoute(pathname);
    if (!route) {
      // Unknown route — pass through without caching
      const passResponse = await fetch(request);
      return addDebugHeaders(passResponse, 'BYPASS (no-rule)', null);
    }

    // Build a stable cache key: URL only (no Authorization header leaking into key).
    // This is safe because all cacheable GET routes return the same data for all users.
    const cacheKey = new Request(url.toString(), { method: 'GET' });
    const cache    = caches.default;

    // ── 3a. Cache HIT ──────────────────────────────────────────────────────────
    const cached = await cache.match(cacheKey);
    if (cached) {
      return addDebugHeaders(cached, 'HIT', route.label);
    }

    // ── 3b. Cache MISS: fetch from GCP origin ─────────────────────────────────
    let originResponse;
    try {
      originResponse = await fetch(request);
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Origin unreachable', detail: err.message }),
        { status: 502, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    // Don't cache error responses (4xx, 5xx)
    if (!originResponse.ok) {
      return addDebugHeaders(originResponse, `MISS (origin-${originResponse.status})`, route.label);
    }

    // Build a cacheable clone with explicit Cache-Control
    const cacheHeaders = new Headers(originResponse.headers);
    cacheHeaders.set('Cache-Control', `public, max-age=0, s-maxage=${route.ttl}, stale-while-revalidate=${route.swr}`);
    cacheHeaders.set('X-Cache', 'MISS');
    cacheHeaders.set('X-Cache-Route', route.label);

    const responseToReturn = new Response(originResponse.body, {
      status:     originResponse.status,
      statusText: originResponse.statusText,
      headers:    cacheHeaders,
    });

    // Store in CF edge cache asynchronously — doesn't block the response
    ctx.waitUntil(cache.put(cacheKey, responseToReturn.clone()));

    return responseToReturn;
  },
};
