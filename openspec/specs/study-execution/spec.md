## Purpose
용어집 참조: `openspec/docs/glossary.md`

스터디 실행의 핵심 루프(세션 시작/종료, TODO 완료 처리, 미달성 이월, 달성률 계산)를 일관된 규칙으로 관리한다. 목표는 사용자 B가 매일 같은 흐름으로 학습을 기록하고 다음 액션으로 자연스럽게 이어가게 만드는 것이다.
## Requirements
### Requirement: 세션 시작/종료 기록
The system SHALL record session start and finish actions with timestamps and lifecycle state.

#### Scenario: TODO 계획과 함께 세션 시작
- **WHEN** 사용자 B가 세션 시작을 누르고 오늘의 TODO를 입력한다
- **THEN** 시스템은 `running` 세션을 생성하고 시작 시각을 저장한다

#### Scenario: 완료 상태를 반영해 세션 종료
- **WHEN** 사용자 B가 세션 종료를 누르고 TODO 완료 여부를 확정한다
- **THEN** 시스템은 종료 시각과 TODO 상태를 저장하고 세션 상태를 `finished`로 전환한다

### Requirement: 세션 달성률 계산
The system SHALL compute and persist session achievement rate using `(completed TODO count / total TODO count) * 100`.

#### Scenario: 일부 완료 상태의 달성률 계산
- **WHEN** 전체 TODO 5개 중 3개가 완료된 상태로 세션이 종료된다
- **THEN** 시스템은 달성률 60을 계산해 세션 결과에 저장한다

### Requirement: 미달성 TODO 이월
The system SHALL allow users to reschedule not-done TODO items to tomorrow or a user-selected date in a single flow.

#### Scenario: 미달성 TODO를 내일로 이월
- **WHEN** 사용자가 미달성 TODO를 내일로 이월한다
- **THEN** 시스템은 해당 TODO의 목표 날짜를 다음 날로 변경한다

#### Scenario: 미달성 TODO를 지정 날짜로 이월
- **WHEN** 사용자가 달력에서 특정 날짜를 선택해 이월한다
- **THEN** 시스템은 해당 TODO의 목표 날짜를 선택한 날짜로 변경한다

### Requirement: 세션/달성률 키치 문구 노출
시스템은 세션/TODO/달성률 라벨을 용어집 기반 키치 문구로 노출해야 한다. (SHALL)

#### Scenario: 세션 화면 상태 문구 표시
- **WHEN** 세션 화면의 핵심 라벨을 표시한다
- **THEN** 시스템은 `집중 타임`, `오늘 할일`, `오늘 달성률` 문구를 노출한다

### Requirement: 의미 보존형 상태 표기
시스템은 키치 라벨을 사용하더라도 달성률/상태의 기능 의미를 함께 전달해야 한다. (SHALL)

#### Scenario: 달성률 결과 확인
- **WHEN** 사용자가 달성률 결과를 본다
- **THEN** 시스템은 키치 문구와 함께 퍼센트/상태 의미를 명확히 전달한다

