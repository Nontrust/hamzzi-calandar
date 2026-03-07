# user-auth Specification

## Purpose
TBD - created by archiving change add-login-feature. Update Purpose after archive.
## Requirements
### Requirement: 아이디 비밀번호 로그인
시스템은 아이디(또는 이메일)와 비밀번호를 이용한 로그인 절차를 제공해야 한다. (MUST)

#### Scenario: 로그인 성공
- **WHEN** 사용자가 유효한 아이디와 비밀번호를 입력하고 로그인 요청을 보낸다
- **THEN** 시스템은 인증을 성공 처리하고 세션을 발급해야 한다

#### Scenario: 로그인 실패
- **WHEN** 사용자가 잘못된 비밀번호 또는 존재하지 않는 아이디로 로그인 요청을 보낸다
- **THEN** 시스템은 로그인 실패를 반환하고 `AUTH_INVALID_CREDENTIALS` 오류 코드를 포함해야 한다

### Requirement: 세션 유지 및 만료
시스템은 로그인된 사용자 세션을 검증하고 만료된 세션을 차단해야 한다. (MUST)

#### Scenario: 유효 세션 검증
- **WHEN** 인증이 필요한 API 요청에 유효한 세션이 포함된다
- **THEN** 시스템은 요청을 인증된 사용자로 처리해야 한다

#### Scenario: 만료 세션 차단
- **WHEN** 만료된 세션으로 인증이 필요한 API 요청이 들어온다
- **THEN** 시스템은 요청을 거부하고 `AUTH_SESSION_EXPIRED` 오류 코드를 반환해야 한다

### Requirement: 로그아웃
시스템은 로그아웃 요청 시 해당 세션을 즉시 무효화해야 한다. (SHALL)

#### Scenario: 로그아웃 수행
- **WHEN** 로그인된 사용자가 로그아웃을 요청한다
- **THEN** 시스템은 세션을 무효화하고 이후 동일 세션 요청을 인증 실패로 처리해야 한다

### Requirement: 데모 계정 초기화
시스템은 개발/테스트 환경에서 데모 계정을 시드할 수 있어야 하며 비밀번호 평문을 저장소에 고정하지 않아야 한다. (MUST)

#### Scenario: 데모 계정 시드
- **WHEN** 개발 또는 테스트 환경에서 시드 절차가 실행된다
- **THEN** 시스템은 나햄찌/햄찌 메이트 계정을 생성하고 비밀번호 해시만 저장해야 한다

