# Mirror AI

Mirror AI is a realtime photography assistant pipeline:

Camera -> FTP -> Server -> AI Processing -> Instant app display

## Product Architecture

```
mirror-ai/
  backend/
    src/
      config/        # env + path config
      controllers/   # API handlers
      data/          # preset definitions
      ftp/           # FTP server + file watcher
      processing/    # analysis + image processor
      queue/         # BullMQ queue + worker
      realtime/      # websocket broadcast gateway
      routes/        # API route registry
      services/      # storage, ingestion, serialization
      types/         # domain models
      utils/         # logging
  frontend/
    src/
      api/           # backend API client
      components/    # premium UI modules
      hooks/         # websocket live-sync hook
      lib/           # env utilities
      types/         # frontend domain models
  docker-compose.yml
```

## Features Built

- FTP ingestion server with authenticated access.
- Auto-detect incoming images via watcher and instant queueing.
- AI processing pipeline with:
  - exposure + skin tone + contrast analysis
  - preset-driven adjustments (Lightroom style)
  - natural retouching (subtle median smoothing)
  - fast preview + full-resolution output
- Redis + BullMQ async queue worker.
- WebSocket real-time push to frontend (no refresh).
- API for images, presets, control state, reprocess, and batch apply.
- Storage separation for originals, previews, processed outputs, metadata.
- Premium dark responsive React + Tailwind interface:
  - Live Feed
  - Before / After toggle
  - Preset selector
  - Shoot category controls
  - Status badges
  - Batch apply controls

## Setup

### 1) Start Redis

```bash
docker run --rm -p 6379:6379 redis:7-alpine
```

### 2) Configure env files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3) Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4) Run backend

```bash
cd backend
npm run dev
```

### 5) Run frontend

```bash
cd frontend
npm run dev
```

Frontend: http://localhost:5173
Backend API: http://localhost:4000/api
WebSocket: ws://localhost:4000/ws
FTP: ftp://localhost:2121

FTP credentials (default):
- username: `mirror`
- password: `mirror123`

## Docker Compose (all services)

```bash
cd mirror-ai
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up
```

## API Endpoints

- `GET /api/health`
- `GET /api/images`
- `POST /api/images/upload` (multipart key: `image`)
- `GET /api/presets`
- `GET /api/control`
- `PATCH /api/control`
- `POST /api/control/reprocess/:id`
- `POST /api/control/batch-apply`

## Notes

- Originals are persisted under `backend/storage/originals`.
- Processed outputs are under `backend/storage/previews` and `backend/storage/processed`.
- Metadata is persisted in `backend/storage/metadata/images.json`.
