## Context

현재 변경안의 목표는 기존 capability 스펙들을 구현 가능한 형태로 프로젝트 기반을 고정하는 것이다. 구현 대상은 모바일(iOS) 우선이지만 웹(노트북) 대응도 필요하며, 사용자 A/B 역할 분기, 시험 일정 외부 연동, AI 모의면접, 민감 데이터 보호까지 포함한다. 

현 상태에서의 핵심 제약은 다음과 같다.
- 단일 코드베이스로 iOS + web을 빠르게 제공해야 한다.
- 데이터 접근 제어는 역할 기반으로 강제되어야 한다.
- 외부 연동(Open API, Google Calendar, OpenAI)은 실패 가능성을 전제로 설계해야 한다.
- MVP에서는 개발 속도와 운영 단순성이 우선이며, 과도한 인프라(별도 큐/ORM 이중화)는 지양한다.

## Goals / Non-Goals

**Goals:**
- `TypeScript + Expo + Supabase` 기반의 초기 프로젝트 구조를 확정한다.
- 사용자 A/B 역할 선택과 역할 기반 접근 제어를 데이터 계층(RLS)까지 연결한다.
- 시험 일정 수집/정규화/중복 제거/캘린더 동기화 파이프라인의 표준 상태 모델을 정의한다.
- AI 모의면접 요청/응답 및 종료 리포트 저장 흐름을 표준화한다.
- 예외/실패 처리(권한 거부, 연동 실패, 재시도)를 공통 규칙으로 정의한다.

**Non-Goals:**
- 학습 플래너 자동 생성 기능 구현
- 고급 분산 큐 도입(예: 별도 메시지 브로커)
- Prisma 도입 및 ORM 추상화 계층 구축
- 멀티테넌트/엔터프라이즈급 운영 요구사항 반영

## Decisions

### 1) 런타임/플랫폼 결정: Expo(React Native + Web)
- 결정: 클라이언트는 `Expo` 단일 앱으로 시작한다.
- 이유: iOS 우선 + web 대응 요구를 빠르게 충족하며 초기 개발/배포 복잡도를 낮춘다.
- 대안:
  - React Native + Next.js 분리: 플랫폼별 최적화는 유리하지만 MVP에서 중복 구현 비용이 크다.
  - Flutter: 가능하지만 팀/생태계 전환 비용이 발생한다.

### 2) 백엔드 결정: Supabase 네이티브 우선
- 결정: `Supabase (Postgres/Auth/Storage/Edge Functions)`를 기본 백엔드로 사용한다.
- 이유: 인증, 데이터베이스, 스토리지, 서버 함수가 통합되어 초기 구축 속도가 빠르다.
- 대안:
  - Node API + 자체 Postgres: 유연하지만 초기 인프라 작업량이 증가한다.
  - Prisma 병행: 타입 안정성 장점은 있으나 MVP에서 마이그레이션 경로 이중화 리스크가 있다.

### 3) 접근 제어 모델: 역할 기반 + RLS 강제
- 결정: 사용자 A/B 역할을 `active profile`로 선택하고, 서버 저장 데이터 접근은 RLS로 제한한다.
- 이유: UI 분기만으로는 권한 우회를 막을 수 없으므로 데이터 계층에서 강제 필요.
- 대안:
  - 클라이언트 분기만 적용: 구현은 빠르나 보안 경계가 약함.

### 4) 일정 연동 파이프라인: 배치 수집 + 업서트 + 상태 추적
- 결정: 정기 수집(job) -> 표준 스키마 매핑 -> 중복 제거 -> 캘린더 업서트 순으로 처리한다.
- 이유: 스펙의 `exam-schedule-integration` 요구사항(중복 제거/실패 복구/동기화 상태)을 충족한다.
- 상태 전이 규칙:
  - `not_connected` -> `pending` (캘린더 연동 활성화)
  - `pending` -> `synced` (생성/업데이트 성공)
  - `pending` -> `failed` (API 실패)
  - `failed` -> `pending` (재시도 요청)

