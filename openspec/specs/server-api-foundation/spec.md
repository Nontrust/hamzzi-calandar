# server-api-foundation Specification

## Purpose
TBD - created by archiving change server-foundation-hardening. Update Purpose after archive.
## Requirements
### Requirement: 서버 API 표준 응답 포맷
시스템은 모든 서버 API 응답에서 성공/실패를 동일 구조(`success`, `data`, `errorCode`, `errorMessage`, `requestId`)로 반환해야 하며, 기념일 CRUD/월조회 API에도 동일 규약을 강제해야 한다. (SHALL)

#### Scenario: 정상 요청 처리
- **WHEN** 클라이언트가 유효한 요청을 보낸다
- **THEN** 시스템은 `success=true`, `data`, `requestId`를 포함한 응답을 반환한다

#### Scenario: 예외 발생 처리
- **WHEN** 서버 내부 예외가 발생한다
- **THEN** 시스템은 `success=false`, 표준 `errorCode/errorMessage`, `requestId`를 포함한 응답을 반환한다

### Requirement: 서버 진입점 인증/권한 검증
시스템은 비즈니스 로직 실행 전에 사용자 인증과 역할 권한 검증을 수행해야 하며, 기념일 데이터 API는 사용자 소유권 검증을 추가로 수행해야 한다. (MUST)

#### Scenario: 권한 없는 요청
- **WHEN** 사용자 B가 관리자 전용 API를 호출한다
- **THEN** 시스템은 비즈니스 로직을 실행하지 않고 권한 거부 에러 코드를 반환한다

#### Scenario: 타인 데이터 접근 요청
- **WHEN** 사용자가 본인 소유가 아닌 기념일 레코드 식별자로 요청한다
- **THEN** 시스템은 요청을 거부하고 소유권 오류 코드를 반환한다

### Requirement: 요청 추적 ID와 감사 로그 연계
시스템은 각 요청에 추적 ID를 부여하고 주요 보안/권한 이벤트를 감사 로그로 기록해야 한다. (SHALL)

#### Scenario: 민감 API 접근
- **WHEN** 사용자가 민감 데이터 관련 API를 호출한다
- **THEN** 시스템은 요청 추적 ID와 함께 접근 결과를 감사 로그에 기록한다

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

