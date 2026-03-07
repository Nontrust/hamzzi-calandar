## Purpose
용어집 참조: `openspec/docs/glossary.md`

대화형 AI 모의면접을 통해 사용자 B의 답변 구조화 능력과 직무 적합성 표현을 강화하고, 종료 후 개선 가능한 리포트를 제공한다.
## Requirements
### Requirement: 모드/페르소나 사전 설정
The system SHALL allow users to configure interview mode and interviewer persona before starting a session.

#### Scenario: 선택한 설정으로 면접 시작
- **WHEN** 사용자가 모드와 페르소나를 선택해 면접을 시작한다
- **THEN** 시스템은 선택된 설정을 세션 메타데이터로 저장한다

### Requirement: 순차 질문 진행
The system SHALL conduct interviews one main question at a time and provide one to two follow-up questions after each user answer.

#### Scenario: 사용자 답변 이후 진행
- **WHEN** 사용자가 답변을 제출한다
- **THEN** 시스템은 맥락에 맞는 꼬리질문 1~2개 또는 다음 메인 질문 1개를 제시한다

### Requirement: 구조화된 종료 리포트 생성
The system MUST generate and persist an end-of-session report containing strengths, improvement points, an improved sample answer, and expected follow-up questions.

#### Scenario: 면접 종료 요청
- **WHEN** 사용자가 면접 종료를 요청한다
- **THEN** 시스템은 필수 리포트 필드를 모두 포함한 결과를 저장한다

### Requirement: 면접 모드/리포트 헤더 브랜드화
시스템은 면접 모드 라벨과 리포트 헤더를 브랜드 용어집 기준으로 노출해야 한다. (SHALL)

#### Scenario: 면접 리포트 상단 표시
- **WHEN** 면접 종료 후 리포트를 렌더링한다
- **THEN** 시스템은 용어집 매핑 기반 브랜드 헤더를 노출한다

### Requirement: 피드백 문구 톤 가이드 준수
시스템은 면접 피드백 문구에 톤 안전 규칙과 의미 명확성 규칙을 적용해야 한다. (SHALL)

#### Scenario: 피드백 문구 생성
- **WHEN** 강점/보완점 문구를 생성한다
- **THEN** 시스템은 귀여운 톤을 유지하되 비하 표현 없이 명확한 개선 정보를 제공한다

