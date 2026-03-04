## Why

현재 `openspec/specs`에는 핵심 기능 요구사항이 정리되어 있지만, 이를 구현할 프로젝트 기본 구조와 기술 선택 기준이 확정되지 않았다. 지금 초기 아키텍처를 고정해야 이후 구현 단계에서 재작업 없이 일관되게 진행할 수 있다.

## What Changes

- 프로젝트 초기 기술 스택을 확정한다: `TypeScript`, `Expo (iOS + Web)`, `Supabase (Postgres/Auth/Storage/Edge Functions)`, `OpenAI Responses API`, `Google Calendar API`.
- 프로젝트 디렉터리 구조를 `apps/services/packages/infra` 기준으로 정의하고 역할을 명시한다.
- 인증/권한 기본 방침을 고정한다: 사용자 A/B 역할 기반 접근 제어 + RLS 정책 적용.
- 시험 일정 수집/동기화의 실패 대응 기준을 명시한다: 정기 실행, 중복 제거, 실패 상태 기록, 재시도.
- MVP에서 제외할 기술을 명시한다: ORM 이중화(`Prisma`)는 1차 범위에서 제외하고 Supabase 네이티브 운영을 우선한다.

## Capabilities

### New Capabilities
- `platform-foundation`: 현재 메인 스펙들을 구현하기 위한 프로젝트 초기 구조, 공통 런타임/데이터 계층, 권한/연동 기본 정책을 정의한다.

### Modified Capabilities
- 없음 (기존 `openspec/specs/*`의 기능 요구사항은 변경하지 않고, 구현 기반만 추가한다)

## Impact

- Affected code: 앱 초기화 코드베이스 전체(클라이언트, 서버 함수, 공통 패키지, 인프라 설정).
- Affected systems: Supabase(Auth/RLS/Storage/Postgres), OpenAI API, Google Calendar API.
- Dependencies: Expo SDK, Supabase client, Google API client, OpenAI SDK, 상태/검증 라이브러리(`TanStack Query`, `Zod`, `Zustand`).
- Breaking changes: 없음 (신규 초기화 작업).
- Out of Scope (MVP): 학습 플래너 자동 생성, 고급 큐/분산 처리, Prisma 도입.