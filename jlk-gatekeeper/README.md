# mohn-gatekeeper

Backend API for the Mohn streaming app. A Cloudflare Worker built with Hono that handles authentication, per-profile data, and acts as an authenticated proxy for TMDB.

## Stack

- **Runtime** — Cloudflare Workers via Wrangler
- **Framework** — Hono
- **Auth** — better-auth
- **Database** — PostgreSQL via Cloudflare Hyperdrive + Drizzle ORM

## Setup

```bash
bun install
```

Generate Cloudflare binding types after updating `wrangler.toml`:

```bash
bun cf-typegen
```

Push the database schema (requires `HYPERDRIVE_CONNECTION_STRING` in env):

```bash
bun db:push
```

Run locally:

```bash
bun dev
```

Deploy to Cloudflare:

```bash
bun deploy
```
