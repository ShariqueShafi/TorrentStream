# TorrentStream

A self-hosted live torrent streaming platform. Paste a magnet link, browse files, and stream video directly in your browser — no permanent storage required.

## Architecture

```
Frontend (React + Vite)  →  Cloudflare Pages  →  shamstailors.com
Backend  (Node.js + Express + WebTorrent + FFmpeg)  →  GCP VM  →  api.shamstailors.com
```

## Features

- **Live Streaming** — Stream video from torrents before the full file downloads
- **HLS Transcoding** — FFmpeg pipes torrent data into browser-compatible HLS
- **Temporary Storage** — No permanent media files; auto-cleaned after 30 minutes
- **Direct Download** — Save any file to your local device
- **Dark Cinematic UI** — Premium design with amber accents and film-grain texture

## Local Development

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Requirements

- Node.js ≥ 18
- FFmpeg installed (`brew install ffmpeg` on macOS)

## Deployment

- Frontend: Cloudflare Pages (auto-deploys from this repo)
- Backend: Google Cloud e2-micro VM
- Domain: shamstailors.com (Cloudflare DNS)
