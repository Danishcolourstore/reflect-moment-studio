# Mirror AI Frontend

Premium realtime dashboard for Mirror AI.

## Features

- Live Feed with status badges and shoot category filtering
- Before / After toggle per image
- Realtime updates over WebSocket (no refresh)
- Preset selector and retouch intensity controls
- Batch apply editing controls
- Responsive desktop + mobile layout

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment

- `VITE_API_BASE_URL` - backend API URL
- `VITE_WS_BASE_URL` - backend WS URL
