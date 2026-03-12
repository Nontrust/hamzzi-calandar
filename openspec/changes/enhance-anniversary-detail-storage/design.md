## Context

기념일 기능은 서버 저장, 월간 일정 렌더링, 홈 화면 요약, 로컬 fallback이 모두 연결된 cross-cutting 변경입니다. 현재 구현은 상세 필드 저장뿐 아니라 카테고리 잠금 정책, 공유 조회 규칙, 관계 마일스톤 생성까지 포함합니다.

## Goals / Non-Goals

**Goals**
- 기념일 상세 필드를 CRUD와 월간 조회에 반영한다.
- `birthday`, `relationship`를 관리형 카테고리로 고정한다.
- 데모 사용자 기준 공유 생일/사귄날을 함께 조회한다.
- `relationship`의 100일/주년 일정을 월간 뷰에서 자동 생성한다.
- 서버 실패 시 로컬 fallback으로 조회를 유지한다.

**Non-Goals**
- 인증/세션 모델 변경
- 외부 캘린더 쓰기 연동 추가
- 대규모 UI 리디자인

## Decisions

1. 상세 필드 구조 고정
- `name`, `baseDate` 외에 `category`, `note`, `reminderEnabled`, `reminderOffsetDays`, `ruleType`, `ruleValue`를 저장합니다.
- 서버와 클라이언트는 동일 필드 구조를 사용합니다.

2. 관리형 카테고리 잠금
- `birthday`, `relationship`는 기본/공유 항목 성격이 강하므로 수동 생성/수정/삭제를 막습니다.
- 일반 사용자가 관리할 수 있는 카테고리는 `anniversary`, `other`로 제한합니다.

3. 공유 조회 규칙
- 데모 사용자 `user-a`, `user-b`는 서로의 공유 기념일을 함께 조회합니다.
- 공유 대상은 현재 `birthday`, `relationship`입니다.

4. 관계 마일스톤 계산
- `relationship`는 100일 단위 일정과 같은 월/일의 `N주년`을 월간 뷰에 추가합니다.
- 일반 기념일은 `ruleType`에 따라 day-offset, monthly, yearly 계산을 유지합니다.

5. 서버 우선 + 로컬 fallback
- 서버 응답을 우선 사용합니다.
- `EXTERNAL_SYNC_FAILED` 시 로컬 저장소와 기본 fallback 데이터를 사용합니다.

## Risks / Trade-offs

- 관리형 카테고리 잠금으로 직접 생성 UX는 단순해지지만 유연성은 줄어듭니다.
- 공유 조회는 데모 사용자 전용 규칙이라 추후 실제 사용자 모델로 확장 시 재설계가 필요합니다.
- 로컬 fallback은 오프라인 UX를 보완하지만 서버 상태와 일시적으로 어긋날 수 있습니다.

## Migration Plan

1. 상세 필드 마이그레이션 적용 (`0007`)
2. 삭제 잠금 컬럼 및 기본 데이터 반영 (`0008`)
3. `study` 카테고리 제거 (`0009`)
4. `relationship` 카테고리와 수정 잠금 정렬 (`0010`)
5. 서버/클라이언트/QA 문서를 같은 정책으로 정리

## Open Questions

- 공유 규칙을 데모 사용자 전용이 아닌 일반 사용자 모델로 확장할지?
- 관리형 항목의 생성 경로를 별도 관리자 작업으로 둘지?
- 관계 마일스톤 상한(현재 50000일)을 설정 파일로 뺄지?
