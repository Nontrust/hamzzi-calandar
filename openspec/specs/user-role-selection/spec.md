## Purpose
용어집 참조: `openspec/docs/glossary.md`

앱 사용 시 사용자 A(관리자 성격)와 사용자 B(학습 실행자) 중 현재 사용자를 명시적으로 선택하고, 선택된 역할에 맞는 기능만 노출한다.
## Requirements
### Requirement: 사용자 역할 선택
The system SHALL allow selecting either 사용자 A or 사용자 B when entering the app.

#### Scenario: 앱 진입 시 역할 선택
- **WHEN** 사용자가 앱을 처음 실행하거나 활성 사용자가 없는 상태로 진입한다
- **THEN** 시스템은 사용자 A/B 선택 화면을 표시한다

### Requirement: 활성 사용자 상태 유지
The system SHALL persist and restore the selected active user profile across app restarts.

#### Scenario: 앱 재실행 후 이전 사용자 복원
- **WHEN** 사용자가 이전에 사용자 B를 선택한 뒤 앱을 재실행한다
- **THEN** 시스템은 사용자 B를 활성 사용자로 복원한다

### Requirement: 역할 기반 기능 접근 제어
The system MUST enforce feature visibility and edit permissions based on the active user role.

#### Scenario: 사용자 B의 관리자 기능 접근 제한
- **WHEN** 활성 사용자가 사용자 B인 상태에서 보상 콘텐츠 관리 화면 접근을 시도한다
- **THEN** 시스템은 해당 관리 기능 접근을 제한한다

#### Scenario: 사용자 A의 관리 기능 접근 허용
- **WHEN** 활성 사용자가 사용자 A인 상태에서 보상 콘텐츠 관리 화면에 진입한다
- **THEN** 시스템은 보상 업로드/수정 기능을 사용할 수 있게 한다

### Requirement: 역할 선택 화면 브랜드 라벨
시스템은 역할 의미를 보존하면서 역할 선택 라벨을 햄찌 브랜드 용어로 노출해야 한다. (SHALL)

#### Scenario: 역할 선택 화면 렌더링
- **WHEN** 사용자가 역할 선택 화면에 진입한다
- **THEN** 시스템은 `user A`와 `user B`를 햄찌 톤 노출명으로 표시한다

### Requirement: 역할 의미 보조 설명 유지
시스템은 브랜드 라벨별 보조 설명을 함께 노출해 기능 의미를 명확하게 유지해야 한다. (SHALL)

#### Scenario: 용어 이해가 필요한 사용자
- **WHEN** 사용자가 역할 라벨의 의미를 확인한다
- **THEN** 시스템은 해당 라벨이 어떤 권한/행동 범위를 의미하는지 함께 표시한다

