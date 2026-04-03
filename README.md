# Mirror AI

Mirror AI is a real-time photography assistant:

**Camera/Upload -> FTP/API ingest -> Queue -> AI processing -> Instant live dashboard updates**

This repository contains:

- `server/` backend (FTP ingest, API, queue worker, image processing, WebSocket)
- `src/` premium React + Tailwind frontend
- local filesystem storage for originals, processed images, and metadata

---

## Product Features

- FTP server ingest with instant queueing
- API multi-upload ingest endpoint
- AI processing pipeline:
  - exposure / lighting / skin-tone analysis
  - preset-based enhancement (Lightroom-style behavior)
  - natural retouch (texture-preserving, no plastic skin)
  - preview + full-resolution output
- Real-time WebSocket push (no page refresh)
- Premium live UI:
  - live feed
  - before/after toggle
  - preset selector
  - shoot categories
  - status badges
  - control panel + batch apply
- Queue system:
  - Redis-backed BullMQ when `REDIS_URL` is set
  - in-memory queue fallback when Redis is unavailable

---

## Folder Structure

```text
.
├── server
│   └── src
│       ├── api
│       │   └── routes.ts
│       ├── config
│       │   └── env.ts
│       ├── ingest
│       │   └── ftpIngest.ts
│       ├── processing
│       │   └── imagePipeline.ts
│       ├── queue
│       │   ├── processorWorker.ts
│       │   ├── queueClient.ts
│       │   └── queueNames.ts
│       ├── realtime
│       │   └── realtimeHub.ts
│       ├── services
│       │   └── settingsService.ts
│       ├── storage
│       │   ├── fileStore.ts
│       │   └── imageRepository.ts
│       ├── types.ts
│       ├── utils
│       │   └── logger.ts
│       └── index.ts
├── src
│   ├── components/mirror
│   ├── hooks/useMirrorRealtime.ts
│   ├── lib/mirror-api.ts
│   ├── pages/MirrorApp.tsx
│   └── types/mirror.ts
└── storage
    ├── incoming
    ├── metadata
    ├── originals
    └── processed
        ├── full
        └── preview
```

---

## Environment

Copy and edit:

```bash
cp .env.example .env
```

`.env.example`:

```bash
NODE_ENV=development
PORT=8787
BASE_URL=http://localhost:8787
CORS_ORIGIN=*

# Optional: enables Redis/BullMQ
REDIS_URL=redis://127.0.0.1:6379

FTP_HOST=0.0.0.0
FTP_PORT=2121
FTP_USER=mirrorai
FTP_PASSWORD=mirrorai123

STORAGE_ROOT=./storage
PREVIEW_WIDTH=1600
RETOUCH_DEFAULT_INTENSITY=0.18

VITE_API_BASE_URL=http://localhost:8787
```

---

## Setup

```bash
npm install
```

---

## Run Commands

### 1) Full local development (frontend + backend)

```bash
npm run dev
```

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:8787/api`
- WebSocket: `ws://localhost:8787/ws`
- FTP ingest: `ftp://localhost:2121`

### 2) Backend only

```bash
npm run start:server
```

### 3) Production build (frontend)

```bash
npm run build
```

### 4) Preview frontend build

```bash
npm run preview
```

---

## Core API

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/images`
- `GET /api/images/:id`
- `GET /api/presets`
- `PATCH /api/control`
- `POST /api/images/upload` (`multipart/form-data`, field: `images`)
- `POST /api/batch/apply`
- `GET /api/metadata`

Static files:

- `GET /storage/...` for originals/processed images

Realtime:

- `ws://<host>/ws`

Event types:

- `system:connected`
- `image:created`
- `image:updated`
- `control:updated`
- `queue:stats`
- `batch:started`
