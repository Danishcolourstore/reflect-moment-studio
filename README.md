# Mirror AI

Mirror AI is a real-time photography assistant:

**Camera / FTP upload -> Backend ingest -> AI processing -> Instant app updates**

This repository now contains a full working implementation with:

- FTP ingestion server (auto-detect incoming images)
- Async processing pipeline (queue + worker)
- Image analysis (exposure, skin-tone warmth, lighting)
- Preset-driven rendering and natural retouch
- Fast preview + full-resolution output generation
- WebSocket real-time updates (Socket.IO)
- React + Tailwind premium live dashboard
- Metadata + asset storage on local filesystem

## Folder structure

```text
.
├── mirror-ai
│   ├── server
│   │   ├── src
│   │   │   ├── config.ts
│   │   │   ├── events.ts
│   │   │   ├── ftp.ts
│   │   │   ├── http.ts
│   │   │   ├── index.ts
│   │   │   ├── pipeline.ts
│   │   │   ├── presets.ts
│   │   │   ├── queue.ts
│   │   │   ├── storage.ts
│   │   │   ├── types.ts
│   │   │   ├── websocket.ts
│   │   │   └── processing
│   │   │      ├── analyzer.ts
│   │   │      └── processor.ts
│   │   └── tsconfig.json
│   └── storage
│       ├── incoming
│       ├── originals
│       ├── previews
│       ├── processed
│       └── metadata.json
└── src
    └── mirror-ai
       ├── api.ts
       ├── socket.ts
       ├── types.ts
       ├── utils.ts
       ├── MirrorAiApp.tsx
       └── components
          ├── BeforeAfter.tsx
          ├── ImageTile.tsx
          ├── SectionCard.tsx
          └── StatusBadge.tsx
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment config:

```bash
cp .env.example .env
```

3. (Optional) Start Redis for persistent queue mode:

```bash
docker run --name mirror-redis -p 6379:6379 -d redis:7
```

If Redis is not available, Mirror AI automatically runs with an in-memory queue fallback.

## Run commands

### Start frontend + backend together

```bash
npm run dev:mirror
```

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:8787`
- FTP server: `ftp://localhost:2121`

### Start only backend

```bash
npm run mirror:server
```

### Build frontend

```bash
npm run build
```

### Type-check backend build config

```bash
npm run build:mirror:server
```

## FTP ingestion flow

1. Connect camera tether app or FTP client to:
   - Host: `MIRROR_FTP_HOST`
   - Port: `MIRROR_FTP_PORT`
   - User: `MIRROR_FTP_USER`
   - Pass: `MIRROR_FTP_PASS`
2. Upload images into FTP root (mapped to `mirror-ai/storage/incoming`)
3. Backend watcher auto-detects image files
4. Original is moved to `mirror-ai/storage/originals`
5. Queue triggers processing instantly
6. Preview + full-resolution outputs are generated
7. Frontend receives real-time status via WebSocket

## API overview

- `GET /health`
- `GET /api/presets`
- `GET /api/images`
- `GET /api/settings`
- `PATCH /api/settings`
- `PATCH /api/images/:id` (supports `reprocess`)
- `POST /api/images/:id/reprocess`
- `POST /api/images/batch-apply`
- `POST /api/simulate-upload` (local ingestion test helper)

Assets:

- `/assets/originals/:filename`
- `/assets/previews/:filename`
- `/assets/processed/:filename`

## Control system features included

- Live preset changes per image
- Retouch intensity adjustments
- Category assignment
- Batch apply edits + reprocess trigger
- Reprocess all or selected images

## Notes

- The UI is fully responsive for desktop and mobile.
- The processing pipeline includes robust error handling and status transitions:
  - `queued -> processing -> done` or `failed`
