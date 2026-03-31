# Mirror AI

Mirror AI is a real-time photography assistant that ingests camera uploads via FTP, processes images with intelligent presets and natural retouching, and streams results instantly to a premium web dashboard.

## Architecture

- **FTP Ingestion**: FTP server accepts camera uploads into `/backend/storage/incoming`.
- **Auto Trigger**: File watcher detects finished uploads and queues processing jobs instantly.
- **Processing Pipeline**: Sharp-based adaptive edits for exposure, skin tone balance, lighting, and optional natural retouch.
- **Queue**: Redis/BullMQ when `REDIS_URL` is configured; otherwise resilient in-memory queue fallback.
- **Realtime**: WebSocket (`/ws`) pushes status and processed image updates live.
- **Backend API**: Express endpoints for feed, presets, settings, reprocess, and batch apply.
- **Frontend**: React + Tailwind premium UI with live feed, before/after toggle, preset selector, category controls, status badges, and batch tools.

## Folder Structure

```
mirror-ai/
  package.json
  .gitignore
  backend/
    package.json
    tsconfig.json
    .env.example
    src/
      index.ts
      config.ts
      ftp.ts
      ingestion.ts
      queue.ts
      processor.ts
      api.ts
      realtime.ts
      presets.ts
      metadataStore.ts
      serializers.ts
      storage.ts
      types.ts
      utils.ts
      logger.ts
    storage/
      incoming/
      originals/
      preview/
      processed/
      metadata/
  frontend/
    package.json
    .env.example
    index.html
    tsconfig.json
    vite.config.ts
    tailwind.config.js
    postcss.config.js
    src/
      main.tsx
      App.tsx
      index.css
      types.ts
      lib/
        api.ts
        useRealtimeData.ts
      components/
        BeforeAfterCard.tsx
        PresetSelector.tsx
        CategorySelector.tsx
        StatusBadge.tsx
        ConnectionBadge.tsx
        StatCard.tsx
```

## Setup

### 1) Install dependencies

```bash
cd /workspace/mirror-ai
npm install
npm run install:all
```

### 2) Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Optional: configure Redis by setting `REDIS_URL` in `backend/.env`.

### 3) Run in development

```bash
cd /workspace/mirror-ai
npm run dev
```

- Backend: `http://localhost:8787`
- Frontend: `http://localhost:5174`
- WebSocket: `ws://localhost:8787/ws`
- FTP: `ftp://<host>:2121` with configured credentials

## API Endpoints

- `GET /health`
- `GET /api/presets`
- `GET /api/settings`
- `PATCH /api/settings`
- `GET /api/images`
- `GET /api/images/:id`
- `POST /api/images/:id/reprocess`
- `POST /api/images/apply`
- `GET /media/*` (serves originals/preview/processed)

## FTP Upload Flow

1. Camera uploads image to FTP root (`incoming`).
2. Watcher validates and moves image into `originals`.
3. Metadata record is created and queued immediately.
4. Processor outputs fast preview and full-resolution image.
5. WebSocket broadcasts `uploaded -> processing -> done/failed` in real time.

## Build and Run Production

```bash
cd /workspace/mirror-ai
npm run build
npm start
```

## Notes

- Natural retouch intentionally uses restrained blur + sharpen balancing to avoid plastic skin artifacts.
- Image metadata and settings are persisted as JSON under `backend/storage/metadata`.
- Storage directories are pre-created and safe for local or mounted volume usage.
