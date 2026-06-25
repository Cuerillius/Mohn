<p align="center">
  <img src="app/src-tauri/icons/icon.png" alt="Mohn" width="180" />
</p>
 
<h1 align="center">Mohn</h1>
 
<p align="center">
  <strong>The streaming app Stremio should've been.</strong>
  <br />
A modern, open-source streaming client built for debrid streaming. Browse, discover, and watch instantly.
</p>
 
---
 
<img src="landing/public/hero.webp" alt="Homepage" />
 
 
## Features
 
- **Multiple profiles** —  Individual history, watchlists, and recommendations for everyone.
- **TorBox integration** — Stream from your Debrid cloud at full speed.
- **Stremio add-on support** — Supports any public or self-hosted add-on.
- **Synced everywhere** — History and settings stay updated across all devices.
- **Tailored for you** — A smart homepage with recommendations that improve over time.
 
## Getting Started
 
1. **Create an account** — sign up with email or Google
2. **Add your sources** — paste in a TorBox API key and connect any Stremio-compatible add-ons
3. **Watch** — browse trending titles, search for anything, and hit play
 
 
 
## Repo Structure
 
```
/app           # Desktop and web app
/landing       # Marketing landing page
/gatekeeper    # Backend
```
## Dev Setup
 
**Prerequisites:** [Bun](https://bun.sh), [Docker](https://www.docker.com) (for Postgres), [Rust](https://rustup.rs) + [Tauri CLI](https://tauri.app) (desktop app only)
 
### 1. Gatekeeper (backend)
 
```bash
cd gatekeeper
cp .dev.vars.example .dev.vars   # fill in secrets
docker compose up -d             # start Postgres
bun install
bun run db:migrate               # run migrations
bun run dev                      # starts at http://localhost:8787
```
 
### 2. App (web / desktop)
 
```bash
cd app
bun install
bun run dev          # web app at http://localhost:5173
bun run tauri dev    # desktop app (requires Rust + Tauri CLI)
```
 
The app expects the gatekeeper running at `http://localhost:8787` by default.
 
### 3. Landing page
 
```bash
cd landing
cp .env.example .env   # fill in env
bun install
bun run dev            # starts at http://localhost:5174
```
 
## License
 
Open source. See [LICENSE](LICENSE) for details.
