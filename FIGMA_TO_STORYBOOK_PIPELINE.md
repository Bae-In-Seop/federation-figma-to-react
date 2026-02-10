# Figma-to-Storybook Pipeline 구축 계획

> 학습 목적으로 단계별로 진행하며, 각 단계가 독립적으로 동작할 수 있도록 구성했습니다.

---

## 전체 아키텍처 개요

```
+------------------+                          +-------------------+
|                  |      Code Connect        |                   |
|   Figma          | <----------------------> |   Storybook       |
|   (Design)       |      addon-designs       |   (Development)   |
|                  | <----------------------> |                   |
+--------+---------+                          +---------+---------+
         |                                              |
         |  Tokens Studio / Variables API               |  Visual Tests
         |                                              |  (Chromatic)
         v                                              v
+--------+---------+      Style Dictionary    +---------+---------+
| Design Tokens    | -----------------------> | CI/CD Pipeline    |
| (DTCG JSON)      |      v4 빌드            | (GitHub Actions)  |
+------------------+                          +-------------------+
```

---

## Phase 1: Storybook에 Figma 디자인 연동하기

> **목표**: Storybook Story 옆에 Figma 디자인을 바로 볼 수 있게 한다.

### 1-1. `@storybook/addon-designs` 설치

```bash
npm install -D @storybook/addon-designs
```

### 1-2. Storybook 설정에 addon 등록

```ts
// .storybook/main.ts
const config = {
  addons: [
    // 기존 addon들...
    '@storybook/addon-designs',
  ],
};
export default config;
```

### 1-3. Story에 Figma URL 연결

```ts
// src/stories/Button.stories.ts
export const Primary = {
  args: { primary: true, label: 'Button' },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/FILE_KEY/FILE_NAME?node-id=NODE_ID',
    },
  },
};
```

### 학습 포인트

- Figma에서 컴포넌트 선택 후 "Copy link to selection"으로 node URL을 얻는다
- Storybook의 "Design" 탭에서 Figma 프레임이 인터랙티브하게 표시된다
- Figma에서 디자인을 수정하면 Storybook에도 자동 반영된다

### 확인 체크리스트

- [ ] addon 설치 및 등록
- [ ] 기존 Button story에 Figma URL 연결
- [ ] `npm run storybook`으로 Design 탭 확인

---

## Phase 2: Design Token 추출 및 코드 변환

> **목표**: Figma에 정의한 색상/간격/타이포 등의 토큰을 코드에서 CSS 변수로 사용한다.

### 2-1. Tokens Studio 플러그인 설정 (Figma 측)

