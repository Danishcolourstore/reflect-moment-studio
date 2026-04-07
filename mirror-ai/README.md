# Mirror AI

Mirror AI is a complete real-time photography assistant stack:

Camera -> FTP -> Backend queue -> AI processing -> Instant web app display

## Product features

- FTP ingestion server with instant file detection
- Original image archiving + processed preview/full outputs
- Async processing pipeline (Redis/BullMQ with memory fallback)
- AI-style analysis (exposure, warmth, skin-tone proxy, clipping)
- Preset engine (Lightroom-style behavior)
- Natural retouch intensity control
- Realtime updates over WebSocket (no refresh)
- Premium dark React + Tailwind dashboard
- Live feed, before/after view, preset control, categories, status badges
- Batch apply control to requeue selected images
- Metadata persistence on disk

## Architecture

```
mirror-ai/
  backend/
    src/
      api/                # REST endpoints + validation
      processing/         # queue job processor
      queue/              # BullMQ + fallback adapter
      realtime/           # socket event hub
      services/           # analyzer, preset engine, processing, ingestion
      storage/            # file paths + metadata store
      utils/              # fs helpers
    scripts/
      mockCameraUpload.js # local ingest simulator
    storage/              # runtime files (gitignored)
  frontend/
    src/
      components/         # premium UI modules
      api.ts              # backend API client
      realtime.ts         # socket client
      types.ts
  scripts/
    ftp-upload.mjs        # upload file to FTP for testing
  docker-compose.yml      # Redis service
```

## Requirements

- Node.js 20+
- npm 10+
- Docker (optional but recommended for Redis)

## Environment setup

### 1) Backend env

```bash
cp mirror-ai/backend/.env.example mirror-ai/backend/.env
```

### 2) Frontend env

```bash
cp mirror-ai/frontend/.env.example mirror-ai/frontend/.env
```

## Install dependencies

```bash
cd /workspace/mirror-ai/backend && npm install
cd /workspace/mirror-ai/frontend && npm install
```

## Run services

### 1) Start Redis (recommended)

```bash
cd /workspace/mirror-ai
docker compose up -d redis
```

### 2) Start backend

```bash
cd /workspace/mirror-ai/backend
npm run dev
```

Backend default endpoints:

- API: `http://localhost:4000/api`
- Files: `http://localhost:4000/files/...`
- Socket.IO: `ws://localhost:4000`
- FTP: `ftp://mirror:mirror@127.0.0.1:2121`

### 3) Start frontend

```bash
cd /workspace/mirror-ai/frontend
npm run dev
```

Frontend default URL:

- `http://localhost:5173`

## Ingestion and processing test

### Option A: Upload through FTP helper

```bash
cd /workspace
node mirror-ai/scripts/ftp-upload.mjs public/placeholder.svg test-shot.png
```

### Option B: Write directly into incoming folder

```bash
cd /workspace/mirror-ai/backend
npm run mock:upload ../../public/placeholder.svg sample.png
```

After upload:

1. Image appears in Live Feed with `Processing`
2. AI pipeline runs and outputs preview + full resolution
3. Status updates to `Done`
4. Before/After view becomes available in frontend instantly

## API overview

- `GET /api/health`
- `GET /api/images?category=all|wedding|fashion|portrait|event`
- `GET /api/images/:id`
- `GET /api/presets`
- `PATCH /api/presets/:presetId`
- `GET /api/controls`
- `PATCH /api/controls`
- `POST /api/batch/apply`

## Notes

- If Redis is unavailable, backend automatically falls back to in-memory queue mode.
- Runtime image data is stored at `mirror-ai/backend/storage` (already gitignored).
- Use real camera JPEG files for best analysis + retouch quality.
