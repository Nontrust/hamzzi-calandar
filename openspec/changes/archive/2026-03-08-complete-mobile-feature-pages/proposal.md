## Why

현재 앱은 공통 셸(사이드바/헤더)과 메뉴 라우트 골격은 갖췄지만, 메뉴별 페이지가 기능적으로 분리되지 않아 유지보수와 확장이 어렵다. 기능을 페이지 단위로 분리해 역할(홈/기념일/일정/설정) 책임을 명확히 하고, 이후 각 페이지 기능 고도화를 안전하게 진행할 수 있는 기준이 필요하다.

## What Changes

- 공통 앱 셸(사이드바/헤더/모바일 드로어) 기준으로 메뉴별 실제 페이지를 분리한다.
- 홈 페이지는 요약/빠른 진입 중심으로 정리하고, 기능 구현은 각 전용 페이지로 이동한다.
- 기념일 페이지에 기념일 CRUD 흐름을 집중 배치한다.
- 일정 페이지에 월간 타임라인/동기화 안내를 집중 배치한다.
- 설정 페이지에 권한 요청/계정 관련 조작(로그아웃 포함)을 집중 배치한다.
- 모바일(좁은 화면)에서 삼선 메뉴를 통해 동일한 메뉴 라우팅이 동작하도록 보장한다.

MVP 범위:
- 페이지 분리 및 메뉴 라우팅 일원화
- 각 페이지 최소 기능 이관(기념일/일정/설정)
- 기존 핵심 기능 회귀 없이 유지

Out of Scope:
- 신규 백엔드 API 추가
- 디자인 시스템 전면 개편
- 탭 네비게이션/딥링크 체계 재설계

## Capabilities

### New Capabilities
- `mobile-feature-pages`: 앱 셸 메뉴 기준으로 기능 페이지를 분리하고, 페이지별 책임과 핵심 기능 배치를 정의한다.

### Modified Capabilities
- `mobile-ui-shell`: 공통 셸이 실제 페이지 분리 구조를 전제로 동작하도록 요구사항을 확장한다.
- `mobile-route-separation`: 인증 후 라우트 구조에서 메뉴 단위 하위 페이지 경로 보장을 추가한다.

## Impact

- Affected code:
  - `apps/mobile-web/app/(app)/_layout.tsx`
  - `apps/mobile-web/app/(app)/index.tsx`
  - `apps/mobile-web/app/(app)/anniversaries.tsx`
  - `apps/mobile-web/app/(app)/schedule.tsx`
  - `apps/mobile-web/app/(app)/settings.tsx`
  - `apps/mobile-web/app/src/ui/appStyles.ts`
- Spec impact:
  - `openspec/specs/mobile-ui-shell/spec.md` (modified)
  - `openspec/specs/mobile-route-separation/spec.md` (modified)
  - `openspec/specs/mobile-feature-pages/spec.md` (new)
- Operational impact:
  - 모바일/웹 공통 내비게이션 검증 시나리오 추가 필요

추가 반영(2026-03-09):
- 홈 달력 월 이동 및 날짜별 일정 상세 확인 기능 포함
- API 미연결 시 로컬 폴백 동작(기념일/달력/기념일 CRUD) 포함
