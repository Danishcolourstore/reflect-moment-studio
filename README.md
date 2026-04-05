# Mirror AI

Mirror AI is a real-time photography assistant:

Camera -> FTP -> Server -> AI Processing -> Live app display.

This repository now includes:

- A full Mirror AI backend (`mirror-ai/server`) with FTP ingestion, queue processing,
  AI-style image enhancement, storage, metadata, and WebSocket events.
- A premium React route at `/mirror-ai` with live feed, before/after compare,
  preset/category controls, retouch intensity, and batch apply actions.

## Folder structure

```txt
mirror-ai/
  .env.example
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
    storage/
      incoming/
      originals/
      previews/
      processed/
      metadata/images.json
src/
  pages/
    MirrorAI.tsx
```

## Setup

1) Install dependencies:

```bash
npm install
```

2) Copy Mirror AI env:

```bash
cp mirror-ai/.env.example .env
```

3) Update `.env` values as needed (FTP credentials, host, Redis URL).

## Run commands

Frontend:

```bash
npm run dev
```

Mirror AI backend:

```bash
npm run mirrorai:server
```

Production frontend build:

```bash
npm run build
```

## Mirror AI endpoints

- Health: `GET /healthz`
- Presets: `GET /api/presets`
- Images: `GET /api/images`
- Image reprocess: `POST /api/controls/reprocess`
- Global controls: `POST /api/controls/global`
- Batch apply: `POST /api/controls/batch-apply`
- Realtime WebSocket: `ws://<host>:<port>/ws`

## Notes

- Queue uses Redis/BullMQ when `MIRRORAI_REDIS_URL` is set.
- If Redis is not set, it automatically falls back to an in-memory queue.
- FTP uploads should target the configured FTP host/port and upload image files
  into the FTP root (mapped to `mirror-ai/server/storage/incoming`).
