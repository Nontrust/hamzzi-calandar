# Operations Runbook

## Initial Defaults
- Runtime: TypeScript + Expo + PostgreSQL (pg)
- Mobile API base URL: `EXPO_PUBLIC_API_BASE_URL` (required for server-first anniversary/calendar calls)
- PostgreSQL connection: `PG_CONNECTION_STRING` (used by server CRUD)
- Sync schedule: `07:00`, `13:00`, `19:00` (server time)
- Token encryption: `NAHAMZZI_TOKEN_ENCRYPTION_KEY` must be set as a 32-byte key (hex/base64)
- Calendar sync transitions:
  - `not_connected -> pending -> synced`
  - `pending -> failed -> pending` (retry)

## Migration Apply
1. Apply SQL migrations in order:
   - `infra/migrations/0001_schema.sql`
   - `infra/migrations/0002_rls_and_storage.sql`
   - `infra/migrations/0003_server_foundation.sql`
   - `infra/migrations/0004_anniversaries.sql`
   - `infra/migrations/0005_auth_sessions.sql`
   - `infra/migrations/0006_anniversaries_pg_alignment.sql`
2. Verify required tables/indexes exist:
   - `users`, `sessions`, `anniversaries`

## Auth Seed Procedure
- Demo accounts are seeded only as hashed passwords.
- Seeded login IDs:
  - `nahamzzi` (user-a)
  - `deed1515` (user-b)
- Password hashes must be stored as `password_hash`; never store plain passwords in migration docs/code comments.
- Token values must be encrypted at rest (AES-GCM), never URI/base64-only encoded.

## Rollback Strategy
1. Disable scheduled jobs first (`cron.unschedule('exam-ingestion-sync')`).
2. Disable auth gate via feature flag if emergency rollback is needed.
3. Roll back migrations in reverse order with dedicated rollback SQL.
4. Keep data paths read-only during partial rollback windows.

## QA Evidence
- Manual regression log: `docs/qa/manual-regression-2026-03-07.md`

## Incident Response
- Auth failure spike:
  - Check session expiry configuration and storage health.
  - Check `NAHAMZZI_TOKEN_ENCRYPTION_KEY` presence/format mismatch in runtime.
  - Check repeated invalid credential attempts and rate-limit events.
- Calendar sync failure spike:
  - Separate auth failures from external sync failures.
  - Retry external integration after root-cause mitigation.

## Server Error Code Mapping
- `AUTH_REQUIRED`: Missing/invalid authentication context
- `AUTH_INVALID_CREDENTIALS`: Wrong login ID or password
- `AUTH_SESSION_EXPIRED`: Expired/revoked session token
- `FORBIDDEN_ROLE`: Role does not have operation permission
- `FORBIDDEN_OWNER`: Resource owner mismatch
- `VALIDATION_ERROR`: Input validation failed
- `ANNIVERSARY_NOT_FOUND`: Anniversary record is missing/inactive
- `SYNC_RETRY_SCHEDULED`: Sync failed and retry was scheduled
- `SYNC_RETRY_EXHAUSTED`: Retry budget exhausted; manual action required
- `INTERNAL_ERROR`: Unhandled server error (check requestId in logs)
