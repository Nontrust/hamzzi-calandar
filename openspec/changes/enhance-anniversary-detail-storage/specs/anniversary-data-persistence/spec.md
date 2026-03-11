## ADDED Requirements

### Requirement: 기념일 상세 필드를 저장해야 한다
시스템은 기념일 생성/수정 시 기본 필드 외에 상세 필드를 저장해야 한다. The system MUST persist category, note, reminderEnabled, reminderOffsetDays, ruleType, and ruleValue.

#### Scenario: 상세 필드 포함 생성
- **WHEN** 사용자가 기념일 생성 요청에서 상세 필드를 함께 전송한다
- **THEN** 시스템은 상세 필드를 누락 없이 저장하고 응답에 동일 값을 반환한다

#### Scenario: 상세 필드 부분 수정
- **WHEN** 사용자가 기존 기념일의 메모/알림/반복 규칙 중 일부만 수정한다
- **THEN** 시스템은 변경된 필드만 반영하고 나머지 필드는 기존 값을 유지한다

### Requirement: 상세 필드 입력을 검증해야 한다
시스템은 상세 필드가 유효한 형식과 범위를 만족하는지 검증해야 한다. The system MUST reject invalid detail field combinations with explicit error codes.

#### Scenario: 반복 규칙 조합 오류
- **WHEN** 사용자가 허용되지 않은 ruleType/ruleValue 조합을 전송한다
- **THEN** 시스템은 요청을 거부하고 규칙 오류 코드를 반환한다

#### Scenario: 메모 길이 초과
- **WHEN** 사용자가 허용 길이를 초과한 메모를 전송한다
- **THEN** 시스템은 요청을 거부하고 필드 검증 오류를 반환한다

### Requirement: 기존 데이터와 호환되어야 한다
시스템은 과거 단순 필드 기반 기념일 데이터도 조회/수정 가능해야 한다. The system MUST apply compatible defaults for missing detail fields.

#### Scenario: 기존 레코드 조회
- **WHEN** 상세 필드가 없는 기존 기념일 레코드를 조회한다
- **THEN** 시스템은 정의된 기본값을 채운 형태로 응답한다

#### Scenario: 기존 레코드 수정
- **WHEN** 사용자가 기존 레코드를 수정하면서 상세 필드를 추가한다
- **THEN** 시스템은 레코드를 상세 필드 포함 구조로 정상 저장한다
