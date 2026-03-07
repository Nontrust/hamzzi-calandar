# Nahamzzi Monorepo

## Workspace
- `apps/mobile-web`: Expo app (web + iOS)
- `services/functions`: Server-side handlers/integration logic
- `packages/domain`: Domain rules and shared models
- `packages/ui`: Shared UI components/helpers
- `packages/config`: Runtime config loader
- `infra/migrations`: SQL migrations
- `infra/scheduler`: Cron SQL definitions

## Local Development
1. Install deps
   - `npm install`
2. Run web app
   - `npm --workspace apps/mobile-web run web -- --offline --clear --port 8090`
3. Run typecheck/tests
   - `npm --workspace apps/mobile-web run typecheck`
   - `npm --workspace services/functions run typecheck`
   - `npm --workspace services/functions run test`

## Required Environment Variables
Define these in your runtime environment (`.env`/CI secret manager):

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_BASE_URL` (mobile app -> server API base URL)
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_CLIENT_EMAIL`
- `NAHAMZZI_TOKEN_ENCRYPTION_KEY` (32-byte key, hex/base64)

Notes:
- `NAHAMZZI_TOKEN_ENCRYPTION_KEY` is required for token at-rest encryption (AES-GCM).
- `EXPO_PUBLIC_API_BASE_URL` is required for server-first anniversary/calendar calls.

## Deployment Checklist
Before deploy:
1. Confirm env vars are configured in deployment target.
2. Apply DB migrations in order:
   - `infra/migrations/0001_schema.sql`
   - `infra/migrations/0002_rls_and_storage.sql`
   - `infra/migrations/0003_server_foundation.sql`
   - `infra/migrations/0004_anniversaries.sql`
   - `infra/migrations/0005_auth_sessions.sql`
3. Verify auth/session flows:
   - login success/failure
   - session validation
   - logout invalidates session
4. Verify anniversary flows use server API (not local storage fallback).
5. Verify route guards:
   - unauthenticated -> login
   - authenticated -> app home

## Release Verification
Run:
- `npm --workspace services/functions run test`
- `npm --workspace services/functions run typecheck`
- `npm --workspace apps/mobile-web run typecheck`
- `npx vitest run --pool=vmThreads tests/routeGuards.test.ts` (from `apps/mobile-web`)

Manual QA log:
- `docs/qa/manual-regression-2026-03-07.md`

Ops runbook:
- `docs/operations/runbook.md`

## Troubleshooting
- If web bundling fails with `spawn EPERM` in restricted Windows shell:
  - Run terminal with elevated permission, or
  - Set `BROWSER=none` and run Expo again.
- If port already in use:
  - Change port (example: `--port 8091`).
