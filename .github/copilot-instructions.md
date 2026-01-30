# Copilot Instructions

## Project overview
- Next.js 16 App Router app serving youth training + work tracking; key pages live under [src/app](src/app).
- Server APIs are Next route handlers under [src/app/api](src/app/api); shared API helpers live in [src/app/api/_lib](src/app/api/_lib).

## Architecture & data flow
- API routes use `Database.query()` from [src/app/api/_lib/database.ts](src/app/api/_lib/database.ts) for PostgreSQL (Neon) access; authentication helpers live in [src/app/api/_lib/auth.ts](src/app/api/_lib/auth.ts).
- UI talks to internal APIs in [src/app/api](src/app/api) for youth, staff, trainer, contracts, work, and external sync.
- OSM building counts come from `getTodayBuildingCount()` in [src/lib/osm-service.ts](src/lib/osm-service.ts); it uses Redis if `REDIS_URL` is set and falls back to in-memory cache.
- External DPW sync is a public GET endpoint requiring `X-API-Key` and `DPW_MANAGER_API_KEY`; see [src/app/api/external/dpw-sync/route.ts](src/app/api/external/dpw-sync/route.ts).
- Training content is data-driven in [src/data](src/data) (e.g., mapper/mobile-mapping training content).

## Project-specific conventions
- Prefer `Database.query()` for API route DB access (App Router handlers) rather than ad-hoc clients; see [src/app/api/external/dpw-sync/route.ts](src/app/api/external/dpw-sync/route.ts) for query style.
- Utility DB pool for non-route code lives in [src/lib/db.ts](src/lib/db.ts) (used by server utilities).
- Auth uses JWT secrets in `learn_STACK_SECRET_SERVER_KEY` or `JWT_SECRET` (see [src/app/api/_lib/auth.ts](src/app/api/_lib/auth.ts)).
- Archived scripts under [archive](archive) are reference-only; do not run without review (see [archive/README.md](archive/README.md)).
- Always create backups before modifying `youth_participants` data; use pattern in [scripts/backup-youth-data.js](scripts/backup-youth-data.js).

## Developer workflows
- Local dev/build/lint: `npm run dev`, `npm run build`, `npm run lint` (see [package.json](package.json)).
- DB bootstrap: `npm run db:init` (see [package.json](package.json)).
- Scripts: run Node scripts from [scripts](scripts); they expect `.env.local` and `dotenv` load pattern from [scripts/README.md](scripts/README.md).

## Key docs & integration points
- Setup + env vars: [docs/DEVELOPER_ONBOARDING.md](docs/DEVELOPER_ONBOARDING.md).
- External services: ODK Central, OSM, email, DPW Manager (summarized in [docs/README.md](docs/README.md)).
