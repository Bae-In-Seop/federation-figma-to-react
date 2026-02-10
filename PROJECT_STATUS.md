# federation-figma-to-react — Project Status

> 이 문서는 AI 어시스턴트(Claude)가 프로젝트 컨텍스트를 빠르게 파악하기 위한 참조 문서입니다.
> 마지막 업데이트: 2026-02-10

## 1. 프로젝트 개요

Figma 컴포넌트 URL을 입력하면 **React 컴포넌트 + CSS Module + Storybook Story** 코드를 자동 생성하는 도구.
CLI 파이프라인으로 시작해 포트폴리오용 웹 UI로 확장.

- **CLI**: `npm run codegen <figma-url>` → 로컬 파일 생성
- **Web UI**: 브라우저에서 URL 입력 → 구문 강조된 코드 미리보기
- **배포 대상**: Vercel (serverless function + Vite SPA)

## 2. 아키텍처

```
브라우저 (React SPA)                  서버 (Vite dev / Vercel Serverless)
┌─────────────────┐   POST /api/figma   ┌──────────────────────────┐
│  URL 입력 →     │ ─────────────────→  │ api/figma.ts             │
│  Phase 애니메이션│                     │   ↓                      │
│  탭별 코드 미리보기│ ←───────────────── │ runCodegen()             │
│  (prism 구문강조)│   JSON response     │   ├─ parseFigmaUrl()     │
└─────────────────┘                     │   ├─ fetchFigmaNode()    │
                                        │   ├─ parseFigmaTree()    │
                                        │   └─ generate{React,CSS, │
                                        │      Story}Code()        │
                                        └──────────────────────────┘
```

**핵심 설계 결정**:
- `FIGMA_ACCESS_TOKEN`은 서버에서만 사용 (브라우저 노출 없음, `.env`는 `.gitignore`에 포함)
- 로컬 개발: Vite `configureServer` 훅으로 `/api/figma` 인터셉트 (별도 서버 불필요)
- 프로덕션: Vercel이 `api/figma.ts`를 자동으로 serverless function으로 처리
- codegen 코어 로직은 `codegen.ts`에 순수 함수로 분리 → CLI/API 모두 사용

## 3. 파일 구조 및 역할

```
D:\Source\storybook\
├── api/
│   └── figma.ts                    # Vercel serverless POST handler
├── scripts/figma-codegen/
│   ├── codegen.ts                  # ★ 공유 코어: runCodegen(url, token) → CodegenResult
│   ├── index.ts                    # CLI 진입점 (dotenv → runCodegen → 파일 쓰기)
│   ├── api.ts                      # fetchFigmaNode() — Figma REST API 호출
│   ├── parser.ts                   # parseFigmaTree() — Figma 노드 → IR(TagNode) 변환
│   ├── mappers.ts                  # Figma 속성 → CSS 속성 매핑 함수들
│   ├── types.ts                    # FigmaNode, TagNode, ComponentProp 등 타입 정의
│   ├── utils.ts                    # toPascalCase, parseFigmaUrl, figmaColorToCSS 등
│   └── generators/
│       ├── react.ts                # generateReactCode() — TSX 생성
│       ├── css.ts                  # generateCSSCode() — CSS Module 생성
│       └── story.ts                # generateStoryCode() — Storybook story 생성
├── src/
│   ├── main.tsx                    # React 진입점 (StrictMode + createRoot)
│   ├── App.tsx                     # ★ 웹 UI: URL 입력, Phase 진행, 탭별 코드 뷰어
│   ├── App.css                     # 다크 테마 스타일 (BEM 네이밍)
│   ├── index.css                   # 글로벌 스타일 (Inter 폰트, #0f172a 배경)
│   ├── components/Button/          # codegen으로 생성된 예시 컴포넌트
│   └── stories/                    # Storybook 기본 예시 (scaffolding)
├── vite.config.ts                  # figmaApiDevPlugin() + react() + storybook vitest
├── index.html                      # Inter Google Fonts, title 설정
├── vercel.json                     # { "framework": "vite" }
├── tsconfig.json                   # references: [app, node]
├── tsconfig.app.json               # src/ — DOM, react-jsx
├── tsconfig.node.json              # vite.config, api/**, scripts/** — ES2023, node
├── package.json                    # scripts, dependencies
├── .env                            # FIGMA_ACCESS_TOKEN (gitignore됨)
└── FIGMA_TO_STORYBOOK_PIPELINE.md  # 전체 파이프라인 설계 문서 (6단계)
```

## 4. 핵심 인터페이스

```ts
// scripts/figma-codegen/codegen.ts
interface CodegenResult {
  componentName: string;
  files: {
    react: { filename: string; content: string };
    css:   { filename: string; content: string };
    story: { filename: string; content: string };
  };
}

async function runCodegen(figmaUrl: string, token: string): Promise<CodegenResult>
```

```ts
// src/App.tsx
type Phase = 'idle' | 'parsing' | 'fetching' | 'generating' | 'done' | 'error';
type Tab = 'react' | 'css' | 'story';
```

