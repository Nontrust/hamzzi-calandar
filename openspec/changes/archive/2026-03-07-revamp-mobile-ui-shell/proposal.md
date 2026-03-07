## Why

현재 모바일 웹 화면은 기능 검증 중심으로 구성되어 있어 실제 서비스 앱처럼 보이는 일관된 UI 쉘(브랜드 헤더, 카드 레이아웃, 공통 스타일 토큰)이 부족합니다. 로그인/역할 전환/캘린더 조회 기능은 동작하지만 시각적 완성도와 화면 구조의 일관성이 낮아 사용자 신뢰와 사용성이 떨어집니다.

## What Changes

- 모바일 웹 앱의 화면 구조를 "실서비스형 UI 쉘"로 개편한다(헤더, 요약 카드, 섹션 카드, 액션 영역).
- `openspec/statics`에 업로드된 로고/BI를 앱 전반에 일관 적용한다.
- 화면별 인라인 스타일을 정리하고 공통 스타일 토큰 파일(색상, 간격, 라운드, 타이포)을 도입한다.
- 로그인 화면과 메인 대시보드 화면을 같은 디자인 언어로 통일한다.
- 캘린더/기념일/권한 요청 API 실패 시, 기능 중단 대신 사용자 안내 메시지와 마지막 정상 상태 유지 전략을 적용한다.
- MVP 범위: 모바일 웹(`apps/mobile-web`)의 로그인 화면 + 메인 홈 화면 UI/스타일 구조 개선, 공통 스타일 분리, 기존 기능 동작 유지.
- Out of Scope: 서버 API 스펙 변경, 신규 인증 방식 추가, 네이티브 앱 전용 화면 신설, 데이터 모델 변경.

## Capabilities

### New Capabilities
- `mobile-ui-shell`: 모바일 웹에서 브랜드 자산과 공통 UI 토큰을 기반으로 일관된 앱형 레이아웃을 제공하는 요구사항.

### Modified Capabilities
- `study-execution`: 캘린더/기념일/권한 관련 실패 상황에서 사용자 안내와 상태 보존 동작 요구사항을 보강.

## Impact

- Affected code:
  - `apps/mobile-web/app/index.tsx`
  - `apps/mobile-web/app` 하위 신규 공통 스타일/컴포넌트 파일
  - 필요 시 `apps/mobile-web/app.json`(표기명 정합성)
- Assets:
  - `openspec/statics/nahamzzi_BI.png`
  - `openspec/statics/nahamzzi_logo_black.png`
- External dependency impact:
  - Expo Calendar/ImagePicker/LocalAuthentication 요청 실패 시 경고 문구 노출 및 기존 화면 상태 유지
  - 서버 API 실패 시 화면 크래시 없이 마지막 성공 데이터 유지 + 재시도 가능 상태 보장
- Risk:
  - 스타일 구조 변경으로 인한 회귀 가능성(버튼 동작/권한 요청/기념일 CRUD). 작업 후 수동 시나리오 검증 필요.
