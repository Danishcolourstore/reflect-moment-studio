# Mirror AI Server

Real-time image ingestion + processing service for Mirror AI.

## Features

- FTP ingestion endpoint
- Auto queueing with BullMQ + Redis
- Image analysis + preset logic + natural retouch (Sharp)
- Preview + full-resolution output
- WebSocket push for live frontend updates
- REST API for feed, presets, settings, and batch reprocessing

## Environment

Copy `.env.example` to `.env` and adjust as needed.

```bash
cp .env.example .env
```

## Run

```bash
npm install
npm run dev
```

## Endpoints

- API: `http://localhost:8787/api`
- WS: `ws://localhost:8787/ws`
- FTP: `ftp://localhost:2121`

Default FTP credentials:

- user: `mirrorai`
- pass: `mirrorai123`

## Storage layout

Data is written under `mirror-ai-server/data/run-<timestamp>/`:

- `ftp-inbox/` raw uploaded files
- `originals/` normalized originals
- `previews/` processed fast previews
- `processed/` full-resolution processed outputs
- `metadata/` per-image metadata/analysis JSON
