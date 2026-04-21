---
read_when:
    - Skills 구성 추가 또는 수정하기
    - 번들 Allowlist 또는 설치 동작 조정하기
summary: Skills 구성 스키마 및 예시
title: Skills 구성
x-i18n:
    generated_at: "2026-04-21T06:09:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af3a51af5d6d6af355c529bb8ec0a045046c635d8fff0dec20cd875ec12e88b
    source_path: tools/skills-config.md
    workflow: 15
---

# Skills 구성

대부분의 Skills 로더/설치 구성은 `~/.openclaw/openclaw.json`의 `skills` 아래에 있습니다.
에이전트별 Skill 가시성은 `agents.defaults.skills`와
`agents.list[].skills` 아래에 있습니다.

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
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway 런타임은 여전히 Node이며, bun은 권장되지 않음)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 또는 평문 문자열
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

내장 이미지 생성/편집에는 `agents.defaults.imageGenerationModel`과
코어 `image_generate` 도구를 우선 사용하세요. `skills.entries.*`는 사용자 지정 또는
서드파티 Skill 워크플로에만 사용됩니다.

특정 이미지 provider/model을 선택하는 경우, 해당 provider의
auth/API 키도 함께 구성하세요. 일반적인 예: `google/*`에는
`GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`, `openai/*`에는 `OPENAI_API_KEY`,
`fal/*`에는 `FAL_KEY`.

예시:

- 네이티브 Nano Banana 스타일 설정: `agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- 네이티브 fal 설정: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## 에이전트 Skill Allowlist

같은 머신/워크스페이스 Skill 루트를 사용하면서도,
에이전트별로 보이는 Skill 집합을 다르게 하려면 에이전트 구성을 사용하세요.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // 기본값 상속 -> github, weather
      { id: "docs", skills: ["docs-search"] }, // 기본값 대체
      { id: "locked-down", skills: [] }, // Skill 없음
    ],
  },
}
```

규칙:

- `agents.defaults.skills`: `agents.list[].skills`를 생략한 에이전트에 대한
  공통 기본 Allowlist입니다.
- 기본적으로 Skills를 제한하지 않으려면 `agents.defaults.skills`를 생략하세요.
- `agents.list[].skills`: 해당 에이전트의 명시적 최종 Skill 집합입니다.
  기본값과 병합되지 않습니다.
- `agents.list[].skills: []`: 해당 에이전트에 Skill을 노출하지 않습니다.

## 필드

- 내장 Skill 루트에는 항상 `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills`, `<workspace>/skills`가 포함됩니다.
- `allowBundled`: **번들** Skills에만 적용되는 선택적 Allowlist입니다. 설정되면
  목록에 있는 번들 Skills만 대상이 됩니다(관리형, 에이전트, 워크스페이스 Skills는 영향 없음).
- `load.extraDirs`: 추가로 스캔할 Skill 디렉터리(가장 낮은 우선순위).
- `load.watch`: Skill 폴더를 감시하고 Skills 스냅샷을 새로 고칩니다(기본값: true).
- `load.watchDebounceMs`: Skill watcher 이벤트의 디바운스 시간(밀리초)(기본값: 250).
- `install.preferBrew`: 가능할 때 brew 설치 프로그램을 우선 사용합니다(기본값: true).
- `install.nodeManager`: node 설치 프로그램 선호도(`npm` | `pnpm` | `yarn` | `bun`, 기본값: npm).
  이는 **Skill 설치**에만 영향을 줍니다. Gateway 런타임은 여전히 Node여야 하며
  (WhatsApp/Telegram에는 Bun 비권장).
  - `openclaw setup --node-manager`는 더 좁은 범위이며 현재 `npm`,
    `pnpm`, `bun`만 허용합니다. Yarn 기반 Skill 설치를 원하면
    `skills.install.nodeManager: "yarn"`를 수동으로 설정하세요.
- `entries.<skillKey>`: Skill별 재정의.
- `agents.defaults.skills`: `agents.list[].skills`를 생략한 에이전트가 상속하는
  선택적 기본 Skill Allowlist입니다.
- `agents.list[].skills`: 선택적 에이전트별 최종 Skill Allowlist입니다. 명시적
  목록은 상속된 기본값과 병합되지 않고 대체합니다.

Skill별 필드:

- `enabled`: Skill이 번들/설치되어 있어도 비활성화하려면 `false`로 설정합니다.
- `env`: 에이전트 실행에 주입되는 환경 변수입니다(이미 설정된 경우 제외).
- `apiKey`: 기본 env var를 선언한 Skill을 위한 선택적 편의 기능입니다.
  평문 문자열 또는 SecretRef 객체(`{ source, provider, id }`)를 지원합니다.

## 참고

- `entries` 아래의 키는 기본적으로 Skill 이름에 매핑됩니다. Skill이
  `metadata.openclaw.skillKey`를 정의한 경우 그 키를 대신 사용하세요.
- 로드 우선순위는 `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → 번들 Skills →
  `skills.load.extraDirs`입니다.
- watcher가 활성화되어 있으면 Skills 변경 사항은 다음 에이전트 턴에 반영됩니다.

### 샌드박스된 Skills + env vars

세션이 **샌드박스** 상태이면 Skill 프로세스는 구성된
샌드박스 백엔드 내부에서 실행됩니다. 샌드박스는 호스트 `process.env`를 상속하지 않습니다.

다음 중 하나를 사용하세요:

- Docker 백엔드에는 `agents.defaults.sandbox.docker.env`(또는 에이전트별 `agents.list[].sandbox.docker.env`)
- 또는 사용자 지정 샌드박스 이미지나 원격 샌드박스 환경에 env를 포함

전역 `env` 및 `skills.entries.<skill>.env/apiKey`는 **호스트** 실행에만 적용됩니다.
