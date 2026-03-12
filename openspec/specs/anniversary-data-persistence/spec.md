# anniversary-data-persistence Specification

## Purpose
기념일 데이터를 서버 저장소 기준으로 일관되게 생성, 조회, 갱신하고 월간 일정 응답에 포함하기 위한 요구사항을 정의한다.

## Requirements

### Requirement: 기념일 서버 영구 저장
시스템은 기념일 데이터를 서버 저장소에 생성, 조회, 수정, 삭제할 수 있어야 한다. (SHALL)

#### Scenario: 일반 기념일 생성 성공
- **WHEN** 사용자가 `anniversary` 또는 `other` 카테고리로 기념일 생성을 요청한다
- **THEN** 시스템은 영구 저장소에 레코드를 생성하고 식별자를 반환한다

#### Scenario: 일반 기념일 수정/삭제
- **WHEN** 사용자가 일반 기념일을 수정하거나 삭제한다
- **THEN** 시스템은 레코드를 갱신하거나 비활성화하고 결과를 반환한다

### Requirement: 관리형 카테고리 잠금
시스템은 `birthday`와 `relationship`를 관리형 카테고리로 취급하고 수동 생성, 수정, 삭제를 차단해야 한다. (MUST)

#### Scenario: 관리형 카테고리 생성 차단
- **WHEN** 사용자가 `birthday` 또는 `relationship` 카테고리 생성을 요청한다
- **THEN** 시스템은 요청을 거부하고 잠금 오류 코드를 반환한다

#### Scenario: 관리형 항목 수정/삭제 차단
- **WHEN** 사용자가 기존 `birthday` 또는 `relationship` 항목을 수정하거나 삭제하려고 한다
- **THEN** 시스템은 요청을 거부하고 잠금 오류 코드를 반환한다

### Requirement: 공유 기념일 조회
시스템은 데모 사용자 `user-a`, `user-b`에 대해 공유 카테고리(`birthday`, `relationship`)를 함께 조회해야 한다. (SHALL)

#### Scenario: 공유 생일 목록 조회
- **WHEN** `user-a` 또는 `user-b`가 기념일 목록을 조회한다
- **THEN** 시스템은 두 사용자의 공유 생일/사귄날 항목을 함께 반환한다

### Requirement: 월 단위 기념일 조회 API
시스템은 월 기준으로 기념일 목록을 정렬해 반환하는 API를 제공해야 한다. (SHALL)

#### Scenario: 월간 조회 요청
- **WHEN** 클라이언트가 특정 `YYYY-MM` 월의 month-view를 요청한다
- **THEN** 시스템은 해당 월에 해당하는 기념일 항목을 정렬해 반환한다

### Requirement: 입력 검증과 표준 오류 코드
시스템은 기념일 입력값을 서버에서 검증하고 실패 시 표준 오류 코드를 반환해야 한다. (MUST)

#### Scenario: 잘못된 날짜 형식
- **WHEN** 사용자가 유효하지 않은 날짜 형식으로 저장을 요청한다
- **THEN** 시스템은 요청을 거부하고 `VALIDATION_ERROR`를 반환한다
