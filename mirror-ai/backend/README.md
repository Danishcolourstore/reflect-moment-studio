# Mirror AI Backend

Realtime backend for Mirror AI with FTP ingestion, async image processing, API control surface, and WebSocket event streaming.

## Features

- FTP server for live camera ingest
- Auto-detect images from incoming folder
- Async processing queue (Redis/BullMQ or in-memory fallback)
- Exposure / skin-tone / lighting analysis
- Lightroom-style presets + natural retouch intensity
- Fast preview + full-res export generation
- REST API for controls, metadata, and file streaming
- WebSocket push for live updates

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

## Required folders

The service creates these automatically under `STORAGE_ROOT`:

- `uploads/incoming` (FTP drop zone)
- `originals`
- `processed`
- `previews`
- `metadata/images.json`

## FTP upload path

Upload files via FTP into:

`/uploads/incoming`

Images are ingested and queued automatically.
