## Why

현재 기념일 추가 기능은 최소 필드만 저장되어, 기념일 성격(카테고리), 반복 규칙, 메모, 알림 설정 등 실제 사용에 필요한 정보를 충분히 담기 어렵다. 기념일 관리를 실사용 수준으로 올리기 위해 상세 정보 저장 구조를 명확히 확장해야 한다.

## What Changes

- 기념일 생성/수정 시 저장 가능한 상세 필드를 확장한다.
- 상세 필드의 입력/검증 규칙을 정의하고 누락/형식 오류를 방지한다.
- 상세 필드가 월간/일간 조회 응답에도 반영되도록 정렬/표시 기준을 정리한다.
- 기존 단순 데이터와의 호환을 위해 마이그레이션/기본값 전략을 정의한다.
- 외부 캘린더/공휴일 연동 실패 시에도 기념일 상세 데이터는 로컬/서버 기준으로 안정 조회되도록 한다.

## Capabilities

### New Capabilities
- 없음

### Modified Capabilities
- `anniversary-data-persistence`: 기념일 데이터 모델 및 CRUD 저장 규칙을 상세 필드 중심으로 확장
- `anniversary-calendar`: 확장된 기념일 상세 필드를 캘린더 조회/요약에 반영

## Impact

- Affected code:
  - `apps/mobile-web/src/anniversaryClient.ts`
  - `apps/mobile-web/app/(app)/anniversaries.tsx`
  - `apps/mobile-web/app/(app)/index.tsx`
  - `services/functions/src/handlers.ts`
  - `services/functions/src/anniversaryStore.ts`
  - `infra/migrations/*` (기념일 스키마 확장 필요 시)
- API 영향:
  - `/anniversaries` 요청/응답 페이로드 필드 확장
  - `/calendar/month-view` 응답 내 기념일 메타데이터 확장 가능
- Out of Scope:
  - 사용자 인증/권한 체계 변경
  - 외부 캘린더 공급자 신규 연동 추가
