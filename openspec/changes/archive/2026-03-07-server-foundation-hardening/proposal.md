## Why

현재 프로젝트는 기능 구현을 시작할 수 있는 기본 구조는 갖췄지만, 차후 확장에서 핵심이 되는 서버사이드 기준(인증 경계, 외부 연동 토큰 보호, 작업 재시도, 공통 에러/로깅 규약)이 스펙 수준에서 충분히 고정되어 있지 않다. 지금 서버 기초를 먼저 정리해두면 기념일/캘린더/AI 기능 확장 시 재작업 비용과 보안 리스크를 크게 줄일 수 있다.

## What Changes

- Edge Functions 기반 서버사이드 공통 계층(BFF) 기준을 정의한다.
- 인증/권한 검증, 공통 에러 응답, 요청 추적 ID, 감사 로그 정책을 표준화한다.
- 외부 연동 토큰(예: Calendar OAuth) 저장/갱신/폐기 규칙을 명시한다.
- 동기화/수집 작업의 재시도, 백오프, 실패 복구 상태 전이 정책을 명시한다.
- 클라이언트 계산 로직과 서버 책임 경계를 분리해 기능 확장 시 일관성을 보장한다.
- Out of Scope (MVP): 멀티 리전, 고급 큐 인프라 교체(Kafka 등), 완전한 마이크로서비스 분리.

## Capabilities

### New Capabilities
- `server-api-foundation`: Edge Functions 공통 API 규약(인증/에러/추적/로깅)과 핸들러 구조를 정의한다.
- `external-token-lifecycle`: 외부 연동 토큰의 저장/암호화/갱신/폐기 정책과 실패 대응을 정의한다.
- `job-retry-orchestration`: 수집/동기화 작업의 재시도, 백오프, 실패 복구 상태 전이를 정의한다.

### Modified Capabilities
- `platform-foundation`: 서버 경계 우선 아키텍처(클라이언트 vs 서버 책임 분리) 요구사항을 강화한다.
- `privacy-and-permissions`: 서버단 권한 검증 및 감사 로그 요구사항을 추가한다.
- `exam-schedule-integration`: 캘린더 연동 실패 시 서버단 재시도/복구 정책을 명시적으로 확장한다.

## Impact

- Affected code: `services/functions/*`, `infra/migrations/*`, 공통 타입/에러 포맷 모듈.
- Affected systems: Supabase Edge Functions, Postgres(RLS/감사로그), 외부 Calendar API 연동 계층.
- Dependencies: OAuth 시크릿 관리, 스케줄러/잡 실행 환경, 관측(로그/메트릭) 규약.
- External integration note: 외부 API 실패 시 서버는 재시도 가능한 상태를 기록하고, 클라이언트에는 의미가 명확한 실패 코드/복구 안내를 반환해야 한다.