- Phase 흐름: `idle → parsing(400ms 딜레이) → fetching(실제 API) → generating(600ms 딜레이) → done`
- 에러 시 `error` 상태로 전환, 에러 메시지 표시

## 5. 기술 스택 및 의존성

| 카테고리 | 패키지 | 버전 | 용도 |
|----------|--------|------|------|
| 프레임워크 | react, react-dom | 19.2 | SPA UI |
| 빌드 | vite | 7.3 | 번들링 + 개발서버 |
| 언어 | typescript | 5.9 | 타입 체크 |
| 구문 강조 | prism-react-renderer | 2.4 | Night Owl 테마 코드 뷰어 |
| 환경변수 | dotenv | 16.4 | .env 로딩 (CLI + vite config) |
| 스토리북 | storybook, @storybook/react-vite | 10.2 | 컴포넌트 문서화 |
| 테스트 | vitest, @vitest/browser-playwright | 4.0 | 브라우저 테스트 |
| 배포 | @vercel/node | 5.6 | serverless function 타입 (devDep) |
| CLI 실행 | tsx | 4.19 | TypeScript 직접 실행 |

## 6. 환경 설정

```bash
# .env (프로젝트 루트, gitignore됨)
FIGMA_ACCESS_TOKEN=figd_xxxxxxxxxxxx
```

- 로컬 개발: `vite.config.ts`에서 `import 'dotenv/config'`로 로드
- Vercel: 프로젝트 Settings > Environment Variables에서 등록

## 7. 주요 명령어

```bash
npm run dev          # Vite 개발 서버 (http://localhost:5173) — /api/figma 미들웨어 포함
npm run build        # tsc -b && vite build → dist/
npm run preview      # 빌드 결과 프리뷰
npm run codegen <url> # CLI로 Figma URL → src/components/{Name}/ 에 파일 생성
npm run storybook    # Storybook 개발 서버 (http://localhost:6600)
npm run lint         # ESLint
```

## 8. 완료된 작업

| # | 작업 | 상태 |
|---|------|------|
| 1 | `codegen.ts` — 공유 순수 함수 추출 | ✅ 완료 |
| 2 | `index.ts` — CLI 리팩토링 (codegen.ts 사용) | ✅ 완료 |
| 3 | `api/figma.ts` — Vercel serverless function | ✅ 완료 |
| 4 | `vite.config.ts` — 개발용 API 미들웨어 플러그인 | ✅ 완료 |
| 5 | `App.tsx` + `App.css` + `index.css` — 포트폴리오 웹 UI | ✅ 완료 |
| 6 | `index.html`, `vercel.json`, `tsconfig.node.json` 설정 | ✅ 완료 |
| 7 | `prism-react-renderer`, `@vercel/node` 설치, 빌드 검증 | ✅ 완료 |
| 8 | Git 초기화 + initial commit | ✅ 완료 |

## 9. 남은 작업

| # | 작업 | 우선순위 | 비고 |
|---|------|----------|------|
| 1 | GitHub 레포 생성 및 push | 높음 | `gh` CLI 미설치. `git remote add origin <url> && git push -u origin main` |
| 2 | Vercel 배포 | 높음 | Vercel 프로젝트 연동 후 `FIGMA_ACCESS_TOKEN` 환경변수 등록 필요 |
| 3 | Vercel serverless 호환성 확인 | 중간 | `api/figma.ts`가 `scripts/` 모듈을 import — 번들링 경로 확인 필요 |
| 4 | 에러 UX 개선 | 낮음 | 네트워크 타임아웃, Figma API rate limit 등 엣지 케이스 |
| 5 | `src/stories/Button.stories.ts` TODO 해결 | 낮음 | Figma URL 교체 필요 |
| 6 | README.md 업데이트 | 낮음 | 현재 Vite 템플릿 기본 내용 — 프로젝트 설명으로 교체 |

## 10. 알려진 이슈

- `tsconfig.app.json` 빌드 시 `src/stories/Button.tsx`, `Header.tsx`에서 `React` 미사용 경고 (TS6133) — 기존 Storybook scaffolding 코드로, 프로젝트 본 코드와 무관
- `npm audit`에 취약점 3건 (moderate 1, high 2) — Storybook/Vitest 디펜던시 체인에서 발생, 직접 의존성이 아님

## 11. 주의사항 (유지보수 시)

1. **codegen.ts는 순수 함수 유지**: `process.exit`, 파일 I/O, `dotenv` 등 부수효과 절대 추가하지 않는다. CLI(`index.ts`)와 API(`api/figma.ts`)가 공유한다.
2. **vite.config.ts의 미들웨어**: `runCodegen`은 반드시 동적 `import()`로 로드한다. 정적 import하면 Node 전용 코드가 클라이언트 번들에 포함된다.
3. **`.env` 보호**: `.gitignore`에 `.env`가 포함되어 있는지 항상 확인한다. Figma 토큰은 서버 사이드에서만 접근한다.
4. **Vercel 배포 시**: `api/figma.ts`가 `scripts/figma-codegen/`를 상대 경로로 import한다. Vercel의 serverless function 번들러가 이를 올바르게 포함하는지 확인이 필요하다.
