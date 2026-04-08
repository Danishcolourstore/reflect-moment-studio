# Mirror AI

Mirror AI is a real-time photography assistant:

Camera -> FTP -> Server -> AI Processing -> Instant display in app

This repository now contains a complete Mirror AI product build with:

- FTP ingestion service
- Async image processing pipeline
- WebSocket realtime updates
- Premium React + Tailwind frontend
- Control system (preset, retouch, batch apply)
- Storage for originals/processed/metadata

## Architecture

- Frontend: `src/` (Vite + React + Tailwind)
- Backend API/worker/FTP: `apps/backend/`
- Storage output: `apps/backend/storage/`

### Backend subsystems

- FTP server (`ftp-srv`) receives images into `storage/inbox`
- File watcher (`chokidar`) detects new uploads instantly
- Queue (`p-queue`) processes images async with configurable concurrency
- AI pipeline (`sharp`) computes:
  - exposure analysis
  - skin-tone score
  - lighting contrast
- Preset engine applies Lightroom-style behavior
- Natural retouch via controlled blur/sharpen blend
- API exposes images/presets/stats/controls endpoints
- WebSocket pushes image/control updates in real-time

## Folder structure (new key parts)

```txt
apps/
  backend/
    src/
      config/env.ts
      ftp/ftp-server.ts
      ingest/inbox-watcher.ts
      http/routes.ts
      lib/
        analyze.ts
        event-bus.ts
        image-processor.ts
        presets.ts
        public-url.ts
        queue.ts
        repository.ts
        storage.ts
      server.ts
src/
  hooks/use-mirror-realtime.ts
  lib/mirror-api.ts
  pages/MirrorAIPage.tsx
  types/mirror-ai.ts
.env.example
```

## Setup

1) Install root dependencies

```sh
npm i
```

2) Install backend dependencies

```sh
npm --prefix apps/backend i
```

3) Copy env file

```sh
cp .env.example .env
```

## Run commands

Frontend (premium UI):

```sh
npm run dev:frontend
```

Backend (API + WebSocket + FTP + queue):

```sh
npm run dev:backend
```

Backend checks/build:

```sh
npm run check:backend
npm run build:backend
```

Frontend build:

```sh
npm run build
```

## API summary

- `GET /api/health`
- `GET /api/images?limit=100`
- `GET /api/images/:id`
- `PATCH /api/images/:id/control`
- `POST /api/batch/apply`
- `GET /api/presets`
- `GET /api/controls`
- `PATCH /api/controls`
- `GET /api/stats`

WebSocket:

- `ws://<host>:<port>/ws`
- Events: `ready`, `image.received`, `image.updated`, `control.updated`

## FTP ingest

Configure in `.env`:

- `FTP_ENABLED=true`
- `FTP_HOST=0.0.0.0`
- `FTP_PORT=2121`
- `FTP_USER=mirror`
- `FTP_PASSWORD=mirror-pass`

Send images to the FTP root and Mirror AI will ingest/process automatically.
