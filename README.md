# Vessel Ticketing System

Monorepo for a high-throughput vessel ticketing system.

## Stack

- `apps/web` — Next.js (App Router) PWA: passenger booking + gate QR scanner UI
- `apps/api` — Fastify API: bookings, voyages, and the hot-path `/scan` endpoint
- `packages/db` — Prisma schema + client (PostgreSQL): vessels, routes, voyages, bookings, tickets, scan events
- `packages/redis` — Upstash Redis client: caches issued tickets and provides an atomic scan-claim lock so a QR code can't be boarded twice under concurrent gate traffic
- `packages/shared` — types shared between the API and the web app

Task orchestration via [Turborepo](https://turbo.build); package management via npm workspaces.

## Why Redis sits in front of Postgres

Gate scanning is the highest-throughput, highest-concurrency path in the system (many gates, bursty boarding traffic, all racing to validate the same ticket). `POST /scan`:

1. Reads the ticket from Redis (`packages/redis`), falling back to and repairing from Postgres on a cache miss.
2. Takes an atomic `SET NX` lock (`claimScan`) before persisting anything, so two simultaneous scans of one QR code can't both win.
3. Writes the scan result back to Postgres (`Ticket.status`, `ScanEvent`) as the durable record.

## Getting started

```bash
npm install

cp .env.example .env
# fill in UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN from your Upstash console

docker compose up -d          # local Postgres
npm run db:migrate            # applies packages/db/prisma/schema.prisma
npm run db:generate

npm run dev                   # runs apps/web + apps/api via turbo
```

- Web: http://localhost:3000
- API: http://localhost:4000 (health check at `/health`)

## Environment variables

See `.env.example`. `DATABASE_URL` and the API's env vars are read by `apps/api`; `NEXT_PUBLIC_API_URL` is read by `apps/web`. Copy `.env.example` to `.env` at the repo root, or to `.env` inside each app, depending on how you run things.

## PWA icons

`apps/web/public/manifest.json` references `icons/icon-192.png` and `icons/icon-512.png` — add real app icons at those paths before shipping; they're not included in the scaffold.

## Notable domain model

`Vessel` → `Voyage` (on a `Route`) → `Booking` (for a `Passenger`) → `Ticket` (one QR token) → `ScanEvent` (append-only log of every scan attempt at every gate). See `packages/db/prisma/schema.prisma`.
