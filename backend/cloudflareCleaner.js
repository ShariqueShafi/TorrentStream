import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
dotenv.config();

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function emptyR2Bucket() {
  const bucketName = process.env.R2_BUCKET_NAME;
  if (!bucketName) return;

  try {
    console.log(`[R2 Cleaner] Checking Cloudflare R2 bucket: ${bucketName}...`);
    let token = undefined;
    let deletedCount = 0;

    do {
      const listResp = await r2Client.send(new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: token,
      }));

      if (listResp.Contents && listResp.Contents.length > 0) {
        const deleteParams = {
          Bucket: bucketName,
          Delete: {
            Objects: listResp.Contents.map(obj => ({ Key: obj.Key })),
            Quiet: true
          }
        };

        await r2Client.send(new DeleteObjectsCommand(deleteParams));
        deletedCount += listResp.Contents.length;
      }

      token = listResp.NextContinuationToken;
    } while (token);

    if (deletedCount > 0) {
      console.log(`[R2 Cleaner] Successfully deleted ${deletedCount} unused items from Cloudflare R2.`);
    } else {
      console.log(`[R2 Cleaner] Cloudflare R2 is already empty (0 GB used).`);
    }

  } catch (err) {
    console.error(`[R2 Cleaner] Failed to empty R2 bucket:`, err.message);
  }
}

// Run immediately once
emptyR2Bucket();

// Then run automatically every 24 hours just to be safe
setInterval(() => {
  emptyR2Bucket();
}, 24 * 60 * 60 * 1000);