### 5) AI 인터뷰 아키텍처: 서버 함수 중계 + 구조화 리포트 저장
- 결정: 클라이언트가 직접 모델 호출하지 않고 서버 함수에서 `OpenAI Responses API`를 호출한다.
- 이유: API 키 보호, 프롬프트 정책 통제, 리포트 포맷 표준화가 용이하다.
- 대안:
  - 클라이언트 직접 호출: 키/정책 노출 리스크.

### 6) 권한 요청 정책: 기능 단위 지연 요청
- 결정: 캘린더/사진/생체인증 권한은 기능 진입 시점에만 요청한다.
- 이유: 최소 권한 원칙과 사용자 거부 시 복구 UX 설계가 쉽다.
- 대안:
  - 앱 시작 시 일괄 요청: 거부율과 이탈 위험 증가.

### 프로젝트 구조 결정
- `apps/mobile-web`: Expo 앱(iOS + web)
- `services/functions`: Supabase Edge Functions(일정 수집, 캘린더 동기화, AI 인터뷰)
- `packages/domain`: 도메인 모델/상수/상태 전이 규칙
- `packages/ui`: 공통 UI 컴포넌트
- `packages/config`: 환경/클라이언트 설정
- `infra/migrations`: SQL migration, RLS 정책
- `infra/scheduler`: cron job 정의

### 핵심 데이터 모델 변경점(초기)
- `profiles`
  - `id`, `user_id`, `role(A|B)`, `display_name`, `is_active`
- `study_sessions`
  - `id`, `profile_id`, `status(running|finished)`, `start_at`, `end_at`, `achievement_rate`
- `todo_items`
  - `id`, `session_id`, `status(done|not_done)`, `target_date`, `migrated_to_date`
- `exam_events`
  - `id`, `dedup_key`, `calendar_sync_status(not_connected|pending|synced|failed)`
- `interview_sessions`
  - `id`, `profile_id`, `mode`, `persona`, `transcript`, `report`

## Risks / Trade-offs

- [Open API 응답 필드 불안정] -> 정규화 레이어에서 nullable 허용 + 원본 payload 저장 + 수동 보정 필드 제공
- [Google Calendar quota/오류] -> `failed` 상태 기록 + 지수 백오프 재시도 + 수동 재동기화 액션
- [역할 전환 시 잘못된 데이터 노출] -> 활성 프로필 전환 시 쿼리 키 무효화 + RLS 이중 검증
- [AI 응답 품질 편차] -> 고정 리포트 스키마 검증 + 길이/필드 누락 검증 실패 시 재생성
- [MVP 단순화로 인한 확장성 한계] -> 이벤트 처리 경계를 함수 단위로 분리해 이후 큐 기반으로 전환 가능하게 유지

## Migration Plan

1. 저장소 구조 생성(`apps/services/packages/infra`) 및 기본 워크스페이스 설정
2. Supabase 프로젝트 연결, 초기 SQL migration 및 RLS 정책 적용
3. Expo 앱에서 인증/활성 사용자 선택 플로우 구성
4. 핵심 테이블(`study_sessions`, `todo_items`, `exam_events`, `interview_sessions`) 생성
5. Edge Functions 구현 뼈대 추가(일정 수집, 캘린더 동기화, AI 인터뷰)
6. 스케줄러(cron) 등록 및 실패 재시도 정책 반영
7. web/iOS에서 공통 핵심 흐름(세션, 보상, 역할 전환) 수동 검증

Rollback 전략:
- 마이그레이션 버전별 down script 준비
- 신규 함수/스케줄러는 feature flag 또는 배포 단위 비활성화 가능하게 분리

## Open Questions

- 시험 일정 소스로 MVP에서 우선 채택할 Open API 1개는 무엇인가?
- Google Calendar는 사용자별 다중 캘린더를 지원할지 단일 캘린더로 제한할지?
- 사용자 A/B가 동일 Supabase Auth 계정 내 profile 전환인지, 별도 계정 로그인인지?
- AI 모의면접 리포트의 최소 저장 단위(json schema) 확정이 필요한가?