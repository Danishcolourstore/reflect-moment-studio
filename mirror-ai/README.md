# Mirror AI

Mirror AI is a complete realtime photography assistant:

**Camera -> FTP -> Server -> AI Processing -> Instant app display**

---

## Product Modules

- **FTP Ingestion**: FTP server + incoming file watcher
- **Processing Pipeline**: exposure/contrast/skin analysis + presets + natural retouch
- **Realtime Transport**: WebSocket event push for lifecycle updates
- **Backend API**: images, presets, metadata, live control system, batch edits
- **Frontend UI**: premium dark responsive dashboard (live feed, before/after, controls)
- **Storage**: originals, processed exports, previews, metadata JSON

---

## Folder Structure

```text
mirror-ai/
├── backend/
│   ├── src/
│   │   ├── api/              # REST routes
│   │   ├── config/           # env loading/validation
│   │   ├── ftp/              # FTP server + watcher
│   │   ├── pipeline/         # analysis + processing + presets
│   │   ├── queue/            # Redis/in-memory queue abstraction
│   │   ├── services/         # ingestion + processing orchestration
│   │   ├── sockets/          # websocket broadcaster
│   │   ├── storage/          # file + metadata stores
│   │   ├── types/
│   │   └── utils/
│   └── storage/              # runtime generated folders/files
├── frontend/
│   ├── src/
│   │   ├── components/       # premium UI widgets
│   │   ├── hooks/            # realtime ws hook
│   │   ├── pages/            # live feed + control center
│   │   ├── types/
│   │   └── utils/            # API + env
│   └── dist/                 # production build output
├── scripts/
│   └── run-dev.sh            # run backend + frontend together
├── docker-compose.yml        # optional Redis service
└── .env.example              # combined product env template
```

---

## Setup

### 1) Install dependencies

```bash
cd mirror-ai/backend && npm install
cd ../frontend && npm install
```

### 2) Configure env

Backend:

```bash
cd mirror-ai/backend
cp .env.example .env
```

Frontend:

```bash
cd mirror-ai/frontend
cp .env.example .env
```

Optional root template:

```bash
cd mirror-ai
cp .env.example .env
```

### 3) (Optional) start Redis queue

```bash
cd mirror-ai
docker compose up -d redis
```

Then set in `backend/.env`:

```env
REDIS_ENABLED=true
REDIS_URL=redis://127.0.0.1:6379
```

### 4) Run services

Option A - run both:

```bash
cd mirror-ai
./scripts/run-dev.sh
```

Option B - separate terminals:

```bash
cd mirror-ai/backend && npm run dev
cd mirror-ai/frontend && npm run dev
```

Frontend URL: `http://localhost:5173`

Backend URL: `http://localhost:8080`

FTP endpoint: `ftp://localhost:2121` (user/password from backend `.env`)

---

## FTP Ingestion Path

Upload camera images to:

`/uploads/incoming`

The system will:

1. copy file to originals
2. create metadata record
3. enqueue processing
4. generate preview + full-resolution output
5. push realtime events to frontend

---

## API Endpoints

- `GET /health`
- `GET /api/images`
- `GET /api/images/:id`
- `GET /api/images/:id/file?type=original|preview|processed`
- `GET /api/presets`
- `GET /api/control/defaults`
- `PATCH /api/control/defaults`
- `PATCH /api/images/:id/control`
- `POST /api/images/batch`

---

## Frontend Features Delivered

- Live feed of incoming images
- Before/After toggle
- Preset selector
- Shoot categories filter
- Status badges (`queued`, `processing`, `done`, `error`)
- Live defaults control (preset + retouch)
- Batch apply controls
- Responsive mobile + desktop dark luxury UI

---

## Notes

- Queue auto-fallback: if Redis is unavailable, in-memory queue is used.
- WebSocket reconnect is automatic in frontend.
- Backend handles file and processing errors without process crash.
