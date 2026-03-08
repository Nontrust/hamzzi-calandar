## MODIFIED Requirements

### Requirement: 인증 후 하위 기능 라우트 보장
시스템은 인증된 사용자에 대해 홈 단일 경로뿐 아니라 기능별 하위 경로(`/anniversaries`, `/schedule`, `/settings`) 접근을 보장해야 한다. (MUST)

#### Scenario: 인증된 사용자의 하위 경로 접근
- **WHEN** 인증된 사용자가 기능 하위 경로로 직접 진입한다
- **THEN** 시스템은 로그인 경로로 되돌리지 않고 해당 기능 페이지를 렌더링해야 한다

#### Scenario: 미인증 사용자의 하위 경로 접근
- **WHEN** 미인증 사용자가 기능 하위 경로로 진입한다
- **THEN** 시스템은 로그인 페이지로 리다이렉트해야 한다