1. Figma에서 [Tokens Studio](https://www.figma.com/community/plugin/843461159747178978) 플러그인 설치
2. 디자인 토큰 정의 (color, spacing, typography, borderRadius 등)
3. 토큰 포맷: **W3C DTCG 표준** (`$value`, `$type`) 선택
4. 동기화 대상: **GitHub 저장소**의 `tokens/` 디렉토리로 설정

### 2-2. Style Dictionary 빌드 파이프라인 구축

```bash
npm install -D style-dictionary@4 @tokens-studio/sd-transforms
```

프로젝트 구조:

```
tokens/
  └── tokens.json          ← Tokens Studio에서 동기화되는 파일
style-dictionary/
  └── config.js            ← Style Dictionary 빌드 설정
src/
  └── tokens/
      ├── variables.css    ← 생성된 CSS 변수
      └── tokens.ts        ← 생성된 TS 상수
```

설정 파일 예시:

```js
// style-dictionary/config.js
import { register } from '@tokens-studio/sd-transforms';
import StyleDictionary from 'style-dictionary';

register(StyleDictionary);

const sd = new StyleDictionary({
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'tokens-studio',
      buildPath: 'src/tokens/',
      files: [{
        destination: 'variables.css',
        format: 'css/variables',
      }],
    },
    ts: {
      transformGroup: 'tokens-studio',
      buildPath: 'src/tokens/',
      files: [{
        destination: 'tokens.ts',
        format: 'javascript/es6',
      }],
    },
  },
});

await sd.buildAllPlatforms();
```

### 2-3. npm script 등록

```jsonc
// package.json
{
  "scripts": {
    "build:tokens": "node style-dictionary/config.js"
  }
}
```

### 학습 포인트

- **DTCG 표준**: W3C Design Tokens Community Group이 2025.10에 발표한 표준 포맷
- **Tokens Studio 역할**: Figma 내에서 토큰을 관리하고 JSON으로 내보내는 브릿지
- **Style Dictionary 역할**: JSON 토큰 → CSS 변수, TS 상수 등으로 변환하는 빌드 도구
- **`@tokens-studio/sd-transforms`**: Tokens Studio 출력 형식을 Style Dictionary가 이해할 수 있게 전처리

### 확인 체크리스트

- [ ] Figma에 Tokens Studio 플러그인 설치 및 토큰 정의
- [ ] tokens/ 디렉토리에 JSON 내보내기
- [ ] `npm run build:tokens` 실행하여 CSS 변수 파일 생성
- [ ] 생성된 CSS 변수가 컴포넌트에서 사용 가능한지 확인

---

## Phase 3: Figma Code Connect 설정

> **목표**: Figma Dev Mode에서 실제 코드 스니펫이 표시되도록 연결한다.

### 3-1. Code Connect CLI 설치

```bash
npm install -D @figma/code-connect
```

### 3-2. Figma Personal Access Token 발급

1. Figma > Settings > Personal Access Tokens
2. 필요한 스코프: **Code Connect Write**, **File Content Read**
3. `.env` 파일에 저장 (git에 포함하지 않는다)

```env
FIGMA_ACCESS_TOKEN=figd_xxxxxxxxxxxxx
```

### 3-3. Code Connect 매핑 파일 작성

```tsx
// src/stories/Button.figma.tsx
import figma from '@figma/code-connect/react';
import { Button } from './Button';

figma.connect(Button, 'https://figma.com/design/FILE_KEY/...?node-id=123', {
  props: {
    label:   figma.string('Label'),
    primary: figma.boolean('Primary'),
    size:    figma.enum('Size', {
      Large:  'large',
      Medium: 'medium',
      Small:  'small',
    }),
  },
  example: ({ label, primary, size }) => (
    <Button primary={primary} size={size} label={label} />
  ),
});
```

### 3-4. 퍼블리시

```bash
npx figma connect publish --token $FIGMA_ACCESS_TOKEN
```

### 학습 포인트

- Code Connect 파일은 **실행되지 않는다** - CLI가 템플릿으로 파싱할 뿐이다
- Figma Dev Mode의 "Code" 패널에 실제 코드베이스의 스니펫이 표시된다
- Figma의 Variant 속성과 코드의 prop을 명시적으로 매핑한다
- `figma.enum()`, `figma.boolean()`, `figma.string()` 등으로 속성 타입별 매핑

### 확인 체크리스트

- [ ] PAT(Personal Access Token) 발급
- [ ] `.figma.tsx` 매핑 파일 작성
- [ ] `npx figma connect publish` 성공
- [ ] Figma Dev Mode에서 Code 패널 확인

---

## Phase 4: 컴포넌트 개발 워크플로우 정립

> **목표**: Figma 디자인 → React 컴포넌트 → Storybook Story의 반복 가능한 워크플로우를 만든다.

### 4-1. 컴포넌트 개발 순서

```
1. Figma에서 컴포넌트 디자인 확인 (Dev Mode)
   ↓
2. 디자인 토큰이 있는지 확인 → 없으면 Phase 2로 돌아가 토큰 추가
   ↓
3. React 컴포넌트 작성 (디자인 토큰 CSS 변수 사용)
   ↓
4. Storybook Story 작성 (모든 variants/states 포함)
   ↓
5. addon-designs로 Figma URL 연결
   ↓
6. Code Connect 매핑 파일 작성 및 퍼블리시
```

### 4-2. 파일 구조 컨벤션

```
src/
  components/
    Button/
      Button.tsx              ← 컴포넌트 구현
      Button.css              ← 스타일 (디자인 토큰 사용)
      Button.stories.ts       ← Storybook story
      Button.figma.tsx        ← Code Connect 매핑
      Button.test.tsx         ← 테스트 (선택)
```

### 4-3. Story 작성 템플릿

```ts
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/...',
    },
  },
  argTypes: {
    size: { control: 'select', options: ['small', 'medium', 'large'] },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { primary: true, label: 'Button' } };
export const Secondary: Story = { args: { label: 'Button' } };
export const Large: Story = { args: { size: 'large', label: 'Button' } };
export const Small: Story = { args: { size: 'small', label: 'Button' } };
```

### 학습 포인트

- **Naming Parity**: Figma의 `Button/Primary/Large` = 코드의 `<Button variant="primary" size="lg" />`
- 컴포넌트 단위로 모든 관련 파일을 같은 디렉토리에 둔다 (co-location)
- Story에서 모든 variant 조합을 커버해야 디자인 QA가 가능하다

### 확인 체크리스트

- [ ] 새 컴포넌트 1개를 이 워크플로우로 처음부터 끝까지 구현
- [ ] Storybook에서 모든 variant 확인
- [ ] Figma Dev Mode에서 Code Connect 스니펫 확인

---

## Phase 5: AI 활용한 코드 생성 가속 (선택)

> **목표**: Figma MCP Server를 활용하여 디자인에서 초기 컴포넌트 코드를 빠르게 생성한다.

### 5-1. Figma MCP Server 설정

Figma MCP Server를 AI 코딩 도구(Cursor, Claude Code 등)에 연결하면, AI가 Figma 디자인의 레이아웃/색상/간격/컴포넌트 구조를 직접 읽어서 코드를 생성할 수 있다.

```jsonc
// MCP 설정 예시 (Claude Code / Cursor)
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/figma-mcp-server"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "<your-token>"
      }
    }
  }
}
```

### 5-2. 워크플로우

```
1. Figma에서 컴포넌트 URL 복사
   ↓
2. AI 도구에 "이 Figma 컴포넌트를 React로 구현해줘" 요청
   ↓
3. AI가 MCP Server를 통해 Figma 디자인 정보를 읽고 코드 생성
   ↓
4. 개발자가 생성된 코드를 리뷰하고 디자인 토큰과 연결
   ↓
5. Phase 4의 워크플로우를 따라 Story 작성 및 Code Connect 연결
```

### 5-3. 대안 도구들

| 도구 | 특징 | 출력 |
|------|------|------|
| **Figma MCP Server** | AI 도구와 직접 연동, 디자인 컨텍스트 전달 | AI가 생성 |
| **Anima** | Figma 플러그인, Auto Layout 기반 반응형 | React, HTML, Vue |
| **Locofy** | AI 기반, 백엔드 바인딩 지원 | React, Next.js 등 |
| **Builder.io Visual Copilot** | 기존 코드베이스 컴포넌트와 매핑 | 다중 프레임워크 |

### 학습 포인트

- AI 생성 코드는 **시작점**이지 완성품이 아니다 - 항상 리뷰 필요
- MCP Server는 AI에게 디자인 "컨텍스트"를 제공하는 브릿지 역할
- 토큰과 연결되지 않은 하드코딩 값은 반드시 수정한다

### 확인 체크리스트

- [ ] MCP Server 또는 코드 생성 도구 중 하나 설정
- [ ] 간단한 컴포넌트로 생성 → 리뷰 → 수정 사이클 경험
- [ ] 생성된 코드에서 하드코딩 값을 디자인 토큰으로 교체

---

## Phase 6: CI/CD 및 Visual Testing (심화)

> **목표**: 자동화된 시각적 테스트와 배포 파이프라인을 구축한다.

### 6-1. Chromatic 연동

```bash
npm install -D chromatic
```

```jsonc
// package.json
{
  "scripts": {
    "chromatic": "chromatic --project-token=<TOKEN>"
  }
}
```

### 6-2. GitHub Actions 자동화

```yaml
# .github/workflows/storybook.yml
name: Storybook CI

on: [push, pull_request]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build:tokens    # 토큰 빌드
      - uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

### 6-3. 토큰 변경 자동 감지

```yaml
# .github/workflows/tokens.yml
name: Token Sync

on:
  push:
    paths:
      - 'tokens/**'

jobs:
  build-tokens:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build:tokens
      - uses: peter-evans/create-pull-request@v6
        with:
          title: 'chore: update design tokens'
          body: 'Tokens Studio에서 동기화된 토큰으로 CSS 변수를 업데이트합니다.'
```

### 학습 포인트

- **Chromatic**: 모든 Story의 스크린샷을 찍고 이전 버전과 픽셀 단위 비교
- PR마다 시각적 변경사항을 리뷰할 수 있다
- 토큰 파일 변경 시 자동으로 CSS 변수를 재생성하고 PR을 만든다

### 확인 체크리스트

- [ ] Chromatic 프로젝트 생성 및 첫 빌드 성공
- [ ] GitHub Actions 워크플로우 설정
- [ ] PR에서 visual diff 리뷰 경험

---

## 진행 순서 요약

| 순서 | Phase | 난이도 | 예상 소요 | 핵심 도구 |
|------|-------|--------|-----------|-----------|
| 1 | Figma 디자인 연동 | ★☆☆ | Phase 1부터 시작 | `@storybook/addon-designs` |
| 2 | Design Token 추출 | ★★☆ | Phase 1 완료 후 | Tokens Studio, Style Dictionary |
| 3 | Code Connect | ★★☆ | Phase 2 완료 후 | `@figma/code-connect` |
| 4 | 워크플로우 정립 | ★★☆ | Phase 3 완료 후 | 위 도구들 조합 |
| 5 | AI 코드 생성 | ★★☆ | 언제든 선택적 | Figma MCP Server |
| 6 | CI/CD & Visual Test | ★★★ | Phase 4 완료 후 | Chromatic, GitHub Actions |

> **추천**: Phase 1 → 2 → 3 → 4 순으로 진행하세요.
> Phase 5는 어느 단계에서든 도입 가능하고, Phase 6는 워크플로우가 안정된 후 진행하면 좋습니다.

---

## 참고 자료

- [Figma Code Connect 공식 문서](https://developers.figma.com/docs/code-connect/)
- [Figma REST API - Variables](https://developers.figma.com/docs/rest-api/variables-endpoints/)
- [Figma MCP Server](https://developers.figma.com/docs/figma-mcp-server/)
- [Tokens Studio 문서](https://docs.tokens.studio/)
- [Style Dictionary v4](https://styledictionary.com/)
- [W3C DTCG 토큰 표준](https://www.w3.org/community/design-tokens/)
- [Storybook addon-designs](https://github.com/storybookjs/addon-designs)
- [Chromatic 문서](https://www.chromatic.com/docs/)
- [Storybook Design Integrations](https://storybook.js.org/docs/sharing/design-integrations)
