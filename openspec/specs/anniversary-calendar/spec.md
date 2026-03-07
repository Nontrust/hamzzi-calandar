# anniversary-calendar Specification

## Purpose
TBD - created by archiving change hamjji-kitsch-brand-terminology. Update Purpose after archive.
## Requirements
### Requirement: 기념일 계산기 기준 규칙
시스템은 사용자가 입력한 기준일을 바탕으로 D+N, 월 단위, 연 단위 기념일을 계산해야 한다. (SHALL)

#### Scenario: 100일 기념일 계산
- **WHEN** 사용자가 기준일과 100일 기념일 계산을 요청한다
- **THEN** 시스템은 기준일을 포함한 계산 규칙에 따라 100일 기념일 날짜를 반환한다

#### Scenario: 월/연 반복 기념일 계산
- **WHEN** 사용자가 월 반복 또는 연 반복 기념일을 등록한다
- **THEN** 시스템은 반복 주기에 맞는 다음 기념일 날짜를 계산한다

### Requirement: 윤년/말일 보정 처리
시스템은 윤년과 월말 날짜에서 발생하는 계산 경계 케이스를 일관된 규칙으로 처리해야 한다. (SHALL)

#### Scenario: 2월 29일 기준일 처리
- **WHEN** 기준일이 2월 29일이고 다음 해 기념일을 계산한다
- **THEN** 시스템은 정의된 보정 규칙에 따라 유효한 날짜로 변환한다

#### Scenario: 31일 기준 월 반복 처리
- **WHEN** 기준일이 31일이고 다음 달에 31일이 존재하지 않는다
- **THEN** 시스템은 해당 월의 마지막 날짜로 보정해 기념일을 계산한다

### Requirement: 달력 내 기념일 시각 구분
시스템은 달력에서 기념일을 일반 일정과 구분되는 방식으로 표기해야 한다. (SHALL)

#### Scenario: 동일 날짜 복수 항목 표시
- **WHEN** 같은 날짜에 일반 일정과 기념일이 함께 존재한다
- **THEN** 시스템은 기념일 전용 뱃지/점표시를 사용해 항목을 구분한다

### Requirement: 기념일 제목 및 보조 정보 표기
시스템은 기념일 제목을 `기념일명 · D+N` 형식으로 노출하고 남은/지난 일수 정보를 함께 제공해야 한다. (SHALL)

#### Scenario: 기념일 상세 확인
- **WHEN** 사용자가 달력에서 기념일 항목을 선택한다
- **THEN** 시스템은 제목, 기준일, 오늘 기준 D-Day 정보를 이해 가능한 문구로 표시한다

