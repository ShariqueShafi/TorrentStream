import express from 'express';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { execSync } from 'child_process';
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
    gcp: {
      vmHours: null,
      disk: null,
      egress: null,
    },
    cloudflare: {
      r2Storage: null,
      r2ClassA: null,
      r2ClassB: null,
      pagesBuilds: null,
      workersRequests: null,
    },
    timestamp: new Date().toISOString(),
  };

  // ──── GOOGLE CLOUD ────

  // 1. GCP VM Uptime (free: 744 hours/month for e2-micro)
  try {
    const serverStartTime  = global.serverStartTime || Date.now();
    global.serverStartTime = serverStartTime;

    const uptimeMs    = Date.now() - serverStartTime;
    const uptimeHours = parseFloat((uptimeMs / 3600000).toFixed(2));

    // Accumulate across restarts
    const uptimePath = '/tmp/gcp_uptime.json';
    let uptimeData = { hours: 0, resetMonth: new Date().getMonth() };
    if (fs.existsSync(uptimePath)) {
      uptimeData = JSON.parse(fs.readFileSync(uptimePath, 'utf8'));
      if (uptimeData.resetMonth !== new Date().getMonth()) {
        uptimeData = { hours: 0, resetMonth: new Date().getMonth() };
      }
    }

    const totalHours = parseFloat((uptimeData.hours + uptimeHours).toFixed(2));
    const limitHours = 744; // ~31 days
    const percent    = parseFloat(((totalHours / limitHours) * 100).toFixed(1));
    const status     = percent >= 100 ? 'exceeded'
                     : percent >= 90  ? 'critical'
                     : percent >= 80  ? 'warning'
                     : 'safe';

    usage.gcp.vmHours = { used: totalHours, limit: limitHours, percent, status, unit: 'hrs' };
  } catch (err) {
    usage.gcp.vmHours = { error: err.message };
  }

  // 2. GCP Disk Usage (free: 30 GB standard persistent disk)
  try {
    let dfCmd = "df -BG / | tail -1 | awk '{print $3, $2}'";
    if (process.platform === 'darwin') {
      dfCmd = "df -g / | tail -1 | awk '{print $3, $2}'";
    }
    const dfOut = execSync(dfCmd, { encoding: 'utf8' }).trim();
    const [usedStr, totalStr] = dfOut.split(' ');
    const usedGB  = parseInt(usedStr);
    const totalGB = parseInt(totalStr);
    
    if (isNaN(usedGB) || isNaN(totalGB)) {
      throw new Error(`Failed to parse disk usage values from output: "${dfOut}"`);
    }

    const limitGB = 30; // free tier
    const percent = parseFloat(((usedGB / limitGB) * 100).toFixed(1));
    const status  = percent >= 100 ? 'exceeded'
                  : percent >= 90  ? 'critical'
                  : percent >= 80  ? 'warning'
                  : 'safe';

    usage.gcp.disk = { used: usedGB, limit: limitGB, percent, status, unit: 'GB' };
  } catch (err) {
    usage.gcp.disk = { error: err.message };
  }

  // 3. GCP Egress (free: 1 GB/month — tracked via counter)
  try {
    const egressPath = '/tmp/gcp_egress.json';
    let egressData = { bytes: 0, resetMonth: new Date().getMonth() };
    if (fs.existsSync(egressPath)) {
      egressData = JSON.parse(fs.readFileSync(egressPath, 'utf8'));
      if (egressData.resetMonth !== new Date().getMonth()) {
        egressData = { bytes: 0, resetMonth: new Date().getMonth() };
        fs.writeFileSync(egressPath, JSON.stringify(egressData));
      }
    }
    const usedGB  = parseFloat((egressData.bytes / 1e9).toFixed(3));
    const limitGB = 1;
    const percent = parseFloat(((usedGB / limitGB) * 100).toFixed(1));
    const status  = percent >= 100 ? 'exceeded'
                  : percent >= 90  ? 'critical'
                  : percent >= 80  ? 'warning'
                  : 'safe';

    usage.gcp.egress = { used: usedGB, limit: limitGB, percent, status, unit: 'GB' };
  } catch (err) {
    usage.gcp.egress = { error: err.message };
  }

  // ──── CLOUDFLARE ────

  // 4. R2 Storage (free: 10 GB)
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

    const usedGB  = parseFloat((totalBytes / 1e9).toFixed(3));
    const limitGB = 10;
    const percent = parseFloat(((usedGB / limitGB) * 100).toFixed(1));
    const status  = percent >= 100 ? 'exceeded'
                  : percent >= 90  ? 'critical'
                  : percent >= 80  ? 'warning'
                  : 'safe';

    usage.cloudflare.r2Storage = { used: usedGB, limit: limitGB, percent, status, unit: 'GB' };
  } catch (err) {
    usage.cloudflare.r2Storage = { used: 0, limit: 10, percent: 0, status: 'safe', unit: 'GB' };
  }

  // 5. R2 Class A Ops (free: 1M/month — PUT, LIST)
  try {
    const opsPath = '/tmp/r2_class_a.json';
    let opsData = { count: 0, resetMonth: new Date().getMonth() };
    if (fs.existsSync(opsPath)) {
      opsData = JSON.parse(fs.readFileSync(opsPath, 'utf8'));
      if (opsData.resetMonth !== new Date().getMonth()) {
        opsData = { count: 0, resetMonth: new Date().getMonth() };
        fs.writeFileSync(opsPath, JSON.stringify(opsData));
      }
    }
    const limit   = 1000000;
    const percent = parseFloat(((opsData.count / limit) * 100).toFixed(1));
    const status  = percent >= 100 ? 'exceeded'
                  : percent >= 90  ? 'critical'
                  : percent >= 80  ? 'warning'
                  : 'safe';

    usage.cloudflare.r2ClassA = { used: opsData.count, limit, percent, status, unit: 'ops' };
  } catch (err) {
    usage.cloudflare.r2ClassA = { used: 0, limit: 1000000, percent: 0, status: 'safe', unit: 'ops' };
  }

  // 6. R2 Class B Ops (free: 10M/month — GET)
  try {
    const opsPath = '/tmp/r2_class_b.json';
    let opsData = { count: 0, resetMonth: new Date().getMonth() };
    if (fs.existsSync(opsPath)) {
      opsData = JSON.parse(fs.readFileSync(opsPath, 'utf8'));
      if (opsData.resetMonth !== new Date().getMonth()) {
        opsData = { count: 0, resetMonth: new Date().getMonth() };
        fs.writeFileSync(opsPath, JSON.stringify(opsData));
      }
    }
    const limit   = 10000000;
    const percent = parseFloat(((opsData.count / limit) * 100).toFixed(1));
    const status  = percent >= 100 ? 'exceeded'
                  : percent >= 90  ? 'critical'
                  : percent >= 80  ? 'warning'
                  : 'safe';

    usage.cloudflare.r2ClassB = { used: opsData.count, limit, percent, status, unit: 'ops' };
  } catch (err) {
    usage.cloudflare.r2ClassB = { used: 0, limit: 10000000, percent: 0, status: 'safe', unit: 'ops' };
  }

  // 7. Pages Builds (free: 500/month)
  try {
    const buildsPath = '/tmp/cf_pages_builds.json';
    let buildsData = { count: 0, resetMonth: new Date().getMonth() };
    if (fs.existsSync(buildsPath)) {
      buildsData = JSON.parse(fs.readFileSync(buildsPath, 'utf8'));
      if (buildsData.resetMonth !== new Date().getMonth()) {
        buildsData = { count: 0, resetMonth: new Date().getMonth() };
        fs.writeFileSync(buildsPath, JSON.stringify(buildsData));
      }
    }
    const limit   = 500;
    const percent = parseFloat(((buildsData.count / limit) * 100).toFixed(1));
    const status  = percent >= 100 ? 'exceeded'
                  : percent >= 90  ? 'critical'
                  : percent >= 80  ? 'warning'
                  : 'safe';

    usage.cloudflare.pagesBuilds = { used: buildsData.count, limit, percent, status, unit: 'builds' };
  } catch (err) {
    usage.cloudflare.pagesBuilds = { used: 0, limit: 500, percent: 0, status: 'safe', unit: 'builds' };
  }

  // 8. Workers Requests (free: 100K/day)
  try {
    const wrPath = '/tmp/cf_workers_reqs.json';
    let wrData = { count: 0, resetDay: new Date().getDate() };
    if (fs.existsSync(wrPath)) {
      wrData = JSON.parse(fs.readFileSync(wrPath, 'utf8'));
      if (wrData.resetDay !== new Date().getDate()) {
        wrData = { count: 0, resetDay: new Date().getDate() };
        fs.writeFileSync(wrPath, JSON.stringify(wrData));
      }
    }
    const limit   = 100000;
    const percent = parseFloat(((wrData.count / limit) * 100).toFixed(1));
    const status  = percent >= 100 ? 'exceeded'
                  : percent >= 90  ? 'critical'
                  : percent >= 80  ? 'warning'
                  : 'safe';

    usage.cloudflare.workersRequests = { used: wrData.count, limit, percent, status, unit: 'reqs/day' };
  } catch (err) {
    usage.cloudflare.workersRequests = { used: 0, limit: 100000, percent: 0, status: 'safe', unit: 'reqs/day' };
  }

  res.json(usage);
});

export default router;
