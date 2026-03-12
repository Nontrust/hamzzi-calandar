# anniversary-calendar Specification

## Purpose
기념일이 홈 화면과 월간 일정에서 일관된 규칙으로 계산되고 표시되도록 정의한다.

## Requirements

### Requirement: 관계 기념일 마일스톤 계산
시스템은 `relationship` 기준일로부터 100일 단위 일정과 연 주년 일정을 계산해야 한다. (SHALL)

#### Scenario: 100일 기념일 계산
- **WHEN** 기준일이 `2024-03-23`인 `relationship` 항목이 존재한다
- **THEN** 시스템은 `2024-06` month-view에서 `100일` 항목을 반환한다

#### Scenario: 주년 계산
- **WHEN** 기준일이 `2024-03-23`인 `relationship` 항목이 존재한다
- **THEN** 시스템은 `2025-03` month-view에서 `1주년` 항목을 반환한다

### Requirement: 일반 기념일 반복 규칙
시스템은 일반 기념일에 대해 day-offset, monthly, yearly 규칙을 적용해야 한다. (SHALL)

#### Scenario: yearly 규칙 반영
- **WHEN** yearly 규칙의 기념일이 존재한다
- **THEN** 시스템은 같은 월/일이 포함된 month-view에 해당 항목을 반환한다

### Requirement: 달력 내 기념일 시각 구분
시스템은 달력/목록에서 기념일을 시험 및 공휴일과 구분되는 방식으로 표시해야 한다. (SHALL)

#### Scenario: 같은 날짜에 여러 항목 존재
- **WHEN** 같은 날짜에 시험과 기념일이 함께 존재한다
- **THEN** 시스템은 기념일 전용 점/라벨로 항목을 구분한다

### Requirement: 기념일 메타데이터 제공
시스템은 month-view와 선택 날짜 목록에서 기념일 카테고리, 알림 여부, 메모 요약, 규칙 타입을 함께 제공해야 한다. (SHALL)

#### Scenario: month-view 메타데이터 포함
- **WHEN** 클라이언트가 월간 일정을 조회한다
- **THEN** 시스템은 기념일 항목에 category, reminderEnabled, noteSummary, ruleType 메타데이터를 포함한다

### Requirement: 외부 실패와 분리된 내부 조회
시스템은 외부 공휴일 API가 실패해도 내부 기념일 데이터 조회를 유지해야 한다. (MUST)

#### Scenario: 공휴일 API 실패
- **WHEN** 공휴일 API 호출이 실패한다
- **THEN** 시스템은 내부 기념일 데이터와 month-view 렌더링을 계속 제공한다
