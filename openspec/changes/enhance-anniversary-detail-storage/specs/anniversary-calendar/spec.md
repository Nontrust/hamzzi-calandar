## ADDED Requirements

### Requirement: 캘린더 조회에 기념일 상세 정보를 반영해야 한다
시스템은 월간/일간 캘린더 조회 시 기념일 상세 정보를 함께 제공해야 한다. The system MUST include anniversary detail metadata in calendar-facing payloads when available.

#### Scenario: 월간 조회 상세 반영
- **WHEN** 사용자가 특정 월 캘린더를 조회한다
- **THEN** 시스템은 기념일 항목에 카테고리/알림 여부/반복 정보 등 상세 메타를 포함한다

#### Scenario: 상세 정보 없는 항목 조회
- **WHEN** 상세 필드가 비어 있는 기념일이 캘린더에 포함된다
- **THEN** 시스템은 기본값 기준 메타데이터를 제공해 UI 표시가 깨지지 않도록 한다

### Requirement: 외부 연동 실패와 분리되어야 한다
시스템은 외부 공휴일/캘린더 연동 실패와 무관하게 내부 기념일 상세 데이터 조회를 유지해야 한다. The system MUST continue serving anniversary detail data even if external calendar sync fails.

#### Scenario: 외부 공휴일 API 실패
- **WHEN** 공휴일 API 호출이 실패한다
- **THEN** 시스템은 기념일 상세 데이터는 정상 반환하고 외부 연동 실패만 별도로 처리한다
