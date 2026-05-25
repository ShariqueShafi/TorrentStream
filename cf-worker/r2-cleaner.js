/**
 * Cloudflare Worker — R2 Bucket Cleaner
 *
 * Replaces the old cloudflareCleaner.js that ran on the GCP backend.
 * This worker runs on a Cron Trigger (configured in wrangler.toml) and
 * empties the R2 bucket on a schedule, keeping Cloudflare R2 storage free.
 *
 * Deploy:
 *   cd cf-worker
 *   npx wrangler deploy
 *
 * Configure in wrangler.toml:
 *   [triggers]
 *   crons = ["0 3 * * *"]   # runs daily at 3am UTC
 *
 * Required R2 binding in wrangler.toml:
 *   [[r2_buckets]]
 *   binding = "TORRENT_BUCKET"
 *   bucket_name = "your-bucket-name"
 */

export default {
  /**
   * Scheduled handler — triggered by Cron Trigger.
   * @param {ScheduledEvent} event
   * @param {Object} env - Worker environment bindings
   */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(cleanBucket(env));
  },

  /**
   * HTTP handler — allows manually triggering the cleanup via GET /clean
   * Useful for testing before setting up the cron.
   */
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/clean') {
      const result = await cleanBucket(env);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({
      status: 'ok',
      message: 'TorrentStream R2 Cleaner Worker. POST /clean to trigger manually.',
    }), { headers: { 'Content-Type': 'application/json' } });
  },
};

/**
 * Lists and deletes all objects in the R2 bucket.
 * @param {Object} env
 * @returns {Promise<{deleted: number, errors: number}>}
 */
async function cleanBucket(env) {
  const bucket = env.TORRENT_BUCKET;
  if (!bucket) {
    console.error('[R2 Cleaner] TORRENT_BUCKET binding not configured.');
    return { deleted: 0, errors: 1 };
  }

  let deleted = 0;
  let errors = 0;
  let cursor = undefined;

  try {
    do {
      const listed = await bucket.list({ cursor, limit: 1000 });
      
      if (listed.objects.length === 0) break;

      // Delete objects in parallel batches
      const deleteResults = await Promise.allSettled(
        listed.objects.map(obj => bucket.delete(obj.key))
      );

      deleteResults.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          deleted++;
        } else {
          errors++;
          console.error(`[R2 Cleaner] Failed to delete ${listed.objects[i].key}:`, result.reason);
        }
      });

      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);

    console.log(`[R2 Cleaner] Done. Deleted: ${deleted}, Errors: ${errors}`);
    return { deleted, errors, timestamp: new Date().toISOString() };
  } catch (err) {
    console.error('[R2 Cleaner] Fatal error:', err);
    return { deleted, errors: errors + 1, error: err.message };
  }
}
