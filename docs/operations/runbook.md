# Operations Runbook

## Initial Defaults
- Runtime: TypeScript, Expo, Supabase
- Sync schedule: `07:00`, `13:00`, `19:00` (server time)
- Calendar sync status transitions:
  - `not_connected` -> `pending` -> `synced`
  - `pending` -> `failed` -> `pending` (retry)
- Brand copy policy:
  - 톤 비율은 기본 70 : 키치 30을 유지
  - 내부 식별자는 유지하고, 화면 노출은 용어집 매핑을 사용
  - 한 화면의 `햄` 계열 단어는 최대 1~2회로 제한
  - 금지어 포함 문구는 저장/생성 불가
  - 키치 라벨 누락 시 기본 라벨 fallback

## Calendar Title Guide
- 기본 템플릿: `데이트데이 · [기관] <단계>`
- 단계 예시: `원서접수 시작`, `원서접수 마감`, `필기시험`, `발표`
- 길이 가이드:
  - 제목 40자 초과 시 기관명 축약 후 재생성
  - 재생성 후에도 초과하면 기본 템플릿(`[기관] <단계>`)으로 fallback
- 오류 메시지:
  - 브랜드 톤 + 복구 안내를 함께 표시
  - 예: `일정 동기화 잠깐 삐끗 (일정 동기화 실패: 다시 시도해줘)`

## Migration Apply
1. Apply SQL migrations in order:
   - `infra/migrations/0001_schema.sql`
   - `infra/migrations/0002_rls_and_storage.sql`
2. Verify required tables and policies are present.

## Rollback Strategy
1. Disable scheduled jobs first (`cron.unschedule('exam-ingestion-sync')`).
2. Disable function endpoints or block by feature flag.
3. Revert migration in reverse order with dedicated rollback SQL.
4. 용어집 토글을 기본 라벨 세트로 전환한다.
5. Verify client behavior with read-only mode if partial rollback is required.

## Incident Response
- Sync failure spike:
  - Check external API quota and network errors
  - Keep failed records for replay
  - Trigger retry after root-cause mitigation
- AI report validation failure:
  - Reject invalid payload
  - Trigger server-side regeneration
  - Log schema mismatch fields
