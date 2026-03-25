# Mirror AI - Real-Time Photography Assistant

Mirror AI is a complete real-time photography pipeline:

Camera -> FTP -> Server -> AI Processing -> Instant app updates

This repo now includes:

- Premium React + Tailwind frontend page at `/mirror-ai`
- Dedicated backend service in `mirror-ai-backend` with:
  - FTP ingestion server
  - Auto-detection watcher
  - Async processing queue
  - Image analysis and preset engine
  - Natural retouch intensity
  - REST API + WebSocket
  - Persistent file + metadata storage

## Folder structure

```text
.
├── mirror-ai-backend/
│   ├── src/
│   │   ├── api.ts
│   │   ├── config.ts
│   │   ├── eventBus.ts
│   │   ├── ftp.ts
│   │   ├── logger.ts
│   │   ├── metadata.ts
│   │   ├── presets.ts
│   │   ├── processor.ts
│   │   ├── queue.ts
│   │   ├── repository.ts
│   │   ├── server.ts
│   │   ├── storage.ts
│   │   ├── types.ts
│   │   └── websocket.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── src/
│   ├── App.tsx
│   └── pages/
│       └── MirrorAI.tsx
└── package.json
```

## Environment

Frontend `.env`:

```env
VITE_MIRROR_AI_API_BASE=http://localhost:8787
VITE_MIRROR_AI_WS_BASE=ws://localhost:8787/ws
```

Backend `.env`:

```bash
cp mirror-ai-backend/.env.example mirror-ai-backend/.env
```

## Setup

```bash
npm install
npm install --prefix mirror-ai-backend
```

## Run commands

Backend (FTP + API + WS + processing):

```bash
npm run mirror:backend:dev
```

Frontend:

```bash
npm run dev
```

Open:

- Frontend: `http://localhost:8080/mirror-ai`
- Health: `http://localhost:8787/health`
- WebSocket: `ws://localhost:8787/ws`
- FTP: `ftp://localhost:2121` (see backend `.env`)

## API summary

- `GET /api/bootstrap`
- `GET /api/images`
- `GET /api/images/:id`
- `PATCH /api/controls`
- `PATCH /api/images/:id`
- `POST /api/images/batch`
- `GET /api/metadata/:id`

## Storage

Under backend `STORAGE_ROOT` (default `mirror-ai-backend/storage`):

- `ftp-inbox/` incoming uploads
- `originals/` originals
- `processed/preview/` previews
- `processed/full/` full resolution
- `meta/images.json` metadata

## Product features shipped

- Real FTP ingestion + auto-detect
- Exposure / lighting / skin analysis
- Preset-based enhancement pipeline
- Optional natural retouch
- Fast preview + full-resolution output
- Async queue processing
- Live WebSocket updates (no refresh)
- Premium dark responsive UI
- Before/After toggle
- Preset/category/retouch controls
- Batch apply edits
- Status badges for processing lifecycle
