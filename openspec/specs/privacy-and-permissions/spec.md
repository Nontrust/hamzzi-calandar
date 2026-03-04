## Purpose
용어집 참조: `openspec/docs/glossary.md`

개인 사진, 메모, 면접 대화/리포트 등 민감 데이터를 보호하고 최소 권한 원칙 기반의 권한 요청 흐름을 제공한다.

## Requirements
### Requirement: 민감 데이터 보호 통제
The system MUST apply sensitive-data protection controls when storing personal photos, notes, and interview records.

#### Scenario: 민감 사용자 데이터 저장
- **WHEN** 사용자가 사진, 개인 메모, 면접 기록을 저장한다
- **THEN** 시스템은 민감 데이터 보호 정책이 적용된 저장 경로로 기록한다

### Requirement: 사용자 요청 기반 전체 삭제
The system SHALL provide a confirmed hard-delete flow for full user data removal.

#### Scenario: 전체 데이터 삭제 확인
- **WHEN** 사용자가 전체 데이터 삭제를 확인한다
- **THEN** 시스템은 관련 데이터를 하드 삭제하고 완료 상태를 사용자에게 표시한다

### Requirement: 기능 단위 최소 권한 요청
The system SHALL request photo and calendar permissions only at the moment the corresponding feature is explicitly enabled by the user.

#### Scenario: 캘린더 동기화 최초 활성화
- **WHEN** 사용자가 처음으로 캘린더 동기화를 활성화한다
- **THEN** 시스템은 그 시점에만 캘린더 권한을 요청한다
