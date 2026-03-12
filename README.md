# Nahamzzi Monorepo

## Workspace
- `apps/mobile-web`: Expo 앱(web + iOS). 화면 라우트는 `app/`, 앱 클라이언트는 `src/`, 앱 테스트는 `tests/`에 둡니다.
- `services/functions`: 서버 핸들러와 저장소 로직입니다. 구현은 `src/`, 테스트는 `tests/`에 있습니다.
- `packages/domain`, `packages/ui`, `packages/config`: 공용 타입, UI, 설정 모듈입니다.
- `infra/migrations`: 로컬/배포 SQL 마이그레이션입니다.
- `openspec`: 변경 제안서, 설계, 작업 목록, 메인 스펙입니다.

## Local Development
1. 의존성 설치
   - `npm install`
2. 웹 앱 실행
   - `npm --workspace apps/mobile-web run web -- --offline --clear --port 8090`
3. 타입/테스트 확인
   - `npm --workspace apps/mobile-web run typecheck`
   - `npm --workspace services/functions run typecheck`
   - `npm --workspace services/functions run test`

## Required Environment Variables
런타임 환경(`.env`, CI secret manager)에 아래 값을 설정합니다.

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_BASE_URL` (앱 -> 서버 API 기본 URL)
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_CLIENT_EMAIL`
- `NAHAMZZI_TOKEN_ENCRYPTION_KEY` (32-byte key, hex/base64)

Notes:
- `NAHAMZZI_TOKEN_ENCRYPTION_KEY`는 토큰 AES-GCM 저장 암호화에 필요합니다.
- `EXPO_PUBLIC_API_BASE_URL`이 없으면 앱은 일부 기념일/월간 일정 조회에서 로컬 fallback으로 동작할 수 있지만, 배포 환경에서는 서버 연결을 기준으로 검증해야 합니다.

## Deployment Checklist
배포 전 확인:
1. 환경 변수가 모두 설정되어 있는지 확인합니다.
2. DB 마이그레이션을 순서대로 적용합니다.
   - `infra/migrations/0001_schema.sql`
   - `infra/migrations/0002_rls_and_storage.sql`
   - `infra/migrations/0003_server_foundation.sql`
   - `infra/migrations/0004_anniversaries.sql`
   - `infra/migrations/0005_auth_sessions.sql`
   - `infra/migrations/0006_anniversaries_pg_alignment.sql`
   - `infra/migrations/0007_anniversary_details.sql`
   - `infra/migrations/0008_anniversary_delete_lock.sql`
   - `infra/migrations/0009_remove_study_anniversary_category.sql`
   - `infra/migrations/0010_relationship_category_and_edit_lock_alignment.sql`
3. 인증/세션 흐름을 확인합니다.
   - login success/failure
   - session validation
   - logout invalidates session
4. 기념일 정책을 확인합니다.
   - 일반 기념일만 수동 생성/수정/삭제 가능
   - `birthday`, `relationship`는 관리형 항목으로 수동 생성/수정/삭제 불가
   - 데모 사용자(`user-a`, `user-b`) 기준 생일/사귄날이 함께 조회됨
5. 월간 일정/홈 화면에서 기념일과 시험이 함께 보이는지 확인합니다.
6. 라우트 가드를 확인합니다.
   - unauthenticated -> login
   - authenticated -> app home

## Release Verification
실행:
- `npm --workspace services/functions run test`
- `npm --workspace services/functions run typecheck`
- `npm --workspace apps/mobile-web run typecheck`
- `npx vitest run --pool=vmThreads tests/routeGuards.test.ts` (`apps/mobile-web`에서 실행)

Manual QA log:
- `docs/qa/manual-regression-2026-03-11-anniversary-detail-storage.md`

Ops runbook:
- `docs/operations/runbook.md`

## Troubleshooting
- Windows 제한 셸에서 `spawn EPERM`이 발생하면:
  - 권한이 있는 터미널에서 다시 실행하거나
  - `BROWSER=none` 설정 후 Expo를 다시 실행합니다.
- 포트 충돌 시:
  - 다른 포트로 실행합니다. 예: `--port 8091`
- 한글 문자열이 깨지면:
  - 파일 인코딩이 `UTF-8`인지 먼저 확인합니다.
