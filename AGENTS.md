# Repository Guidelines

## 프로젝트 구조
이 저장소는 npm workspace 기반 모노레포입니다.

- `apps/mobile-web`: Expo Router 기반 앱입니다. 화면 라우트는 `app/`, 클라이언트 로직은 `src/`, 앱 테스트는 `tests/`에 둡니다.
- `services/functions`: TypeScript 서버 함수입니다. 핵심 핸들러와 스토어는 `src/`, 서버 테스트는 `tests/`에 있습니다.
- `packages/config`, `packages/domain`, `packages/ui`: 공용 설정, 타입, UI 모듈입니다.
- `infra`: Docker 설정과 SQL 마이그레이션입니다.
- `openspec`: 변경 제안서, 설계, 작업 목록 등 스펙 산출물입니다.

기능은 먼저 소유 워크스페이스 안에 구현하고, 재사용이 확인될 때만 `packages/*`로 옮깁니다.

## 개발, 빌드, 테스트 명령
- `npm run dev`: 기본 앱 개발 서버를 실행합니다.
- `npm run dev:web`: 웹 모드로 Expo 앱을 실행합니다.
- `npm run typecheck`: 전체 워크스페이스 TypeScript 검사를 수행합니다.
- `npm run test`: 전체 워크스페이스 테스트를 실행합니다.
- `npm --workspace services/functions run test`: 서버 테스트만 실행합니다.
- `npm --workspace apps/mobile-web run test`: 앱 테스트만 실행합니다.
- `npm run infra:up`: 로컬 Postgres/Adminer를 실행합니다.
- `npm run infra:migrate`: 로컬 DB 마이그레이션을 적용합니다.

## 코드 스타일 및 네이밍
주 언어는 TypeScript입니다. `.editorconfig`를 따릅니다: `UTF-8`, `LF`, 파일 끝 개행 유지.

- JSON, YAML, SQL, 설정 파일은 2칸 들여쓰기를 사용합니다.
- 변수/함수는 `camelCase`, 컴포넌트/타입은 `PascalCase`를 사용합니다.
- 라우트 파일은 역할이 드러나게 작성합니다. 예: `app/(app)/anniversaries.tsx`
- 불필요한 주석은 피하고, 복잡한 분기만 짧게 설명합니다.

## 테스트 가이드
앱과 서버 모두 Vitest를 사용합니다. 테스트 파일은 각 워크스페이스의 `tests/*.test.ts` 규칙을 따릅니다. 핸들러, 스토어, 라우트 가드, 날짜/기념일 계산처럼 회귀 위험이 큰 로직은 변경 시 반드시 테스트를 같이 수정합니다. 먼저 관련 워크스페이스 테스트를 돌리고, 마지막에 `npm run test`로 전체 확인합니다.

## 커밋 및 PR 가이드
최근 커밋 형식은 Conventional Commits + scope 입니다. 예: `feat(mobile): ...`, `feat(server): ...`, `docs(openspec): ...`

PR에는 아래 내용을 포함합니다.

- 변경 요약
- 관련 이슈 또는 OpenSpec change/spec 링크
- 테스트 결과
- UI 변경 시 `apps/mobile-web` 화면 캡처 또는 녹화

## OpenSpec 작업 흐름
기능 변경은 가능하면 OpenSpec 기준으로 진행합니다.

- 새 변경 시작: `/opsx:new`
- 다음 산출물 생성: `/opsx:continue`
- 구현 진행: `/opsx:apply`
- 구현 검증: `/opsx:verify`
- 완료 후 정리: `/opsx:archive`

산출물 순서를 건너뛰지 말고, `proposal -> specs -> design -> tasks` 흐름을 유지합니다.

## 문자 인코딩 주의사항
이 저장소는 한글 문자열이 많아서 인코딩 문제가 자주 발생합니다.

- 파일 저장은 항상 `UTF-8`로 유지합니다.
- PowerShell의 `Set-Content`는 기본 인코딩 때문에 문자열을 깨뜨릴 수 있으니 주의합니다.
- 한글이 포함된 TS/TSX 파일을 대량 치환한 뒤에는 문법 오류와 문자열 깨짐을 바로 확인합니다.
- 문자열 깨짐이 의심되면 우선 JSX 태그 닫힘, 따옴표, 템플릿 문자열부터 확인합니다.

## 보안 및 설정
`.env` 값은 커밋하지 않습니다. 새 환경 변수는 `.env.example`에 반영합니다. 로컬 데이터 변경은 직접 DB 수정 대신 `infra/migrations`에 SQL 파일로 남기는 것을 원칙으로 합니다.
