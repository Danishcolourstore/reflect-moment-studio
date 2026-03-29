# Mirror AI

Mirror AI is a real-time photography assistant:

`Camera -> FTP -> Backend ingest -> AI processing -> Instant live UI updates`

This repository now includes:

- **Frontend**: React + Tailwind premium dark dashboard (`src/mirror/*`)
- **Backend**: Node/TypeScript service with FTP ingest, queue, processing, API, and WebSocket (`backend/`)
- **Storage**: originals, previews, processed files, metadata JSON database (`backend/storage/`)
- **Queue**: Redis (BullMQ) with automatic in-memory fallback

## Features implemented

- FTP server receives image uploads and auto-detects new files.
- Uploads are moved to originals storage and queued instantly.
- Processing engine analyzes image brightness/contrast/warmth/skin heuristics.
- Lightroom-style preset logic + natural retouch intensity applied via Sharp.
- Outputs:
  - fast preview image
  - full-resolution processed image
- WebSocket pushes live updates to frontend (no page refresh).
- API for snapshot, settings, single reprocess, and batch reprocess.
- Premium UI:
  - Live feed
  - Before/after toggle
  - Preset selector
  - Shoot categories
  - Status badges (queued / processing / done / error)
  - Batch apply controls

## Folder structure

```txt
.
├── backend
│   ├── src
│   │   ├── api.ts
│   │   ├── config.ts
│   │   ├── database.ts
│   │   ├── events.ts
│   │   ├── ftp.ts
│   │   ├── helpers.ts
│   │   ├── index.ts
│   │   ├── presets.ts
│   │   ├── processor.ts
│   │   ├── storage.ts
│   │   ├── types.ts
│   │   ├── ws.ts
│   │   └── queue
│   │       ├── index.ts
│   │       ├── memoryQueue.ts
│   │       ├── redisQueue.ts
│   │       └── types.ts
│   └── storage
│       ├── ftp-incoming/
│       ├── originals/
│       ├── previews/
│       ├── processed/
│       └── metadata/
├── src
│   ├── App.tsx
│   ├── main.tsx
│   └── mirror
│       ├── MirrorApp.tsx
│       ├── api.ts
│       ├── types.ts
│       ├── useMirrorRealtime.ts
│       └── utils.ts
├── .env.example
└── docker-compose.yml
```

## Environment setup

Copy and edit:

```bash
cp .env.example .env
```

Key values:

- `VITE_MIRROR_API_URL` - frontend target API URL
- `API_PORT` - backend API and WebSocket port
- `FTP_PORT`, `FTP_USER`, `FTP_PASSWORD` - FTP ingest server config
- `QUEUE_DRIVER` - `auto`, `redis`, or `memory`
- `REDIS_URL` - Redis connection string
- `STORAGE_ROOT` - backend storage path (relative to `backend/` working directory)

## Run commands

Install all dependencies:

```bash
npm install
npm run backend:install
```

Start Redis (optional but recommended):

```bash
docker compose up -d redis
```

Run backend:

```bash
npm run backend:dev
```

Run frontend:

```bash
npm run dev
```

Build frontend:

```bash
npm run build
```

Build backend:

```bash
npm run backend:build
```

## FTP ingest flow

Use any FTP client with credentials from `.env`:

- host: `127.0.0.1`
- port: `FTP_PORT`
- user: `FTP_USER`
- pass: `FTP_PASSWORD`

Upload image files (`.jpg`, `.jpeg`, `.png`, `.webp`, `.tif`, `.tiff`) to FTP root.
Mirror AI will queue and process them immediately, then stream updates live to the UI.
