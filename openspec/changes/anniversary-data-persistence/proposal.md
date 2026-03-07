## Why

현재 기념일 기능은 계산/표시 로직 중심이라 앱 재설치, 기기 변경, 다중 디바이스 사용 시 데이터가 안정적으로 유지되지 않는다. 사용자별 기념일 데이터를 서버에 영구 저장하고 달력 API로 일관되게 조회할 수 있어야 차후 알림/공유/통계 기능까지 확장할 수 있다.

## What Changes

- 기념일 CRUD(생성/조회/수정/삭제) 서버 API를 도입한다.
- 기념일 데이터 모델(`anniversaries`)과 인덱스/정합성 제약을 추가한다.
- 월 단위 달력 조회 API에서 일반 일정 + 기념일을 통합 반환한다.
- 사용자 소유권 기반 접근 제어(본인 데이터만 접근)와 감사 로그를 강화한다.
- Out of Scope (MVP): 커플 간 실시간 공유 충돌 해결, 다국어 알림 템플릿, 고급 반복 규칙(RRULE 전체).

## Capabilities

### New Capabilities
- `anniversary-data-persistence`: 기념일 데이터의 서버 영구 저장, CRUD API, 월 단위 조회를 정의한다.

### Modified Capabilities
- `anniversary-calendar`: 로컬 계산 중심에서 서버 저장 데이터 기반 조회/표시로 요구사항을 확장한다.
- `server-api-foundation`: 기념일 CRUD API의 표준 응답/오류/추적 ID 규약을 적용하도록 확장한다.
- `privacy-and-permissions`: 기념일 데이터의 사용자 소유권 검증 및 접근 통제 요구사항을 추가한다.

## Impact

- Affected code: `services/functions` 핸들러/타입/검증 로직, `infra/migrations` 스키마, 앱 달력 조회 경로.
- Affected systems: Supabase Postgres(RLS), Edge Functions, 달력 월 뷰 데이터 결합 경로.
- Dependencies: 인증 컨텍스트(user_id), 감사 로그 정책, 기존 일정 동기화 상태 모델.
- External integration note: 캘린더 외부 연동 실패와 별개로 기념일 CRUD는 내부 저장소 기준으로 안정적으로 동작해야 하며, 실패 시 표준 에러 코드와 복구 안내를 반환해야 한다.
