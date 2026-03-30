# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Mirror AI (Realtime Photography Assistant)

This repository now includes a full Mirror AI product build:

- **Frontend**: premium realtime UI at `/dashboard/mirror-ai-live` (React + Tailwind)
- **Backend API + WebSocket + FTP**: `services/mirror-ai`
- **Async processing worker**: `services/mirror-ai/src/worker.ts`
- **Queue**: BullMQ + Redis
- **Storage**:
  - originals
  - preview outputs
  - processed full-resolution outputs
  - metadata JSON database

### Mirror AI folder structure

```txt
services/mirror-ai
├── src
│   ├── ftp/server.ts
│   ├── ingest/register-image.ts
│   ├── pipeline/analyzer.ts
│   ├── pipeline/processor.ts
│   ├── http.ts
│   ├── index.ts
│   ├── worker.ts
│   └── ...
├── .env.example
└── README.md
```

### Setup and run (Mirror AI)

1. **Backend setup**

```bash
cd services/mirror-ai
npm install
cp .env.example .env
```

2. **Start Redis**

```bash
docker run --name mirror-redis -p 6379:6379 -d redis:latest
```

3. **Run backend API + FTP server**

```bash
cd services/mirror-ai
npm run dev:api
```

4. **Run worker**

```bash
cd services/mirror-ai
npm run dev:worker
```

5. **Frontend env + run**

Create/update root `.env` with:

```bash
VITE_MIRROR_API_URL=http://localhost:8787
```

Then run frontend:

```bash
npm install
npm run dev
```

6. **Open Mirror AI app**

- Route: `http://localhost:8080/dashboard/mirror-ai-live`

### FTP ingestion target

- Host: `localhost`
- Port: `2121`
- Username: `mirror`
- Password: `mirror`
- Upload directory: `/`

Incoming images are auto-detected and instantly processed.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
