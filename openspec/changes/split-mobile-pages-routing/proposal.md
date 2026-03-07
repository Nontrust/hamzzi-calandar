## Why

현재 모바일 웹은 `app/index.tsx` 단일 파일에 로그인 화면과 메인 화면이 함께 있어 화면 책임 분리가 어렵고 유지보수 시 회귀 위험이 크다. 인증 상태에 따른 화면 전환 규칙을 라우팅 수준에서 명확히 분리해, 기능 확장(페이지 추가, 가드 정책 강화)을 안정적으로 진행할 수 있는 구조가 필요하다.

## What Changes

- 로그인 화면과 메인 화면을 별도 라우트 파일로 분리한다.
- Expo Router 기반으로 인증 상태에 따라 접근 가능한 화면을 구분한다.
- 루트 레이아웃 및 그룹 레이아웃을 도입해 인증 전/후 네비게이션 구조를 명확히 한다.
- 기존 인증/역할/기념일/권한 요청 로직은 유지하되 화면 렌더링 책임을 페이지 단위로 재배치한다.
- 페이지 분리 후에도 UI 토큰/브랜딩 자산 적용 일관성을 유지한다.
- 외부 연동(API/Calendar/ImagePicker) 실패 시 현재 화면 유지, 오류 문구 노출, 재시도 가능 상태를 유지한다.
- MVP 범위: `apps/mobile-web/app` 내 라우트 구조 분리(login, home), 인증 기반 리다이렉트, 기존 기능 회귀 없는 화면 이동.
- Out of Scope: 서버 API/DB 스키마 변경, 신규 권한 체계 도입, 디자인 전면 재개편.

## Capabilities

### New Capabilities
- `mobile-route-separation`: 모바일 웹에서 인증 전/후 페이지를 라우팅 계층으로 분리하고 접근 제어를 제공하는 요구사항.

### Modified Capabilities
- `mobile-ui-shell`: 기존 UI 쉘 요구사항을 단일 페이지가 아닌 분리된 페이지 구조에서도 동일하게 보장하도록 요구사항을 확장.

## Impact

- Affected code:
  - `apps/mobile-web/app/index.tsx` (홈 화면 전용으로 축소/이관)
  - `apps/mobile-web/app` 하위 신규 라우트 파일(예: `login.tsx`, 그룹 레이아웃)
  - 인증 상태 초기화/리다이렉트 관련 클라이언트 코드
- Affected specs:
  - 신규: `openspec/changes/split-mobile-pages-routing/specs/mobile-route-separation/spec.md`
  - 수정 델타: `openspec/changes/split-mobile-pages-routing/specs/mobile-ui-shell/spec.md`
- Dependencies/Systems:
  - Expo Router 경로 해석 및 Stack 설정
  - 기존 auth client 및 anniversary/calendar 권한 연동 로직
- Risk:
  - 라우트 전환 타이밍 문제로 초기 화면 깜빡임 또는 잘못된 접근 가능성
  - 완화 전략: 인증 로딩 상태를 명시하고, 실패 시 기본 안전 경로(로그인)로 폴백
