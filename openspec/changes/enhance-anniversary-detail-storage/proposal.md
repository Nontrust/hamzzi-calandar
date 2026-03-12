## Why

기념일 데이터는 이제 단순한 이름/날짜 저장을 넘어서 카테고리, 메모, 알림, 반복 규칙, 공유 표시 규칙까지 함께 다뤄야 합니다. 특히 `birthday`와 `relationship`는 관리형 항목으로 고정되고, 일반 기념일만 수동 편집 가능한 정책이 필요했습니다. 이 변경은 서버 저장 구조와 클라이언트 표시 규칙을 확장해 현재 앱 동작을 문서화합니다.

## What Changes

- 기념일 상세 필드(`category`, `note`, `reminderEnabled`, `reminderOffsetDays`, `ruleType`, `ruleValue`)를 저장/조회 구조에 포함합니다.
- `birthday`, `relationship`, `anniversary`, `other` 카테고리 체계를 사용합니다.
- `birthday`와 `relationship`는 관리형 항목으로 수동 생성/수정/삭제를 차단합니다.
- 데모 사용자(`user-a`, `user-b`) 기준 생일/사귄날은 함께 조회되도록 공유 표시 규칙을 적용합니다.
- `relationship`는 월간 일정에서 100일 단위와 연 주년 일정을 자동 생성합니다.
- 서버 실패 시에도 로컬 fallback으로 기념일/월간 일정 조회가 유지되도록 합니다.

## Capabilities

### New Capabilities
- 없음

### Modified Capabilities
- `anniversary-data-persistence`: 상세 필드 저장, 관리형 카테고리 잠금, 공유 조회 규칙 반영
- `anniversary-calendar`: 월간 일정 메타데이터, 100일/주년 마일스톤, 메인/목록 표시 규칙 반영

## Impact

- Affected code:
  - `apps/mobile-web/src/anniversaryClient.ts`
  - `apps/mobile-web/app/(app)/anniversaries.tsx`
  - `apps/mobile-web/app/(app)/index.tsx`
  - `apps/mobile-web/app/(app)/schedule.tsx`
  - `services/functions/src/handlers.ts`
  - `services/functions/src/anniversaryStore.ts`
  - `infra/migrations/0007` ~ `0010`
- API impact:
  - `/anniversaries`: 상세 필드와 관리형 카테고리 잠금 에러 코드 반영
  - `/calendar/month-view`: 기념일 메타데이터와 관계 마일스톤 반영
- Out of Scope:
  - 인증/권한 체계 자체 변경
  - 외부 캘린더 양방향 동기화 확장
