## Purpose
용어집 참조: `openspec/docs/glossary.md`

유튜브 뮤직 플레이리스트 링크를 빠르게 저장하고 실행하는 경량 기능을 제공해 학습 중 집중 보조 루틴을 지원한다.

## Requirements
### Requirement: 플레이리스트 링크 등록
The system SHALL allow users to register valid playlist URLs from `music.youtube.com` or `youtube.com` with optional name and memo.

#### Scenario: 유효한 링크 저장
- **WHEN** 사용자가 유효한 플레이리스트 URL을 입력하고 저장한다
- **THEN** 시스템은 링크와 메타데이터(이름, 메모)를 목록에 저장한다

### Requirement: 플레이리스트 링크 실행
The system SHALL open a saved playlist URL through an in-app browser or an external app.

#### Scenario: 저장된 링크 열기
- **WHEN** 사용자가 저장된 플레이리스트 항목을 탭한다
- **THEN** 시스템은 해당 링크 실행을 시도한다
