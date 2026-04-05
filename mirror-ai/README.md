# Mirror AI

Mirror AI is a full real-time photography assistant:

Camera/FTP -> ingest -> async processing -> WebSocket push -> premium UI.

## Architecture

- `mirror-ai/server`
  - FTP server (`ftp-srv`)
  - ingest watcher (`chokidar`)
  - async processing queue (`bullmq` + Redis, with in-memory fallback)
  - image analysis + presets + natural retouch (`sharp`)
  - REST API + asset serving (`express`)
  - realtime events (`ws`)
- `src/pages/MirrorAI.tsx`
  - Live feed
  - Before/after toggle
  - Preset + shoot category controls
  - Retouch intensity
  - Batch apply with image selection
  - Real-time status badges

## Folder structure

```txt
mirror-ai/
  README.md
  server/
    src/
      api.js
      analysis.js
      config.js
      ftp.js
      image-processor.js
      ingestion.js
      logger.js
      metadata-store.js
      presets.js
      queue.js
      server.js
      storage.js
      utils.js
      websocket-hub.js
    storage/   # generated at runtime
```

## Environment

Create `.env` (or use existing one) with:

```env
MIRRORAI_HOST=0.0.0.0
MIRRORAI_PORT=8787
MIRRORAI_LOG_LEVEL=info

MIRRORAI_QUEUE_NAME=mirror-ai-processing
MIRRORAI_REDIS_URL=redis://127.0.0.1:6379

MIRRORAI_FTP_HOST=0.0.0.0
MIRRORAI_FTP_PORT=2121
MIRRORAI_FTP_USERNAME=mirrorai
MIRRORAI_FTP_PASSWORD=mirrorai-pass
MIRRORAI_FTP_PASSIVE_MIN=40000
MIRRORAI_FTP_PASSIVE_MAX=40100
MIRRORAI_FTP_PUBLIC_IP=127.0.0.1

MIRRORAI_CORS_ORIGIN=*
MIRRORAI_STORAGE_ROOT=/workspace/mirror-ai/storage

MIRRORAI_PREVIEW_MAX_WIDTH=1600
MIRRORAI_PREVIEW_QUALITY=78
MIRRORAI_OUTPUT_QUALITY=92
MIRRORAI_WORKER_CONCURRENCY=2
MIRRORAI_DEFAULT_PRESET=editorial-balanced
MIRRORAI_DEFAULT_CATEGORY=portrait
MIRRORAI_DEFAULT_RETOUCH=0.45

VITE_MIRRORAI_API_BASE=http://localhost:8787
VITE_MIRRORAI_WS_BASE=ws://localhost:8787/ws
```

If Redis is omitted, the server runs using the built-in memory queue.

## Run commands

Install dependencies:

```bash
npm install
```

Start backend:

```bash
npm run mirrorai:server
```

Start frontend:

```bash
npm run dev
```

Open:

- App: `http://localhost:8080/mirror-ai`
- API health: `http://localhost:8787/healthz`

## FTP ingest usage

Upload `.jpg/.jpeg/.png/.webp/.tif/.tiff` files to the FTP server root:

- Host: `localhost`
- Port: `2121`
- User: `mirrorai`
- Password: `mirrorai-pass`

Incoming files are copied to originals, queued instantly, processed asynchronously, and pushed live to the frontend.

