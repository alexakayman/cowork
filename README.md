# Cowork

Animal Crossing-style coworking presence app. See what your friends are working on in real time with a cute transparent overlay on your desktop.

## How it works

Cowork is a Tauri 2 desktop app that detects your foreground application and shares your activity with others over WebSocket. It has two windows:

- **Main window** — a dashboard where you set up your profile (name + avatar), create or join a session, and see what everyone's up to
- **Overlay window** — a transparent, always-on-top strip that shows all session members as little avatar chips with thought bubbles indicating their current activity (coding, writing, browsing, etc.)

Activity detection runs natively via Rust on macOS (NSWorkspace), Windows (Win32), and Linux (xdotool).

## Tech stack

| Layer | Tech |
|---|---|
| Monorepo | pnpm workspaces |
| Desktop app | Tauri 2 (Rust) + React 18 + TypeScript 5 |
| UI | Tailwind CSS 4 |
| State | Zustand |
| Routing | React Router 7 |
| Server | uWebSockets.js (Node.js) |
| Shared types | `@cowork/shared` (pure TS) |

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (v9+)
- [Rust](https://rustup.rs/) (for building the Tauri desktop app)

On macOS you'll also need Xcode Command Line Tools:

```sh
xcode-select --install
```

## Quick start

```sh
# Clone and enter the repo
git clone git@github.com:alexakayman/cowork.git
cd cowork

# Run the setup script (installs deps + creates .env files)
./scripts/setup.sh

# Start both the server and desktop app
pnpm dev
```

Or do it manually:

```sh
pnpm install

# Copy env files (if you haven't already)
cp apps/desktop/.env.example apps/desktop/.env
cp apps/server/.env.example apps/server/.env

pnpm dev
```

## Project structure

```
cowork/
├── apps/
│   ├── desktop/          # Tauri + React desktop app
│   │   ├── src/          # React frontend (components, hooks, stores)
│   │   └── src-tauri/    # Rust backend (activity detection, tray, windows)
│   └── server/           # WebSocket presence server (uWebSockets.js)
├── packages/
│   └── shared/           # Shared TypeScript types & message definitions
├── scripts/
│   └── setup.sh          # One-command project setup
└── pnpm-workspace.yaml
```

## Scripts

From the repo root:

| Command | What it does |
|---|---|
| `pnpm dev` | Starts server + desktop app concurrently |
| `pnpm dev:server` | Starts only the WebSocket server |
| `pnpm dev:desktop` | Starts only the Tauri desktop app |
| `pnpm build:server` | Builds the server to `apps/server/dist` |
| `pnpm build:desktop` | Builds the Tauri app for production |

## Environment variables

### `apps/desktop/.env`

| Variable | Default | Description |
|---|---|---|
| `VITE_WS_URL` | `ws://localhost:3333` | WebSocket URL for the presence server |

### `apps/server/.env`

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3333` | Port the WebSocket server listens on |

See `.env.example` files in each app for reference.

## Deploying the server

The WebSocket server needs a platform that supports **persistent connections** (not serverless). Vercel/Cloudflare Workers won't work. The best free option is [Fly.io](https://fly.io/).

### Deploy to Fly.io (free tier)

```sh
# Install the Fly CLI
brew install flyctl          # or: curl -L https://fly.io/install.sh | sh

# Sign up / log in
fly auth signup              # or: fly auth login

# Launch the app (first time only — creates the app on Fly)
fly launch --no-deploy

# Deploy
fly deploy
```

After deploy, Fly gives you a URL like `cowork-server.fly.dev`. Update the desktop app to connect to it:

```sh
# apps/desktop/.env
VITE_WS_URL=wss://cowork-server.fly.dev
```

Rebuild the desktop app and share it with friends. Everyone connects to the same server, creates a session code, and they're in.

## Releases and the landing page download link

The repo uses **Vercel Blob** so the public landing page can offer a direct download of the macOS app even when the GitHub repo is private.

### One-time setup

1. **Create a Vercel Blob store** (same Vercel team/project as your landing, or any project):
   - [Vercel Dashboard](https://vercel.com/dashboard) → your project → Storage → Create Database → Blob. Name it (e.g. `cowork-releases`), set access to **Public**, create it.
   - Copy the **Read-Write Token** from the store’s settings.

2. **Add the token to GitHub** (so the release workflow can upload the .dmg):
   - Repo → Settings → Secrets and variables → Actions → New repository secret.
   - Name: `BLOB_READ_WRITE_TOKEN`, value: the token from step 1.

3. **Run a release** (or the upload script locally) to get the public URL:
   - Push a tag, e.g. `git tag v1.3.0 && git push origin v1.3.0`. The workflow builds the app, uploads the .dmg to Blob, and prints the download URL in the “Upload DMG to Vercel Blob” step log.
   - Or locally after building the .dmg: `BLOB_READ_WRITE_TOKEN=your_token node scripts/upload-dmg-to-blob.mjs apps/desktop/src-tauri/target/release/bundle/dmg/Cowork_1.x.x_aarch64.dmg` (adjust path to your built .dmg). The script prints the URL.

4. **Set the URL on the landing project**:
   - In the Vercel project that deploys the landing, go to Settings → Environment Variables.
   - Add `DOWNLOAD_URL` = the URL from step 3 (e.g. `https://xxxx.public.blob.vercel-storage.com/Cowork-macos.dmg`).
   - Redeploy the landing so the “Download for macOS” button uses that link.

5. **Landing must use Root Directory `apps/landing`** (if you get 404s):
   - Vercel project → Settings → General → Root Directory → set to `apps/landing` and Save. Then redeploy so the build runs in that folder and finds `index.html`.

Later releases (new tags) overwrite the same Blob file, so the same `DOWNLOAD_URL` keeps serving the latest build. You only set it once.

### Other hosting options

| Platform | Free tier | Notes |
|---|---|---|
| [Fly.io](https://fly.io/) | 3 shared VMs | Best option — always-on, auto-pause on idle |
| [Railway](https://railway.app/) | $5/mo credit | Easy Git deploy, supports pnpm monorepos |
| [Render](https://render.com/) | Free web service | Spins down after 15 min idle (first reconnect is slow) |

All three support the included `Dockerfile`.
