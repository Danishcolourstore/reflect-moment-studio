# Mirror AI

Mirror AI is a complete real-time photography assistant product:

Camera upload (FTP) -> server ingestion -> async AI processing -> instant live frontend updates.

## Product features

- **FTP ingestion server** with auto-detection of incoming images
- **Original + processed storage pipeline**
- **Async processing queue** (BullMQ + Redis)
- **AI-style image engine**:
  - Exposure analysis
  - Skin tone balance estimate
  - Lighting score
  - Preset-driven adjustments (Lightroom-style behavior)
  - Natural retouch intensity control
- **Real-time updates via WebSocket**
- **Premium React + Tailwind UI** (dark, minimal, responsive)
- **Live control system**:
  - Preset switching
  - Retouch intensity slider
  - Shoot category selection
  - Batch apply on selected images
- **Metadata API**
- **Before/After viewing**

## Architecture

```
mirror-ai/
  apps/
    web/                   # React + Vite + Tailwind frontend
  services/
    api/                   # Express API + FTP + WebSocket + queue producer
    worker/                # BullMQ worker + image processing engine (Sharp)
    shared/                # Shared contracts, storage paths, metadata store, presets
  storage/
    incoming/              # FTP upload drop zone
    originals/             # Original files
    processed/full/        # Full-resolution outputs
    processed/preview/     # Preview outputs
    metadata/              # Per-image metadata JSON
    control/               # Live control settings
```

## API overview

- `GET /health`
- `GET /api/presets`
- `GET /api/control`
- `PATCH /api/control`
- `GET /api/images`
- `GET /api/images/:id`
- `POST /api/images/:id/reprocess`
- `POST /api/batch/apply`

Static image routes:

- `/images/originals/:filename`
- `/images/processed/full/:filename`
- `/images/processed/preview/:filename`

Realtime socket events:

- `images:snapshot`
- `image:ingested`
- `image:updated`
- `control:updated`
- `image:failed`

## Setup

### 1) Requirements

- Node.js 22+
- npm 10+
- Redis 7+ or 8+ (local or remote)

### 2) Install

```bash
cd mirror-ai
npm install
```

### 3) Environment

Create `.env` in `mirror-ai/`:

```bash
cp .env.example .env
```

Example:

```env
NODE_ENV=development

# API
MIRROR_API_PORT=4100
MIRROR_API_HOST=0.0.0.0
MIRROR_API_ORIGIN=http://localhost:5178
MIRROR_PUBLIC_BASE_URL=http://localhost:4100

# FTP ingestion
MIRROR_FTP_PORT=2121
MIRROR_FTP_HOST=0.0.0.0
MIRROR_FTP_USER=mirror
MIRROR_FTP_PASSWORD=mirrorpass

# Queue / Redis
MIRROR_REDIS_HOST=127.0.0.1
MIRROR_REDIS_PORT=6379
MIRROR_REDIS_PASSWORD=

# Processing defaults
MIRROR_DEFAULT_PRESET=clean-natural
MIRROR_DEFAULT_RETOUCH_INTENSITY=0.3
```

### 4) Start Redis

Use local Redis service (example):

```bash
redis-server
```

Or point to an external Redis instance via `.env`.

## Run commands

From `mirror-ai/`:

### Start everything in dev

```bash
npm run dev
```

Runs:
- API on `http://localhost:4100`
- FTP server on `ftp://localhost:2121`
- Worker processor
- Web app on `http://localhost:5178`

### Individual services

```bash
npm run dev:api
npm run dev:worker
npm run dev:web
```

### Production build

```bash
npm run build
```

### Start production mode

```bash
npm run start
```

## FTP ingestion flow

1. Camera/device uploads photo to FTP (`mirror-ai/storage/incoming`)
2. Ingestion watcher detects file
3. File moves to `storage/originals`
4. Metadata record is created
5. Queue job enqueued
6. Worker processes image to:
   - `storage/processed/full`
   - `storage/processed/preview`
7. API emits websocket update for instant UI refresh

## Notes

- The UI is responsive and optimized for desktop + mobile.
- Retouch is intentionally natural (no heavy smoothing/plastic look).
- All processing/state transitions include error handling and failed status propagation.
