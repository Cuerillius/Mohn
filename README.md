<p align="center">
  <img src="jlkr/src-tauri/icons/icon.png" alt="Mohn" width="120" />
</p>

<h1 align="center">Mohn</h1>

A desktop app for browsing and watching movies & TV shows. Find something, pick a source, hit play — no subscriptions, no ads, no nonsense.

Built on top of the [TMDB](https://www.themoviedb.org/) catalog and Stremio-compatible add-ons for stream discovery. Debrid playback via [TorBox](https://torbox.app/) for fast, reliable streaming. Plays back through an embedded MPV player or your browser.

---

## Features

- **Browse & search** — trending, top-rated, by genre, or just search for anything
- **Multi-profile** — separate watch history and watchlists per profile
- **Debrid streaming** — plug in a TorBox API key and stream cached torrents instantly
- **Stremio add-ons** — compatible with any Stremio torrent add-on URL
- **Flexible playback** — embedded MPV, browser player, HLS, or hand off to VLC
- **Resume where you left off** — per-profile bookmark tracking
- **Auth** — email/password or Google OAuth, powered by [better-auth](https://better-auth.com/)

---

## Architecture

```
jlkr/               — Tauri 2 desktop app (React + Vite + Tailwind)
jlk-gatekeeper/     — Backend API (Cloudflare Workers + Hono + PostgreSQL)
```

The backend acts as an authenticated proxy for TMDB and TorBox, so API keys never touch the client. Auth sessions are stored in PostgreSQL via Cloudflare Hyperdrive.

---

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Bun](https://bun.sh/) (for the backend)
- [Rust](https://www.rust-lang.org/tools/install) + [Tauri CLI](https://tauri.app/start/prerequisites/)
- A [Cloudflare](https://cloudflare.com/) account with Workers enabled
- A PostgreSQL database (e.g. [Neon](https://neon.tech/))
- A [TMDB API token](https://developer.themoviedb.org/docs/getting-started) (bearer token, not the v3 key)
- Optionally: Google OAuth credentials, a [TorBox](https://torbox.app/) account

---

### 1. Backend — `jlk-gatekeeper`

```bash
cd jlk-gatekeeper
bun install
```

Create a `.dev.vars` file (used by Wrangler locally):

```env
BETTER_AUTH_URL=http://localhost:8787
BETTER_AUTH_SECRET=your-random-secret-here
FRONTEND_URL=http://localhost:1420
TMDB_API_TOKEN=your-tmdb-bearer-token
HYPERDRIVE_CONNECTION_STRING=postgresql://user:pass@host/db

# Optional — for Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Push the database schema and start the dev server:

```bash
bun db:push
bun dev
```

The backend will be running at `http://localhost:8787`.

---

### 2. Frontend — `jlkr`

```bash
cd jlkr
npm install
```

Create a `.env` file:

```env
VITE_GATEKEEPER_URL=http://localhost:8787
```

**Run in the browser (no Tauri):**

```bash
npm run dev
```

**Run as a desktop app (Tauri):**

```bash
npm run tauri dev
```

---

### Deploying the backend to Cloudflare

```bash
cd jlk-gatekeeper

# Set production secrets
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put TMDB_API_TOKEN
# ... etc.

bun deploy
```

After deploying, update `VITE_GATEKEEPER_URL` in your frontend `.env` to the Workers URL and rebuild.

---

## Tech Stack

| Layer         | Stack                                     |
| ------------- | ----------------------------------------- |
| Desktop       | Tauri 2, Rust                             |
| Frontend      | React 18, Vite, Tailwind CSS 4, shadcn/ui |
| Data fetching | TanStack Query 5, React Router 7          |
| Backend       | Cloudflare Workers, Hono, Drizzle ORM     |
| Database      | PostgreSQL (via Cloudflare Hyperdrive)    |
| Auth          | better-auth                               |
| Video         | libmpv (desktop), HLS.js (browser)        |
| Metadata      | TMDB API                                  |
| Streaming     | Stremio add-ons + TorBox debrid           |
