# Mirror AI

Mirror AI is a real-time photography assistant:

**Camera -> FTP -> Server -> AI Processing -> Instant app display**

This build includes:

- FTP ingestion server
- Auto image detection and instant queueing
- AI-style processing pipeline (exposure, skin tone, lighting analysis + natural retouch)
- Fast preview + full-resolution outputs
- Real-time WebSocket push to frontend (no refresh)
- Premium React + Tailwind UI (dark luxury style)
- Live control system (preset/category/retouch + batch apply)
- Persistent storage for originals, processed images, and metadata

---

## Tech Stack

- **Frontend:** React + Vite + TypeScript + Tailwind + shadcn UI
- **Backend:** Node.js + Express + WebSocket + ftp-srv
- **Processing:** sharp
- **Storage/Metadata:** filesystem + SQLite (better-sqlite3)

---

## Folder Structure

```txt
src/                      # Mirror AI frontend
server/
  config.js               # env + paths + runtime config
  database.js             # SQLite schema + CRUD + control state
  ingest.js               # file watcher + ingest pipeline trigger
  processor.js            # image analysis + preset + retouch engine
  queue.js                # async in-process queue
  realtime.js             # websocket hub
  server.js               # API + WS + FTP server orchestration
  storage.js              # storage directories and URL helpers
  presets.js              # built-in presets + shoot categories
  index.js                # backend entrypoint
mirror-data/              # generated at runtime (ignored)
  ftp-incoming/
  ftp-archive/
  originals/
  previews/
  processed/
  metadata/
  mirror.db
```

---

## Environment

Copy `.env.example` to `.env` and update values if needed.

```bash
cp .env.example .env
```

### Required / Important variables

- `MIRROR_STORAGE_ROOT`
- `MIRROR_API_PORT`
- `MIRROR_FTP_PORT`
- `MIRROR_FTP_USERNAME`
- `MIRROR_FTP_PASSWORD`
- `VITE_MIRROR_API_BASE`
- `VITE_MIRROR_WS_URL`

---

## Install

```bash
npm install
```

---

## Run (Development)

Runs frontend and backend together:

```bash
npm run dev
```

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:8787`
- WebSocket: `ws://localhost:8787/ws`
- FTP: `ftp://localhost:2121` (credentials from `.env`)

---

## Run (Backend only)

```bash
npm run start
```

---

## Build Frontend

```bash
npm run build
```

---

## Test

```bash
npm run test
```

---

## API Summary

- `GET /health`
- `GET /api/images?limit=120&offset=0`
- `GET /api/images/:id`
- `GET /api/presets`
- `GET /api/control`
- `PATCH /api/control`
- `POST /api/images/:id/requeue`
- `POST /api/images/batch/apply`
- `POST /api/upload` (multipart form-data: `file`)

---

## WebSocket Events

- `hello`
- `snapshot`
- `image:ingested`
- `image:queued`
- `image:status`
- `image:updated`
- `image:done`
- `control:updated`

---

## FTP Ingestion

Configure camera/tethering software to upload to:

- Host: `MIRROR_FTP_HOST` (typically `localhost`/server IP)
- Port: `MIRROR_FTP_PORT`
- Username: `MIRROR_FTP_USERNAME`
- Password: `MIRROR_FTP_PASSWORD`

Incoming files land in `mirror-data/ftp-incoming/`, get archived to `ftp-archive/`, copied into `originals/`, then processed and published in real time.

---

## Quality and Error Handling

- Non-image uploads are ignored safely
- File stability checks before ingest
- Queue isolation so one failure does not stop other jobs
- Processing failures are marked `failed` with status broadcast
- Graceful shutdown for HTTP/WS/FTP/watcher/queue
