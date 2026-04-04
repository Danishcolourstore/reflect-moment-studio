# Mirror AI

Mirror AI is a full real-time photography assistant:

**Camera -> FTP -> Server -> AI Processing -> Instant app display**

## Features

- FTP ingestion server for incoming images
- Instant image discovery + queueing
- Async processing pipeline with:
  - exposure, skin tone, and lighting analysis
  - Lightroom-style preset logic
  - optional natural retouching (non-plastic skin)
- Fast preview + full-resolution export generation
- WebSocket realtime updates (no refresh flow required)
- Premium React + Tailwind UI (dark luxury style)
- Control system:
  - change defaults live
  - retouch intensity controls
  - batch apply edits to selected/all latest images
- Storage for originals, processed variants, and metadata

---

## Folder structure

```txt
.
├── mirror-ai/
│   └── server/
│       ├── src/
│       │   ├── api/               # Express API + static media serving
│       │   ├── config/            # Env schema and runtime directories
│       │   ├── ingest/            # FTP server + incoming watcher
│       │   ├── lib/               # Logger, paths, state store
│       │   ├── processing/        # Analysis + image transformation engine
│       │   ├── queue/             # BullMQ + Redis queue
│       │   ├── realtime/          # WS hub + event emitter
│       │   ├── services/          # Domain service orchestration
│       │   ├── index.ts           # API + FTP + watcher + optional embedded worker
│       │   └── worker.ts          # Dedicated async worker process
│       ├── storage/
│       │   ├── incoming/
│       │   ├── originals/
│       │   ├── processed/previews/
│       │   ├── processed/full/
│       │   ├── thumbnails/
│       │   └── failed/
│       ├── data/metadata.json
│       ├── .env.example
│       └── package.json
├── src/
│   ├── pages/MirrorAI.tsx         # Premium realtime Mirror AI app page
│   ├── components/mirror-ai/      # UI controls/feed components
│   └── lib/mirror-ai/             # Frontend API/realtime logic/types
├── docker-compose.mirror-ai.yml   # Redis stack for queue
└── .env.example                   # Frontend env
```

---

## Environment

### 1) Frontend env (`.env`)

Copy `.env.example` at repo root and fill your existing frontend vars:

```bash
cp .env.example .env
```

Mirror AI frontend keys:

```env
VITE_MIRROR_AI_API_BASE=http://localhost:8787
VITE_MIRROR_AI_WS_URL=ws://localhost:8787/ws
```

### 2) Mirror AI server env (`mirror-ai/server/.env`)

```bash
cp mirror-ai/server/.env.example mirror-ai/server/.env
```

Important keys:

```env
MIRROR_AI_API_PORT=8787
MIRROR_AI_FTP_PORT=2121
MIRROR_AI_FTP_USER=mirror
MIRROR_AI_FTP_PASSWORD=mirrorpass
MIRROR_AI_REDIS_URL=redis://127.0.0.1:6379
MIRROR_AI_RUN_EMBEDDED_WORKER=true
```

---

## Install

```bash
# root dependencies (frontend)
npm install

# mirror ai server dependencies
npm --prefix ./mirror-ai/server install
```

---

## Run (development)

### Terminal 1: Redis

```bash
npm run mirror:redis
```

### Terminal 2: Mirror AI server (+ embedded worker)

```bash
npm run mirror:server:dev
```

If you prefer dedicated worker process:

```env
# mirror-ai/server/.env
MIRROR_AI_RUN_EMBEDDED_WORKER=false
```

Then run:

```bash
npm run mirror:server:dev
npm run mirror:worker:dev
```

### Terminal 3: Frontend

```bash
npm run dev
```

Open:

- Main app: `http://localhost:8080`
- Mirror AI page: `http://localhost:8080/mirror-ai`

---

## FTP ingest usage

Connect your camera relay or FTP client to:

- Host: your server host
- Port: `MIRROR_AI_FTP_PORT` (default `2121`)
- Username: `MIRROR_AI_FTP_USER`
- Password: `MIRROR_AI_FTP_PASSWORD`

Uploaded images are auto-detected in `mirror-ai/server/storage/incoming`, moved to originals, queued, processed, and streamed to the frontend in realtime.

---

## API overview

- `GET /health`
- `GET /api/mirror-ai/snapshot`
- `PATCH /api/mirror-ai/controls`
- `POST /api/mirror-ai/batch-apply`
- `GET /media/*` for original/processed assets
- WebSocket endpoint: `/ws`

---

## Production notes

- Put API/FTP behind TLS and firewall rules
- Move metadata store from JSON file to a DB for multi-node scaling
- Use managed Redis for queue durability
- Add auth/tenant separation if exposing beyond private studio network
