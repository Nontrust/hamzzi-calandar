## Purpose
용어집 참조: `openspec/docs/glossary.md`

달성률 기반 추억 보상 시스템(사진/문구 잠금 해제)을 명확한 규칙으로 운영해 학습 동기와 성취 피드백을 강화한다.

## Requirements
### Requirement: 보상 잠금 상태 가시화
The system SHALL display all reward items with explicit lock state and unlock criteria.

#### Scenario: 잠금된 보상 항목 조회
- **WHEN** 사용자가 추억 보관함에 진입한다
- **THEN** 시스템은 잠금 상태와 현재 달성률/목표 달성률을 함께 표시한다

### Requirement: 일일 해금 조건 판정
The system SHALL unlock eligible rewards when daily achievement rate is greater than or equal to the configured threshold.

#### Scenario: 일일 임계치 충족
- **WHEN** 일일 달성률이 임계치 이상으로 계산된다
- **THEN** 시스템은 당일 해금 가능한 보상을 규칙 범위 내에서 해금한다

### Requirement: 해금 무결성 제어
The system MUST enforce per-day unlock limits and prevent duplicate unlock for the same reward item.

#### Scenario: 일일 해금 한도 도달
- **WHEN** 사용자가 당일 해금 한도에 도달한 상태에서 추가 해금을 시도한다
- **THEN** 시스템은 추가 해금을 차단하고 제한 상태를 표시한다
