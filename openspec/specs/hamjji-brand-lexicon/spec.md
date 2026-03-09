# hamjji-brand-lexicon Specification

## Purpose
TBD - created by archiving change hamjji-kitsch-brand-terminology. Update Purpose after archive.
## Requirements
### Requirement: 햄찌 브랜드 용어집 관리
시스템은 내부 식별자를 사용자 노출용 키치 라벨로 매핑하는 중앙 용어집을 제공해야 한다. (SHALL)

#### Scenario: 내부 키와 노출명 매핑 조회
- **WHEN** 화면이 브랜드 용어 키(`role.userA`, `event.date`)를 조회한다
- **THEN** 시스템은 용어집에서 대응되는 노출 문구를 반환한다

### Requirement: 톤 안전 가이드 적용
시스템은 사용자 노출 문구에서 비하/모욕 표현을 차단하는 톤 안전 규칙을 강제해야 한다. (SHALL)

#### Scenario: 금지어 포함 문구 등록 시도
- **WHEN** 운영자가 금지어가 포함된 문구를 등록하려고 한다
- **THEN** 시스템은 저장을 거부하고 가이드 위반 사유를 표시한다

### Requirement: 기본 용어 fallback 보장
시스템은 키치 라벨이 비어 있거나 비활성화된 경우 기본 라벨로 fallback 해야 한다. (SHALL)

#### Scenario: 키치 라벨 누락
- **WHEN** 특정 키의 키치 라벨이 비어 있다
- **THEN** 시스템은 기본 용어 라벨을 대신 노출한다

### Requirement: Brand wording must stay consistent on top heroes
The system MUST present consistent top-hero wording aligned with product tone across key pages.

#### Scenario: Home wording
- **WHEN** the user opens the home page
- **THEN** the hero shows the approved home phrase and summary copy

#### Scenario: Feature page wording
- **WHEN** the user opens anniversaries, schedule, or settings
- **THEN** each page shows a page-specific hero phrase with consistent tone

