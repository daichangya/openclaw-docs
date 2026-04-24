---
read_when:
    - Skills config 추가 또는 수정하기
    - 번들 허용 목록 또는 설치 동작 조정하기
summary: Skills config 스키마 및 예제
title: Skills config
x-i18n:
    generated_at: "2026-04-24T06:41:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d5e156adb9b88d7ade1976005c11faffe5107661e4f3da5d878cc0ac648bcbb
    source_path: tools/skills-config.md
    workflow: 15
---

대부분의 skill 로더/설치 구성은
`~/.openclaw/openclaw.json`의 `skills` 아래에 있습니다. 에이전트별 skill 가시성은
`agents.defaults.skills`와 `agents.list[].skills` 아래에 있습니다.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway 런타임은 여전히 Node; bun은 권장되지 않음)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 또는 일반 텍스트 문자열
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

내장 이미지 생성/편집에는 `agents.defaults.imageGenerationModel`과 core `image_generate` 도구를 우선 사용하세요. `skills.entries.*`는 사용자 지정 또는
타사 skill 워크플로에만 사용됩니다.

특정 이미지 provider/model을 선택하는 경우 해당 provider의
인증/API 키도 구성하세요. 일반적인 예: `google/*`에는
`GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`, `openai/*`에는
`OPENAI_API_KEY`, `fal/*`에는 `FAL_KEY`.

예시:

- 네이티브 Nano Banana Pro 스타일 설정: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- 네이티브 fal 설정: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## 에이전트 skill 허용 목록

같은 머신/워크스페이스 skill 루트를 사용하되, 에이전트별로 보이는 skill 집합을 다르게 하고 싶다면 에이전트 config를 사용하세요.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // 기본값 상속 -> github, weather
      { id: "docs", skills: ["docs-search"] }, // 기본값 대체
      { id: "locked-down", skills: [] }, // skill 없음
    ],
  },
}
```

규칙:

- `agents.defaults.skills`: `agents.list[].skills`를 생략한 에이전트에 대한 공유 기본 허용 목록
- `agents.defaults.skills`를 생략하면 기본적으로 skill 제한이 없습니다.
- `agents.list[].skills`: 해당 에이전트의 명시적인 최종 skill 집합이며, 기본값과 병합되지 않습니다.
- `agents.list[].skills: []`: 해당 에이전트에는 아무 skill도 노출하지 않습니다.

## 필드

- 내장 skill 루트는 항상 `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills`, `<workspace>/skills`를 포함합니다.
- `allowBundled`: **번들** skill에만 적용되는 선택적 허용 목록. 설정하면
  목록에 있는 번들 skill만 적격이 됩니다(관리형, 에이전트, 워크스페이스 skill은 영향 없음).
- `load.extraDirs`: 스캔할 추가 skill 디렉터리(가장 낮은 우선순위).
- `load.watch`: skill 폴더를 감시하고 skills 스냅샷을 새로고침합니다(기본값: true).
- `load.watchDebounceMs`: skill watcher 이벤트의 디바운스 시간(밀리초, 기본값: 250).
- `install.preferBrew`: 가능하면 brew 설치를 우선합니다(기본값: true).
- `install.nodeManager`: node 설치 선호도(`npm` | `pnpm` | `yarn` | `bun`, 기본값: npm).
  이것은 **skill 설치에만** 영향을 줍니다. Gateway 런타임은 여전히 Node여야 하며
  (WhatsApp/Telegram에는 Bun 비권장).
  - `openclaw setup --node-manager`는 더 좁은 범위이며 현재 `npm`,
    `pnpm`, `bun`만 받습니다. Yarn 기반 skill 설치를 원하면
    `skills.install.nodeManager: "yarn"`를 수동으로 설정하세요.
- `entries.<skillKey>`: skill별 재정의.
- `agents.defaults.skills`: `agents.list[].skills`를 생략한
  에이전트가 상속하는 선택적 기본 skill 허용 목록.
- `agents.list[].skills`: 선택적 에이전트별 최종 skill 허용 목록. 명시적
  목록은 병합 대신 상속된 기본값을 대체합니다.

skill별 필드:

- `enabled`: 번들/설치된 skill이라도 `false`로 설정하면 비활성화합니다.
- `env`: 에이전트 실행에 주입되는 환경 변수(이미 설정되어 있지 않은 경우에만).
- `apiKey`: 기본 env var를 선언한 skill을 위한 선택적 편의 필드.
  일반 텍스트 문자열 또는 SecretRef 객체(`{ source, provider, id }`)를 지원합니다.

## 참고

- `entries` 아래의 키는 기본적으로 skill 이름에 매핑됩니다. skill이
  `metadata.openclaw.skillKey`를 정의하면 대신 해당 키를 사용하세요.
- 로드 우선순위는 `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → 번들 skill →
  `skills.load.extraDirs`입니다.
- watcher가 활성화되어 있으면 skill 변경은 다음 에이전트 턴에서 반영됩니다.

### 샌드박스된 skill + env var

세션이 **샌드박스** 상태일 때는 skill 프로세스가 구성된
샌드박스 backend 안에서 실행됩니다. 샌드박스는 호스트 `process.env`를 상속하지 않습니다.

다음 중 하나를 사용하세요.

- Docker backend의 경우 `agents.defaults.sandbox.docker.env` (또는 에이전트별 `agents.list[].sandbox.docker.env`)
- env를 사용자 지정 샌드박스 이미지나 원격 샌드박스 환경에 bake

전역 `env`와 `skills.entries.<skill>.env/apiKey`는 **호스트** 실행에만 적용됩니다.

## 관련 항목

- [Skills](/ko/tools/skills)
- [skill 만들기](/ko/tools/creating-skills)
- [Slash commands](/ko/tools/slash-commands)
