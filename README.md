# 공기업 합격 코치 (커플 스터디)

## Workspace
- `apps/mobile-web`: Expo app (iOS + web)
- `services/functions`: Server functions (integration + AI)
- `packages/domain`: Domain models and state transition rules
- `packages/ui`: Shared UI helpers
- `packages/config`: Environment loaders and runtime config
- `infra/migrations`: Supabase SQL migrations
- `infra/scheduler`: Cron job definitions

## Quick Start
1. Install dependencies: `npm install`
2. Run mobile/web app: `npm run dev:mobile`
3. Run web only: `npm run dev:web`

## Local Postgres (Docker Compose)
1. Start DB stack: `npm run infra:up`
2. Apply migrations: `npm run infra:migrate`
3. Open Adminer: `http://localhost:8080`
4. Stop stack: `npm run infra:down`
