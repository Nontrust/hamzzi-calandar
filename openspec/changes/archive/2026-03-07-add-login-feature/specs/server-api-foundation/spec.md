## ADDED Requirements

### Requirement: 인증 오류 코드 표준화
시스템은 인증 관련 실패에 대해 표준 오류 코드를 사용해야 한다. (MUST)

#### Scenario: 자격 증명 불일치
- **WHEN** 로그인 요청의 자격 증명이 올바르지 않다
- **THEN** 시스템은 `success=false`와 `AUTH_INVALID_CREDENTIALS` 오류 코드를 반환해야 한다

#### Scenario: 세션 누락
- **WHEN** 인증이 필요한 API 요청에 세션 정보가 없다
- **THEN** 시스템은 `success=false`와 `AUTH_REQUIRED` 오류 코드를 반환해야 한다

### Requirement: 인증 검사 선행
시스템은 비즈니스 로직 실행 전에 인증 검사를 선행해야 한다. (MUST)

#### Scenario: 인증 실패 시 로직 미실행
- **WHEN** 인증이 실패한 요청이 보호 API에 도달한다
- **THEN** 시스템은 비즈니스 로직을 실행하지 않고 즉시 실패 응답을 반환해야 한다

### Requirement: 로그아웃 이후 세션 무효 응답
시스템은 무효화된 세션 요청에 대해 일관된 만료 오류를 반환해야 한다. (SHALL)

#### Scenario: 로그아웃 후 동일 세션 재사용
- **WHEN** 로그아웃 처리된 세션으로 API 요청이 들어온다
- **THEN** 시스템은 `AUTH_SESSION_EXPIRED` 오류 코드를 반환해야 한다