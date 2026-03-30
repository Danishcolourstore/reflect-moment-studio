# Mirror AI Backend

Realtime image-ingestion and processing backend for Mirror AI.

## Features

- FTP ingestion server (camera uploads)
- Automatic image detection and queueing
- Async processing worker (BullMQ + Redis)
- Image analysis (exposure, skin tones, lighting, warmth)
- Lightroom-style preset logic + natural retouch
- Preview and full-resolution output generation
- WebSocket push events for instant frontend updates
- REST API for images, presets, control state, and batch edits

## Folder structure

```txt
services/mirror-ai
├── src
│   ├── ftp/server.ts
│   ├── ingest/register-image.ts
│   ├── pipeline/
│   │   ├── analyzer.ts
│   │   └── processor.ts
│   ├── http.ts
│   ├── index.ts
│   ├── worker.ts
│   ├── db.ts
│   ├── queue.ts
│   ├── queueing.ts
│   ├── presets.ts
│   ├── realtime.ts
│   └── types/
│       ├── models.ts
│       └── ftp-srv.d.ts
├── storage/
│   ├── ftp-home/
│   ├── originals/
│   ├── preview/
│   └── processed/
└── .env.example
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Start Redis (required by BullMQ):

```bash
docker run --name mirror-redis -p 6379:6379 -d redis:latest
```

4. Start API + FTP server:

```bash
npm run dev:api
```

5. Start processing worker:

```bash
npm run dev:worker
```

## FTP upload target

- Host: `localhost`
- Port: `2121`
- User: `mirror`
- Password: `mirror`

Upload images to FTP root (`/`). They are detected and processed automatically.

## API endpoints

- `GET /health`
- `GET /api/presets`
- `GET /api/control`
- `PATCH /api/control`
- `GET /api/images?limit=200`
- `GET /api/images/:id`
- `POST /api/images/upload` (multipart field: `image`)
- `POST /api/images/batch`
- `POST /api/images/:id/reprocess`

## Realtime

- WebSocket endpoint: `ws://localhost:8787/ws`
- Events:
  - `image.updated`
  - `control.updated`

