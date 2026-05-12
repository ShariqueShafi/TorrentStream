import express from 'express';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Initialize S3 client for Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

router.get('/', async (req, res) => {
  const usage = {
    cloudflare: { storage: null, requests: null },
    render:     { hours: null }, // Mapped to GCP VM Uptime instead
    timestamp:  new Date().toISOString(),
  };

  // 1. Cloudflare R2 Storage
  try {
    let totalBytes = 0;
    let token = undefined;
    do {
      const resp = await r2Client.send(new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME,
        ContinuationToken: token,
      }));
      resp.Contents?.forEach(obj => { totalBytes += obj.Size || 0; });
      token = resp.NextContinuationToken;
    } while (token);

    const usedGB   = parseFloat((totalBytes / 1e9).toFixed(3));
    const limitGB  = 10;
    const percent  = parseFloat(((usedGB / limitGB) * 100).toFixed(1));
    const status   = percent >= 100 ? 'exceeded'
                   : percent >= 90  ? 'critical'
                   : percent >= 80  ? 'warning'
                   : 'safe';

    usage.cloudflare.storage = { usedGB, limitGB, freeGB: parseFloat((limitGB - usedGB).toFixed(3)), percent, status };
  } catch (err) {
    usage.cloudflare.storage = { error: err.message };
  }

  // 2. Cloudflare R2 Requests (Mocked counter)
  try {
    const counterPath = '/tmp/r2_request_counter.json';
    let counter = { count: 0, resetMonth: new Date().getMonth() };
    if (fs.existsSync(counterPath)) {
      counter = JSON.parse(fs.readFileSync(counterPath, 'utf8'));
      if (counter.resetMonth !== new Date().getMonth()) {
        counter = { count: 0, resetMonth: new Date().getMonth() };
        fs.writeFileSync(counterPath, JSON.stringify(counter));
      }
    }

    const limitReqs = 10000000; // 10M free tier
    const percent   = parseFloat(((counter.count / limitReqs) * 100).toFixed(1));
    const status    = percent >= 100 ? 'exceeded'
                    : percent >= 90  ? 'critical'
                    : percent >= 80  ? 'warning'
                    : 'safe';

    usage.cloudflare.requests = {
      used: counter.count,
      limit: limitReqs,
      remaining: limitReqs - counter.count,
      percent,
      status,
    };
  } catch (err) {
    usage.cloudflare.requests = { error: err.message };
  }

  // 3. GCP Uptime Tracking
  try {
    const serverStartTime  = global.serverStartTime || Date.now();
    global.serverStartTime = serverStartTime;

    const uptimeMs    = Date.now() - serverStartTime;
    const uptimeHours = parseFloat((uptimeMs / 3600000).toFixed(2));

    const renderPath = '/tmp/render_hours.json';
    let renderData = { hours: 0, resetMonth: new Date().getMonth() };
    if (fs.existsSync(renderPath)) {
      renderData = JSON.parse(fs.readFileSync(renderPath, 'utf8'));
      if (renderData.resetMonth !== new Date().getMonth()) {
        renderData = { hours: 0, resetMonth: new Date().getMonth() };
      }
    }

    const totalHours = parseFloat((renderData.hours + uptimeHours).toFixed(2));
    const limitHours = 750;
    const percent    = parseFloat(((totalHours / limitHours) * 100).toFixed(1));
    const status     = percent >= 100 ? 'exceeded'
                     : percent >= 90  ? 'critical'
                     : percent >= 80  ? 'warning'
                     : 'safe';

    usage.render.hours = {
      used: totalHours,
      limit: limitHours,
      remaining: parseFloat((limitHours - totalHours).toFixed(2)),
      percent,
      status,
    };
  } catch (err) {
    usage.render.hours = { error: err.message };
  }

  res.json(usage);
});

export default router;
