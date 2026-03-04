## Purpose
용어집 참조: `openspec/docs/glossary.md`

공기업 채용/시험 일정을 외부 Open API에서 안정적으로 수집하고 표준 이벤트로 정규화해 Google Calendar에 동기화한다. 목표는 일정 누락을 최소화하고 마감 대응을 자동화하는 것이다.

## Requirements
### Requirement: 정기 수집 실행
The system SHALL fetch recruitment and exam data from at least one configured Open API source on a recurring schedule.

#### Scenario: 정기 수집 트리거 실행
- **WHEN** 설정된 수집 시간이 도래한다
- **THEN** 시스템은 소스 API를 호출하고 응답 데이터를 수집 파이프라인으로 전달한다

### Requirement: 표준 스키마 매핑 및 중복 제거
The system SHALL map source fields into a canonical exam event model and deduplicate events by `(organization, title, apply period)`.

#### Scenario: 동일 공고 중복 수집
- **WHEN** 동일한 기관/제목/접수기간 조합의 일정이 중복 수집된다
- **THEN** 시스템은 중복을 제거하고 단일 표준 이벤트로 저장한다

### Requirement: 캘린더 업서트 및 실패 복구 상태
The system SHALL upsert calendar events for connected users and track per-event sync status including failure recovery state.

#### Scenario: 캘린더 API 호출 실패
- **WHEN** 캘린더 생성 또는 업데이트 호출이 실패한다
- **THEN** 시스템은 해당 이벤트 상태를 `failed`로 저장하고 재시도 가능한 상태로 표시한다
