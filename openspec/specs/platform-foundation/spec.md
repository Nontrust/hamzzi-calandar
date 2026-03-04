# platform-foundation Specification

## Purpose
TBD - created by archiving change project-init-aligned-with-current-specs. Update Purpose after archive.
## Requirements
### Requirement: Unified Workspace Structure
The system SHALL define and maintain a single monorepo workspace structure with `apps`, `services`, `packages`, and `infra` directories for implementation consistency.

#### Scenario: Initialize workspace layout
- **WHEN** 프로젝트 초기화 작업이 수행된다
- **THEN** 저장소에는 `apps/mobile-web`, `services/functions`, `packages/{domain,ui,config}`, `infra/{migrations,scheduler}` 구조가 생성된다

### Requirement: Supabase-Native Backend Baseline
The system SHALL use Supabase-native components (Postgres, Auth, Storage, Edge Functions) as the default backend baseline for MVP.

#### Scenario: Configure backend baseline
- **WHEN** 백엔드 초기 설정을 완료한다
- **THEN** 인증, 데이터 저장, 파일 저장, 서버 함수 실행 경로가 Supabase 서비스 기준으로 연결된다

### Requirement: Role-Based Access Enforcement
The system MUST enforce role-based access rules for 사용자 A and 사용자 B at both application and data layers.

#### Scenario: Restrict non-privileged role at data layer
- **WHEN** 사용자 B 권한으로 관리자 전용 데이터를 조회 또는 변경하려고 한다
- **THEN** 데이터 계층 정책(RLS)은 해당 요청을 거부한다

### Requirement: Integration Failure State Model
The system SHALL track integration processing states and failure recovery transitions for schedule ingestion and calendar synchronization.

#### Scenario: Transition to failed and retryable state
- **WHEN** 일정 수집 또는 캘린더 동기화 요청이 외부 오류로 실패한다
- **THEN** 시스템은 작업 상태를 `failed`로 기록하고 재시도 시 `pending`으로 전환할 수 있어야 한다

### Requirement: Server-Side AI Invocation Boundary
The system MUST execute AI interview generation and report creation through server-side functions, not direct client-side model calls.

#### Scenario: Submit interview turn from client
- **WHEN** 클라이언트가 면접 답변 턴을 전송한다
- **THEN** 서버 함수가 모델 호출을 수행하고 검증된 응답/리포트만 저장한다

