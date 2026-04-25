---
read_when:
    - 에이전트 기본값 조정(모델, 사고, 워크스페이스, Heartbeat, 미디어, Skills)
    - 멀티 에이전트 라우팅 및 바인딩 구성
    - 세션, 메시지 전달 및 대화 모드 동작 조정
summary: 에이전트 기본값, 멀티 에이전트 라우팅, 세션, 메시지 및 대화 구성
title: 구성 — 에이전트
x-i18n:
    generated_at: "2026-04-25T13:40:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1601dc5720f6a82fb947667ed9c0b4612c5187572796db5deb7a28dd13be3528
    source_path: gateway/config-agents.md
    workflow: 15
---

`agents.*`, `multiAgent.*`, `session.*`,
`messages.*`, `talk.*` 아래의 에이전트 범위 구성 키입니다. 채널, 도구, Gateway 런타임 및 기타
최상위 키는 [구성 참조](/ko/gateway/configuration-reference)를 확인하세요.

## 에이전트 기본값

### `agents.defaults.workspace`

기본값: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

시스템 프롬프트의 Runtime 줄에 표시되는 선택적 리포지토리 루트입니다. 설정되지 않으면 OpenClaw가 워크스페이스에서 위쪽으로 탐색하며 자동 감지합니다.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills`를 설정하지 않은 에이전트에 대한 선택적 기본 Skills 허용 목록입니다.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather 상속
      { id: "docs", skills: ["docs-search"] }, // 기본값 대체
      { id: "locked-down", skills: [] }, // Skills 없음
    ],
  },
}
```

- 기본적으로 Skills를 제한 없이 허용하려면 `agents.defaults.skills`를 생략합니다.
- 기본값을 상속하려면 `agents.list[].skills`를 생략합니다.
- Skills를 사용하지 않으려면 `agents.list[].skills: []`로 설정합니다.
- 비어 있지 않은 `agents.list[].skills` 목록은 해당 에이전트의 최종 집합이며,
  기본값과 병합되지 않습니다.

### `agents.defaults.skipBootstrap`

워크스페이스 부트스트랩 파일(`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)의 자동 생성을 비활성화합니다.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

워크스페이스 부트스트랩 파일이 시스템 프롬프트에 주입되는 시점을 제어합니다. 기본값: `"always"`.

- `"continuation-skip"`: 완료된 어시스턴트 응답 이후의 안전한 이어가기 턴에서는 워크스페이스 부트스트랩 재주입을 건너뛰어 프롬프트 크기를 줄입니다. Heartbeat 실행과 Compaction 이후 재시도는 여전히 컨텍스트를 다시 구성합니다.
- `"never"`: 모든 턴에서 워크스페이스 부트스트랩 및 컨텍스트 파일 주입을 비활성화합니다. 자체 프롬프트 수명 주기를 완전히 관리하는 에이전트(사용자 지정 컨텍스트 엔진, 자체 컨텍스트를 구성하는 네이티브 런타임, 또는 특수한 부트스트랩 없는 워크플로)에서만 사용하세요. Heartbeat 및 Compaction 복구 턴도 주입을 건너뜁니다.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

잘리기 전 워크스페이스 부트스트랩 파일당 최대 문자 수입니다. 기본값: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

모든 워크스페이스 부트스트랩 파일에서 주입되는 총 최대 문자 수입니다. 기본값: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

부트스트랩 컨텍스트가 잘렸을 때 에이전트에 표시되는 경고 텍스트를 제어합니다.
기본값: `"once"`.

- `"off"`: 시스템 프롬프트에 경고 텍스트를 절대 주입하지 않습니다.
- `"once"`: 고유한 잘림 시그니처마다 한 번만 경고를 주입합니다(권장).
- `"always"`: 잘림이 존재할 때마다 매 실행마다 경고를 주입합니다.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### 컨텍스트 예산 소유권 맵

OpenClaw에는 대용량 프롬프트/컨텍스트 예산이 여러 개 있으며,
이들은 하나의 일반적인 설정으로 모두 처리되지 않고 의도적으로 하위 시스템별로
분리되어 있습니다.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  일반적인 워크스페이스 부트스트랩 주입.
- `agents.defaults.startupContext.*`:
  최근 일별 `memory/*.md` 파일을 포함하는
  일회성 `/new` 및 `/reset` 시작 프렐류드.
- `skills.limits.*`:
  시스템 프롬프트에 주입되는 압축된 Skills 목록.
- `agents.defaults.contextLimits.*`:
  제한된 런타임 발췌와 주입되는 런타임 소유 블록.
- `memory.qmd.limits.*`:
  인덱싱된 메모리 검색 스니펫 및 주입 크기 제한.

한 에이전트에만 다른 예산이 필요할 때만 해당하는 에이전트별 재정의를 사용하세요.

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

빈 `/new` 및 `/reset` 실행에서 주입되는 첫 번째 턴 시작 프렐류드를 제어합니다.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

제한된 런타임 컨텍스트 표면에 대한 공통 기본값입니다.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: 잘림 메타데이터와 이어서 보기 알림이 추가되기 전
  `memory_get` 발췌의 기본 제한값.
- `memoryGetDefaultLines`: `lines`가 생략되었을 때의 기본 `memory_get`
  줄 범위.
- `toolResultMaxChars`: 저장된 결과와 오버플로 복구에 사용되는 실시간 도구 결과 제한값.
- `postCompactionMaxChars`: Compaction 이후 새로고침 주입 중 사용되는 AGENTS.md 발췌 제한값.

#### `agents.list[].contextLimits`

공유되는 `contextLimits` 설정에 대한 에이전트별 재정의입니다. 생략된 필드는
`agents.defaults.contextLimits`에서 상속됩니다.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

시스템 프롬프트에 주입되는 압축된 Skills 목록의 전역 제한값입니다. 이것은
필요할 때 `SKILL.md` 파일을 읽는 동작에는 영향을 주지 않습니다.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills 프롬프트 예산에 대한 에이전트별 재정의입니다.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

provider 호출 전에 transcript/tool 이미지 블록에서 가장 긴 이미지 변의 최대 픽셀 크기입니다.
기본값: `1200`.

값을 낮추면 보통 비전 토큰 사용량과 요청 페이로드 크기가 줄어들어 스크린샷이 많은 실행에 유리합니다.
값을 높이면 더 많은 시각적 디테일이 유지됩니다.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

시스템 프롬프트 컨텍스트용 시간대입니다(메시지 타임스탬프 아님). 호스트 시간대로 대체됩니다.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

시스템 프롬프트의 시간 형식입니다. 기본값: `auto`(OS 기본 설정).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // 전역 기본 provider params
      embeddedHarness: {
        runtime: "pi", // pi | auto | 등록된 harness id(예: codex)
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 허용합니다.
  - 문자열 형식은 기본 모델만 설정합니다.
  - 객체 형식은 기본 모델과 순서가 있는 장애 조치 모델을 설정합니다.
- `imageModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 허용합니다.
  - `image` 도구 경로에서 비전 모델 구성으로 사용됩니다.
  - 선택된/기본 모델이 이미지 입력을 받을 수 없을 때 대체 라우팅에도 사용됩니다.
- `imageGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 허용합니다.
  - 공용 이미지 생성 기능 및 향후 이미지를 생성하는 모든 도구/Plugin 표면에서 사용됩니다.
  - 일반적인 값: 네이티브 Gemini 이미지 생성을 위한 `google/gemini-3.1-flash-image-preview`, fal용 `fal/fal-ai/flux/dev`, 또는 OpenAI Images용 `openai/gpt-image-2`.
  - provider/model을 직접 선택하는 경우 일치하는 provider 인증도 구성하세요(예: `google/*`에는 `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`, `openai/gpt-image-2`에는 `OPENAI_API_KEY` 또는 OpenAI Codex OAuth, `fal/*`에는 `FAL_KEY`).
  - 생략해도 `image_generate`는 여전히 인증이 설정된 provider 기본값을 추론할 수 있습니다. 먼저 현재 기본 provider를 시도한 다음, 남아 있는 등록된 이미지 생성 provider를 provider id 순서대로 시도합니다.
- `musicGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 허용합니다.
  - 공용 음악 생성 기능과 기본 제공 `music_generate` 도구에서 사용됩니다.
  - 일반적인 값: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, 또는 `minimax/music-2.6`.
  - 생략해도 `music_generate`는 여전히 인증이 설정된 provider 기본값을 추론할 수 있습니다. 먼저 현재 기본 provider를 시도한 다음, 남아 있는 등록된 음악 생성 provider를 provider id 순서대로 시도합니다.
  - provider/model을 직접 선택하는 경우 일치하는 provider 인증/API 키도 구성하세요.
- `videoGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 허용합니다.
  - 공용 비디오 생성 기능과 기본 제공 `video_generate` 도구에서 사용됩니다.
  - 일반적인 값: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, 또는 `qwen/wan2.7-r2v`.
  - 생략해도 `video_generate`는 여전히 인증이 설정된 provider 기본값을 추론할 수 있습니다. 먼저 현재 기본 provider를 시도한 다음, 남아 있는 등록된 비디오 생성 provider를 provider id 순서대로 시도합니다.
  - provider/model을 직접 선택하는 경우 일치하는 provider 인증/API 키도 구성하세요.
  - 번들된 Qwen 비디오 생성 provider는 최대 출력 비디오 1개, 입력 이미지 1개, 입력 비디오 4개, 길이 10초 및 provider 수준의 `size`, `aspectRatio`, `resolution`, `audio`, `watermark` 옵션을 지원합니다.
- `pdfModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 허용합니다.
  - `pdf` 도구의 모델 라우팅에 사용됩니다.
  - 생략하면 PDF 도구는 `imageModel`로 대체한 다음, 확인된 세션/기본 모델로 대체합니다.
- `pdfMaxBytesMb`: 호출 시점에 `maxBytesMb`가 전달되지 않았을 때 `pdf` 도구에 사용되는 기본 PDF 크기 제한입니다.
- `pdfMaxPages`: `pdf` 도구의 추출 대체 모드에서 고려하는 기본 최대 페이지 수입니다.
- `verboseDefault`: 에이전트의 기본 상세 출력 수준입니다. 값: `"off"`, `"on"`, `"full"`. 기본값: `"off"`.
- `elevatedDefault`: 에이전트의 기본 고급 출력 수준입니다. 값: `"off"`, `"on"`, `"ask"`, `"full"`. 기본값: `"on"`.
- `model.primary`: 형식은 `provider/model`입니다(예: API 키 액세스용 `openai/gpt-5.4` 또는 Codex OAuth용 `openai-codex/gpt-5.5`). provider를 생략하면 OpenClaw는 먼저 별칭을 시도한 다음, 해당 정확한 모델 id에 대해 구성된 provider 중 유일하게 일치하는 항목을 시도하고, 그다음에야 구성된 기본 provider로 대체합니다(이전 호환성을 위한 사용 중단 예정 동작이므로 명시적인 `provider/model`을 권장합니다). 해당 provider가 더 이상 구성된 기본 모델을 제공하지 않으면 OpenClaw는 오래된 제거된 provider 기본값을 표시하는 대신 첫 번째 구성된 provider/model로 대체합니다.
- `models`: `/model`용으로 구성된 모델 카탈로그 및 허용 목록입니다. 각 항목에는 `alias`(바로 가기)와 `params`(예: `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `extra_body`/`extraBody` 같은 provider별 값)를 포함할 수 있습니다.
  - 안전한 편집: 항목을 추가할 때 `openclaw config set agents.defaults.models '<json>' --strict-json --merge`를 사용하세요. `config set`은 `--replace`를 전달하지 않으면 기존 허용 목록 항목을 제거하는 교체를 거부합니다.
  - provider 범위의 configure/onboarding 흐름은 선택된 provider 모델을 이 맵에 병합하고, 이미 구성된 관련 없는 provider는 유지합니다.
  - 직접 OpenAI Responses 모델을 사용할 경우 서버 측 Compaction이 자동으로 활성화됩니다. `context_management` 주입을 중지하려면 `params.responsesServerCompaction: false`를 사용하고, 임계값을 재정의하려면 `params.responsesCompactThreshold`를 사용하세요. 자세한 내용은 [OpenAI 서버 측 Compaction](/ko/providers/openai#server-side-compaction-responses-api)을 참조하세요.
- `params`: 모든 모델에 적용되는 전역 기본 provider 매개변수입니다. `agents.defaults.params`에 설정합니다(예: `{ cacheRetention: "long" }`).
- `params` 병합 우선순위(구성): `agents.defaults.params`(전역 기본값)는 `agents.defaults.models["provider/model"].params`(모델별)로 재정의되고, 그다음 `agents.list[].params`(일치하는 agent id)가 키별로 재정의합니다. 자세한 내용은 [프롬프트 캐싱](/ko/reference/prompt-caching)을 참조하세요.
- `params.extra_body`/`params.extraBody`: OpenAI 호환 프록시용 `api: "openai-completions"` 요청 본문에 병합되는 고급 전달용 JSON입니다. 생성된 요청 키와 충돌하면 extra body가 우선하며, 네이티브가 아닌 completions 경로는 이후에도 OpenAI 전용 `store`를 제거합니다.
- `embeddedHarness`: 기본 저수준 임베디드 에이전트 런타임 정책입니다. 런타임을 생략하면 기본적으로 OpenClaw Pi를 사용합니다. 기본 제공 PI harness를 강제하려면 `runtime: "pi"`를 사용하고, 등록된 Plugin harness가 지원되는 모델을 가져가도록 하려면 `runtime: "auto"`를 사용하며, `runtime: "codex"`처럼 등록된 harness id를 직접 지정할 수도 있습니다. 자동 PI 대체를 비활성화하려면 `fallback: "none"`을 설정하세요. `codex` 같은 명시적 Plugin 런타임은 동일한 재정의 범위에 `fallback: "pi"`를 설정하지 않으면 기본적으로 실패 시 닫힌 상태로 동작합니다. 모델 참조는 `provider/model`의 정규 형식으로 유지하고, Codex, Claude CLI, Gemini CLI 및 기타 실행 백엔드는 기존 런타임 provider 접두사 대신 런타임 구성을 통해 선택하세요. provider/model 선택과 이것이 어떻게 다른지는 [에이전트 런타임](/ko/concepts/agent-runtimes)을 참조하세요.
- 이 필드를 변경하는 구성 작성기(예: `/models set`, `/models set-image`, 대체 모델 추가/제거 명령)는 정규 객체 형식으로 저장하며 가능하면 기존 대체 목록을 유지합니다.
- `maxConcurrent`: 세션 전체에서 병렬로 실행할 수 있는 최대 에이전트 수입니다(각 세션은 여전히 직렬화됨). 기본값: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness`는 임베디드 에이전트 턴을 실행할 저수준 실행기를 제어합니다.
대부분의 배포에서는 기본 OpenClaw Pi 런타임을 유지해야 합니다.
번들된
Codex 앱 서버 harness처럼 신뢰할 수 있는 Plugin이 네이티브 harness를 제공할 때 사용하세요. 개념적 모델은
[에이전트 런타임](/ko/concepts/agent-runtimes)을 참조하세요.

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"`, 또는 등록된 Plugin harness id입니다. 번들된 Codex Plugin은 `codex`를 등록합니다.
- `fallback`: `"pi"` 또는 `"none"`입니다. `runtime: "auto"`에서는 폴백을 생략하면 기본값이 `"pi"`이므로, 이전 구성은 어떤 Plugin harness도 실행을 가져가지 않을 때 계속 PI를 사용할 수 있습니다. `runtime: "codex"` 같은 명시적 Plugin 런타임 모드에서는 폴백을 생략하면 기본값이 `"none"`이므로, harness가 없을 때 PI를 조용히 사용하는 대신 실패합니다. 런타임 재정의는 더 넓은 범위의 폴백을 상속하지 않으므로, 의도적으로 해당 호환성 폴백을 원할 때는 명시적 런타임과 함께 `fallback: "pi"`를 설정하세요. 선택된 Plugin harness 실패는 항상 직접 표시됩니다.
- 환경 변수 재정의: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>`는 `runtime`을 재정의하고, `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none`는 해당 프로세스의 폴백을 재정의합니다.
- Codex 전용 배포에서는 `model: "openai/gpt-5.5"`와 `embeddedHarness.runtime: "codex"`를 설정하세요. 가독성을 위해 `embeddedHarness.fallback: "none"`을 명시적으로 설정할 수도 있습니다. 이것이 명시적 Plugin 런타임의 기본값입니다.
- 첫 번째 임베디드 실행 후 harness 선택은 세션 id별로 고정됩니다. 구성/환경 변수 변경은 기존 transcript가 아닌 새 세션이나 재설정된 세션에 적용됩니다. transcript 기록은 있지만 핀이 기록되지 않은 레거시 세션은 PI에 고정된 것으로 처리됩니다. `/status`는 예를 들어 `Runtime: OpenClaw Pi Default` 또는 `Runtime: OpenAI Codex`처럼 실제 런타임을 보고합니다.
- 이것은 임베디드 채팅 harness만 제어합니다. 미디어 생성, 비전, PDF, 음악, 비디오 및 TTS는 여전히 각각의 provider/model 설정을 사용합니다.

**기본 제공 별칭 단축형** (`agents.defaults.models`에 모델이 있을 때만 적용됨):

| 별칭                | 모델                                               |
| ------------------- | -------------------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`                        |
| `sonnet`            | `anthropic/claude-sonnet-4-6`                      |
| `gpt`               | `openai/gpt-5.4` 또는 구성된 Codex OAuth GPT-5.5   |
| `gpt-mini`          | `openai/gpt-5.4-mini`                              |
| `gpt-nano`          | `openai/gpt-5.4-nano`                              |
| `gemini`            | `google/gemini-3.1-pro-preview`                    |
| `gemini-flash`      | `google/gemini-3-flash-preview`                    |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`             |

구성한 별칭은 항상 기본값보다 우선합니다.

Z.AI GLM-4.x 모델은 `--thinking off`를 설정하거나 `agents.defaults.models["zai/<model>"].params.thinking`을 직접 정의하지 않는 한 자동으로 사고 모드를 활성화합니다.
Z.AI 모델은 도구 호출 스트리밍을 위해 기본적으로 `tool_stream`을 활성화합니다. 비활성화하려면 `agents.defaults.models["zai/<model>"].params.tool_stream`을 `false`로 설정하세요.
Anthropic Claude 4.6 모델은 명시적인 사고 수준이 설정되지 않은 경우 기본적으로 `adaptive` 사고를 사용합니다.

### `agents.defaults.cliBackends`

텍스트 전용 대체 실행(도구 호출 없음)을 위한 선택적 CLI 백엔드입니다. API provider가 실패할 때 백업으로 유용합니다.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // 또는 CLI가 프롬프트 파일 플래그를 지원하면 systemPromptFileArg를 사용하세요.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI 백엔드는 텍스트 우선이며, 도구는 항상 비활성화됩니다.
- `sessionArg`가 설정되어 있으면 세션이 지원됩니다.
- `imageArg`가 파일 경로를 받을 수 있으면 이미지 전달이 지원됩니다.

### `agents.defaults.systemPromptOverride`

OpenClaw가 조합한 전체 시스템 프롬프트를 고정 문자열로 대체합니다. 기본 수준(`agents.defaults.systemPromptOverride`) 또는 에이전트별(`agents.list[].systemPromptOverride`)로 설정합니다. 에이전트별 값이 우선하며, 빈 값 또는 공백만 있는 값은 무시됩니다. 제어된 프롬프트 실험에 유용합니다.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

모델 계열별로 적용되는 provider 독립적 프롬프트 오버레이입니다. GPT-5 계열 모델 id는 provider 전반에 걸쳐 공통 동작 계약을 받으며, `personality`는 친근한 상호작용 스타일 계층만 제어합니다.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"`(기본값)와 `"on"`은 친근한 상호작용 스타일 계층을 활성화합니다.
- `"off"`는 친근한 계층만 비활성화하며, 태그가 지정된 GPT-5 동작 계약은 계속 활성화됩니다.
- 이 공용 설정이 지정되지 않았을 때는 레거시 `plugins.entries.openai.config.personality`도 계속 읽습니다.

### `agents.defaults.heartbeat`

주기적인 Heartbeat 실행입니다.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m이면 비활성화
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // 기본값: true; false면 시스템 프롬프트에서 Heartbeat 섹션을 생략
        lightContext: false, // 기본값: false; true면 워크스페이스 부트스트랩 파일 중 HEARTBEAT.md만 유지
        isolatedSession: false, // 기본값: false; true면 각 heartbeat를 새 세션에서 실행(대화 기록 없음)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (기본값) | block
        target: "none", // 기본값: none | 옵션: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: 기간 문자열(ms/s/m/h)입니다. 기본값: `30m`(API 키 인증) 또는 `1h`(OAuth 인증). 비활성화하려면 `0m`으로 설정하세요.
- `includeSystemPromptSection`: false이면 시스템 프롬프트에서 Heartbeat 섹션을 생략하고 부트스트랩 컨텍스트에 `HEARTBEAT.md`를 주입하지 않습니다. 기본값: `true`.
- `suppressToolErrorWarnings`: true이면 Heartbeat 실행 중 도구 오류 경고 페이로드를 숨깁니다.
- `timeoutSeconds`: 중단되기 전까지 Heartbeat 에이전트 턴에 허용되는 최대 시간(초)입니다. 설정하지 않으면 `agents.defaults.timeoutSeconds`를 사용합니다.
- `directPolicy`: direct/DM 전달 정책입니다. `allow`(기본값)는 direct 대상 전달을 허용합니다. `block`은 direct 대상 전달을 억제하고 `reason=dm-blocked`를 출력합니다.
- `lightContext`: true이면 Heartbeat 실행은 경량 부트스트랩 컨텍스트를 사용하고 워크스페이스 부트스트랩 파일 중 `HEARTBEAT.md`만 유지합니다.
- `isolatedSession`: true이면 각 Heartbeat는 이전 대화 기록이 없는 새 세션에서 실행됩니다. Cron의 `sessionTarget: "isolated"`와 같은 격리 패턴입니다. Heartbeat당 토큰 비용을 약 100K에서 약 2~5K 토큰으로 줄입니다.
- 에이전트별: `agents.list[].heartbeat`를 설정합니다. 어떤 에이전트든 `heartbeat`를 정의하면 **해당 에이전트들만** Heartbeat를 실행합니다.
- Heartbeat는 전체 에이전트 턴을 실행하므로, 간격이 짧을수록 더 많은 토큰을 소모합니다.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 등록된 compaction provider plugin의 id(선택 사항)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // identifierPolicy=custom일 때 사용
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // []이면 재주입 비활성화
        model: "openrouter/anthropic/claude-sonnet-4-6", // 선택적 compaction 전용 모델 재정의
        notifyUser: true, // compaction 시작 및 완료 시 짧은 알림 전송(기본값: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` 또는 `safeguard`(긴 기록에 대한 청크 요약)입니다. [Compaction](/ko/concepts/compaction)을 참조하세요.
- `provider`: 등록된 compaction provider Plugin의 id입니다. 설정되면 기본 제공 LLM 요약 대신 provider의 `summarize()`가 호출됩니다. 실패 시 기본 제공 방식으로 대체됩니다. provider를 설정하면 `mode: "safeguard"`가 강제됩니다. [Compaction](/ko/concepts/compaction)을 참조하세요.
- `timeoutSeconds`: 단일 compaction 작업에 OpenClaw가 허용하는 최대 시간(초)입니다. 초과 시 중단합니다. 기본값: `900`.
- `keepRecentTokens`: 가장 최근 transcript 꼬리 부분을 그대로 유지하기 위한 Pi 절단 지점 예산입니다. 수동 `/compact`는 명시적으로 설정된 경우 이를 따르며, 그렇지 않으면 수동 compaction은 하드 체크포인트입니다.
- `identifierPolicy`: `strict`(기본값), `off`, 또는 `custom`입니다. `strict`는 compaction 요약 중 기본 제공 불투명 식별자 보존 지침을 앞에 추가합니다.
- `identifierInstructions`: `identifierPolicy=custom`일 때 사용되는 선택적 사용자 지정 식별자 보존 텍스트입니다.
- `qualityGuard`: safeguard 요약에 대한 잘못된 출력 재시도 검사입니다. safeguard 모드에서 기본적으로 활성화되며, 감사를 건너뛰려면 `enabled: false`로 설정하세요.
- `postCompactionSections`: compaction 후 다시 주입할 선택적 AGENTS.md H2/H3 섹션 이름입니다. 기본값은 `["Session Startup", "Red Lines"]`이며, 재주입을 비활성화하려면 `[]`로 설정하세요. 설정되지 않았거나 명시적으로 이 기본 쌍으로 설정된 경우, 이전 `Every Session`/`Safety` 제목도 레거시 대체값으로 허용됩니다.
- `model`: compaction 요약에만 적용되는 선택적 `provider/model-id` 재정의입니다. 기본 세션은 하나의 모델을 유지하면서 compaction 요약은 다른 모델에서 실행해야 할 때 사용하세요. 설정하지 않으면 compaction은 세션의 기본 모델을 사용합니다.
- `notifyUser`: `true`이면 compaction 시작 및 완료 시 사용자에게 짧은 알림을 보냅니다(예: "Compacting context..." 및 "Compaction complete"). compaction을 조용히 유지하기 위해 기본적으로 비활성화됩니다.
- `memoryFlush`: 내구성 있는 메모리를 저장하기 위해 자동 compaction 전에 실행되는 조용한 에이전트 턴입니다. 워크스페이스가 읽기 전용이면 건너뜁니다.

### `agents.defaults.contextPruning`

LLM에 보내기 전에 메모리 내 컨텍스트에서 **오래된 도구 결과**를 정리합니다. 디스크의 세션 기록은 **수정하지 않습니다**.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // 기간(ms/s/m/h), 기본 단위: 분
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl 모드 동작">

- `mode: "cache-ttl"`은 정리 패스를 활성화합니다.
- `ttl`은 마지막 캐시 접근 이후 언제 다시 정리를 실행할 수 있는지 제어합니다.
- 정리는 먼저 큰 도구 결과를 소프트 트림하고, 필요하면 더 오래된 도구 결과를 하드 클리어합니다.

**소프트 트림**은 시작 부분과 끝 부분을 유지하고 중간에 `...`를 삽입합니다.

**하드 클리어**는 전체 도구 결과를 플레이스홀더로 대체합니다.

참고:

- 이미지 블록은 절대 잘리거나 지워지지 않습니다.
- 비율은 정확한 토큰 수가 아니라 문자 수 기준(대략적)입니다.
- `keepLastAssistants`보다 적은 수의 어시스턴트 메시지만 존재하면 정리는 건너뜁니다.

</Accordion>

동작 세부 정보는 [세션 정리](/ko/concepts/session-pruning)를 참조하세요.

### 블록 스트리밍

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (minMs/maxMs 사용)
    },
  },
}
```

- Telegram이 아닌 채널은 블록 응답을 활성화하려면 명시적으로 `*.blockStreaming: true`가 필요합니다.
- 채널 재정의: `channels.<channel>.blockStreamingCoalesce`(및 계정별 변형). Signal/Slack/Discord/Google Chat의 기본값은 `minChars: 1500`입니다.
- `humanDelay`: 블록 응답 사이의 무작위 지연입니다. `natural` = 800–2500ms. 에이전트별 재정의: `agents.list[].humanDelay`.

동작 및 청크 세부 정보는 [스트리밍](/ko/concepts/streaming)을 참조하세요.

### 입력 중 표시기

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- 기본값: direct 채팅/멘션에는 `instant`, 멘션되지 않은 그룹 채팅에는 `message`.
- 세션별 재정의: `session.typingMode`, `session.typingIntervalSeconds`.

[입력 중 표시기](/ko/concepts/typing-indicators)를 참조하세요.

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

임베디드 에이전트를 위한 선택적 샌드박싱입니다. 전체 가이드는 [샌드박싱](/ko/gateway/sandboxing)을 참조하세요.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / 인라인 내용도 지원:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="샌드박스 세부 정보">

**백엔드:**

- `docker`: 로컬 Docker 런타임(기본값)
- `ssh`: 일반 SSH 기반 원격 런타임
- `openshell`: OpenShell 런타임

`backend: "openshell"`이 선택되면 런타임별 설정은
`plugins.entries.openshell.config`로 이동합니다.

**SSH 백엔드 구성:**

- `target`: `user@host[:port]` 형식의 SSH 대상
- `command`: SSH 클라이언트 명령(기본값: `ssh`)
- `workspaceRoot`: 범위별 워크스페이스에 사용되는 원격 절대 루트
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH에 전달되는 기존 로컬 파일
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw가 런타임에 임시 파일로 구체화하는 인라인 내용 또는 SecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH 호스트 키 정책 설정

**SSH 인증 우선순위:**

- `identityData`가 `identityFile`보다 우선합니다.
- `certificateData`가 `certificateFile`보다 우선합니다.
- `knownHostsData`가 `knownHostsFile`보다 우선합니다.
- SecretRef 기반 `*Data` 값은 샌드박스 세션이 시작되기 전에 활성 시크릿 런타임 스냅샷에서 확인됩니다.

**SSH 백엔드 동작:**

- 생성 또는 재생성 후 원격 워크스페이스를 한 번 시드합니다.
- 이후에는 원격 SSH 워크스페이스를 기준으로 유지합니다.
- `exec`, 파일 도구, 미디어 경로를 SSH를 통해 라우팅합니다.
- 원격 변경 사항을 호스트로 자동 동기화하지 않습니다.
- 샌드박스 브라우저 컨테이너는 지원하지 않습니다.

**워크스페이스 액세스:**

- `none`: `~/.openclaw/sandboxes` 아래의 범위별 샌드박스 워크스페이스
- `ro`: 샌드박스 워크스페이스는 `/workspace`, 에이전트 워크스페이스는 읽기 전용으로 `/agent`에 마운트
- `rw`: 에이전트 워크스페이스를 읽기/쓰기 가능하게 `/workspace`에 마운트

**범위:**

- `session`: 세션별 컨테이너 + 워크스페이스
- `agent`: 에이전트별 컨테이너 + 워크스페이스 1개(기본값)
- `shared`: 공유 컨테이너 및 워크스페이스(세션 간 격리 없음)

**OpenShell Plugin 구성:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell 모드:**

- `mirror`: 실행 전에 로컬에서 원격으로 시드하고, 실행 후 다시 동기화합니다. 로컬 워크스페이스가 기준으로 유지됩니다.
- `remote`: 샌드박스가 생성될 때 원격을 한 번 시드한 뒤, 원격 워크스페이스를 기준으로 유지합니다.

`remote` 모드에서는 시드 단계 이후 OpenClaw 외부에서 호스트 로컬에 이루어진 편집 내용은 샌드박스에 자동 동기화되지 않습니다.
전송은 OpenShell 샌드박스로의 SSH를 사용하지만, Plugin이 샌드박스 수명 주기와 선택적 미러 동기화를 관리합니다.

**`setupCommand`**는 컨테이너 생성 후 한 번 실행됩니다(`sh -lc` 사용). 네트워크 송신, 쓰기 가능한 루트, 루트 사용자가 필요합니다.

**컨테이너 기본값은 `network: "none"`**입니다 — 에이전트에 외부 액세스가 필요하면 `"bridge"`(또는 사용자 지정 브리지 네트워크)로 설정하세요.
`"host"`는 차단됩니다. `"container:<id>"`는 기본적으로 차단되며,
명시적으로 `sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`를 설정한 경우에만 허용됩니다(긴급 예외).

**인바운드 첨부 파일**은 활성 워크스페이스의 `media/inbound/*`에 스테이징됩니다.

**`docker.binds`**는 추가 호스트 디렉터리를 마운트하며, 전역 및 에이전트별 bind는 병합됩니다.

**샌드박스 브라우저** (`sandbox.browser.enabled`): 컨테이너 내 Chromium + CDP입니다. noVNC URL이 시스템 프롬프트에 주입됩니다. `openclaw.json`에서 `browser.enabled`가 필요하지 않습니다.
noVNC 관찰자 액세스는 기본적으로 VNC 인증을 사용하며, OpenClaw는 공유 URL에 비밀번호를 노출하는 대신 수명이 짧은 토큰 URL을 출력합니다.

- `allowHostControl: false`(기본값)는 샌드박스 세션이 호스트 브라우저를 대상으로 하는 것을 차단합니다.
- `network`의 기본값은 `openclaw-sandbox-browser`(전용 브리지 네트워크)입니다. 전역 브리지 연결이 명시적으로 필요할 때만 `bridge`로 설정하세요.
- `cdpSourceRange`는 선택적으로 컨테이너 경계에서 CDP 인바운드를 CIDR 범위(예: `172.21.0.1/32`)로 제한합니다.
- `sandbox.browser.binds`는 추가 호스트 디렉터리를 샌드박스 브라우저 컨테이너에만 마운트합니다. 설정되면(`[]` 포함) 브라우저 컨테이너에서는 `docker.binds`를 대체합니다.
- 시작 기본값은 `scripts/sandbox-browser-entrypoint.sh`에 정의되어 있으며 컨테이너 호스트에 맞게 조정되어 있습니다:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions`(기본적으로 활성화됨)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`는
    기본적으로 활성화되며, WebGL/3D 사용에 필요하면
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`으로 비활성화할 수 있습니다.
  - 워크플로가 확장 프로그램에 의존하는 경우
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`으로 다시 활성화할 수 있습니다.
  - `--renderer-process-limit=2`는
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`으로 변경할 수 있으며,
    Chromium의 기본 프로세스 제한을 사용하려면 `0`으로 설정하세요.
  - 또한 `noSandbox`가 활성화된 경우 `--no-sandbox`가 추가됩니다.
  - 기본값은 컨테이너 이미지 기준값이므로, 컨테이너 기본값을 변경하려면
    사용자 지정 엔트리포인트가 있는 사용자 지정 브라우저 이미지를 사용하세요.

</Accordion>

브라우저 샌드박싱과 `sandbox.docker.binds`는 Docker 전용입니다.

이미지 빌드:

```bash
scripts/sandbox-setup.sh           # 메인 샌드박스 이미지
scripts/sandbox-browser-setup.sh   # 선택적 브라우저 이미지
```

### `agents.list` (에이전트별 재정의)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // 또는 { primary, fallbacks }
        thinkingDefault: "high", // 에이전트별 사고 수준 재정의
        reasoningDefault: "on", // 에이전트별 추론 표시 재정의
        fastModeDefault: false, // 에이전트별 빠른 모드 재정의
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // 일치하는 defaults.models params를 키 기준으로 재정의
        skills: ["docs-search"], // 설정되면 agents.defaults.skills를 대체
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: 안정적인 에이전트 id(필수)입니다.
- `default`: 여러 개가 설정되면 첫 번째가 우선합니다(경고 기록). 아무것도 설정되지 않으면 첫 번째 목록 항목이 기본값입니다.
- `model`: 문자열 형식은 `primary`만 재정의하고, 객체 형식 `{ primary, fallbacks }`는 둘 다 재정의합니다(`[]`는 전역 대체 모델 비활성화). `primary`만 재정의하는 Cron 작업도 `fallbacks: []`를 설정하지 않으면 기본 대체 모델을 계속 상속합니다.
- `params`: 선택된 모델 항목 위에 병합되는 에이전트별 스트림 params입니다. 전체 모델 카탈로그를 복제하지 않고도 `cacheRetention`, `temperature`, `maxTokens` 같은 에이전트별 재정의에 사용하세요.
- `skills`: 선택적 에이전트별 Skills 허용 목록입니다. 생략하면 설정된 경우 에이전트는 `agents.defaults.skills`를 상속합니다. 명시적 목록은 병합하지 않고 기본값을 대체하며, `[]`는 Skills 없음입니다.
- `thinkingDefault`: 선택적 에이전트별 기본 사고 수준(`off | minimal | low | medium | high | xhigh | adaptive | max`)입니다. 메시지별 또는 세션별 재정의가 없을 때 이 에이전트의 `agents.defaults.thinkingDefault`를 재정의합니다. 선택된 provider/model 프로필이 유효한 값을 제어합니다. Google Gemini에서는 `adaptive`가 provider 소유 동적 사고를 유지합니다(Gemini 3/3.1에서는 `thinkingLevel` 생략, Gemini 2.5에서는 `thinkingBudget: -1`).
- `reasoningDefault`: 선택적 에이전트별 기본 추론 표시(`on | off | stream`)입니다. 메시지별 또는 세션별 추론 재정의가 없을 때 적용됩니다.
- `fastModeDefault`: 선택적 에이전트별 빠른 모드 기본값(`true | false`)입니다. 메시지별 또는 세션별 빠른 모드 재정의가 없을 때 적용됩니다.
- `embeddedHarness`: 선택적 에이전트별 저수준 harness 정책 재정의입니다. `{ runtime: "codex" }`를 사용하면 하나의 에이전트만 Codex 전용으로 만들고 다른 에이전트는 `auto` 모드의 기본 PI 대체를 유지할 수 있습니다.
- `runtime`: 선택적 에이전트별 런타임 설명자입니다. 에이전트가 기본적으로 ACP harness 세션을 사용해야 할 때 `type: "acp"`와 `runtime.acp` 기본값(`agent`, `backend`, `mode`, `cwd`)을 사용하세요.
- `identity.avatar`: 워크스페이스 상대 경로, `http(s)` URL 또는 `data:` URI입니다.
- `identity`는 기본값을 파생합니다: `ackReaction`은 `emoji`에서, `mentionPatterns`는 `name`/`emoji`에서 파생됩니다.
- `subagents.allowAgents`: `sessions_spawn`용 에이전트 id 허용 목록입니다(`["*"]` = 아무 에이전트나; 기본값: 동일한 에이전트만).
- 샌드박스 상속 가드: 요청 세션이 샌드박스에 있으면 `sessions_spawn`은 샌드박스 없이 실행될 대상을 거부합니다.
- `subagents.requireAgentId`: true이면 `agentId`를 생략한 `sessions_spawn` 호출을 차단합니다(명시적인 프로필 선택 강제, 기본값: false).

---

## 멀티 에이전트 라우팅

하나의 Gateway 안에서 여러 격리된 에이전트를 실행합니다. [멀티 에이전트](/ko/concepts/multi-agent)를 참조하세요.

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### 바인딩 일치 필드

- `type`(선택 사항): 일반 라우팅용 `route`(`type`이 없으면 기본적으로 route), 영구 ACP 대화 바인딩용 `acp`
- `match.channel`(필수)
- `match.accountId`(선택 사항; `*` = 모든 계정, 생략 = 기본 계정)
- `match.peer`(선택 사항; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId`(선택 사항; 채널별)
- `acp`(선택 사항; `type: "acp"`일 때만): `{ mode, label, cwd, backend }`

**결정적 일치 순서:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`(정확히 일치, peer/guild/team 없음)
5. `match.accountId: "*"`(채널 전체)
6. 기본 에이전트

같은 계층 내에서는 첫 번째로 일치하는 `bindings` 항목이 우선합니다.

`type: "acp"` 항목의 경우 OpenClaw는 정확한 대화 식별자(`match.channel` + account + `match.peer.id`)로 확인하며 위의 route 바인딩 계층 순서를 사용하지 않습니다.

### 에이전트별 액세스 프로필

<Accordion title="전체 액세스(샌드박스 없음)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="읽기 전용 도구 + 워크스페이스">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="파일 시스템 액세스 없음(메시징 전용)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

우선순위 세부 정보는 [멀티 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools)를 참조하세요.

---

## 세션

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // 이 토큰 수를 초과하면 부모 스레드 포크를 건너뜀(0이면 비활성화)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // 기간 또는 false
      maxDiskBytes: "500mb", // 선택적 하드 예산
      highWaterBytes: "400mb", // 선택적 정리 목표치
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // 기본 비활성 자동 포커스 해제 시간(시간 단위, `0`이면 비활성화)
      maxAgeHours: 0, // 기본 하드 최대 사용 기간(시간 단위, `0`이면 비활성화)
    },
    mainKey: "main", // 레거시(런타임은 항상 "main" 사용)
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="세션 필드 세부 정보">

- **`scope`**: 그룹 채팅 컨텍스트의 기본 세션 그룹화 전략입니다.
  - `per-sender`(기본값): 채널 컨텍스트 내에서 각 발신자는 격리된 세션을 가집니다.
  - `global`: 채널 컨텍스트의 모든 참여자가 하나의 세션을 공유합니다(공유 컨텍스트가 의도된 경우에만 사용).
- **`dmScope`**: DM을 그룹화하는 방식입니다.
  - `main`: 모든 DM이 메인 세션을 공유합니다.
  - `per-peer`: 채널 전반에서 발신자 id별로 격리합니다.
  - `per-channel-peer`: 채널 + 발신자별로 격리합니다(멀티 사용자 받은편지함에 권장).
  - `per-account-channel-peer`: 계정 + 채널 + 발신자별로 격리합니다(멀티 계정에 권장).
- **`identityLinks`**: 채널 간 세션 공유를 위해 정규 id를 provider 접두사가 붙은 peer에 매핑합니다.
- **`reset`**: 기본 재설정 정책입니다. `daily`는 로컬 시간 `atHour`에 재설정하고, `idle`은 `idleMinutes` 후 재설정합니다. 둘 다 구성된 경우 먼저 만료되는 쪽이 우선합니다.
- **`resetByType`**: 유형별 재정의(`direct`, `group`, `thread`)입니다. 레거시 `dm`은 `direct`의 별칭으로 허용됩니다.
- **`parentForkMaxTokens`**: 포크된 스레드 세션을 만들 때 허용되는 부모 세션 `totalTokens`의 최대값입니다(기본값 `100000`).
  - 부모 `totalTokens`가 이 값을 초과하면 OpenClaw는 부모 transcript 기록을 상속하는 대신 새 스레드 세션을 시작합니다.
  - 이 가드를 비활성화하고 항상 부모 포크를 허용하려면 `0`으로 설정하세요.
- **`mainKey`**: 레거시 필드입니다. 런타임은 메인 direct-chat 버킷에 항상 `"main"`을 사용합니다.
- **`agentToAgent.maxPingPongTurns`**: 에이전트 간 교환 중 에이전트 사이에 허용되는 최대 응답 왕복 턴 수입니다(정수, 범위: `0`–`5`). `0`이면 핑퐁 체이닝을 비활성화합니다.
- **`sendPolicy`**: `channel`, `chatType`(`direct|group|channel`, 레거시 `dm` 별칭 포함), `keyPrefix`, 또는 `rawKeyPrefix`로 일치시킵니다. 첫 번째 deny가 우선합니다.
- **`maintenance`**: 세션 저장소 정리 및 보존 제어입니다.
  - `mode`: `warn`은 경고만 출력하고, `enforce`는 정리를 적용합니다.
  - `pruneAfter`: 오래된 항목에 대한 보존 기간 기준값입니다(기본값 `30d`).
  - `maxEntries`: `sessions.json`의 최대 항목 수입니다(기본값 `500`).
  - `rotateBytes`: `sessions.json`이 이 크기를 초과하면 교체합니다(기본값 `10mb`).
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript 아카이브의 보존 기간입니다. 기본값은 `pruneAfter`이며, 비활성화하려면 `false`로 설정합니다.
  - `maxDiskBytes`: 선택적 세션 디렉터리 디스크 예산입니다. `warn` 모드에서는 경고를 기록하고, `enforce` 모드에서는 가장 오래된 아티팩트/세션부터 제거합니다.
  - `highWaterBytes`: 예산 정리 후의 선택적 목표치입니다. 기본값은 `maxDiskBytes`의 `80%`입니다.
- **`threadBindings`**: 스레드 바인딩 세션 기능의 전역 기본값입니다.
  - `enabled`: 마스터 기본 스위치(provider가 재정의 가능, Discord는 `channels.discord.threadBindings.enabled` 사용)
  - `idleHours`: 기본 비활성 자동 포커스 해제 시간(시간 단위, `0`이면 비활성화, provider가 재정의 가능)
  - `maxAgeHours`: 기본 하드 최대 사용 기간(시간 단위, `0`이면 비활성화, provider가 재정의 가능)

</Accordion>

---

## 메시지

```json5
{
  messages: {
    responsePrefix: "🦞", // 또는 "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0이면 비활성화
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 응답 접두사

채널/계정별 재정의: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

확인 순서(가장 구체적인 것이 우선): 계정 → 채널 → 전역. `""`는 비활성화하고 상위 확인도 중단합니다. `"auto"`는 `[{identity.name}]`을 생성합니다.

**템플릿 변수:**

| 변수              | 설명                 | 예시                        |
| ----------------- | -------------------- | --------------------------- |
| `{model}`         | 짧은 모델 이름       | `claude-opus-4-6`           |
| `{modelFull}`     | 전체 모델 식별자     | `anthropic/claude-opus-4-6` |
| `{provider}`      | provider 이름        | `anthropic`                 |
| `{thinkingLevel}` | 현재 사고 수준       | `high`, `low`, `off`        |
| `{identity.name}` | 에이전트 identity 이름 | (`"auto"`와 동일)         |

변수는 대소문자를 구분하지 않습니다. `{think}`는 `{thinkingLevel}`의 별칭입니다.

### 확인 반응

- 기본값은 활성 에이전트의 `identity.emoji`이며, 없으면 `"👀"`입니다. 비활성화하려면 `""`로 설정하세요.
- 채널별 재정의: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- 확인 순서: 계정 → 채널 → `messages.ackReaction` → identity 대체값.
- 범위: `group-mentions`(기본값), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: Slack, Discord, Telegram에서 응답 후 확인 반응을 제거합니다.
- `messages.statusReactions.enabled`: Slack, Discord, Telegram에서 수명 주기 상태 반응을 활성화합니다.
  Slack과 Discord에서는 설정하지 않으면 확인 반응이 활성화된 경우 상태 반응도 활성화된 상태로 유지됩니다.
  Telegram에서는 수명 주기 상태 반응을 활성화하려면 이를 명시적으로 `true`로 설정해야 합니다.

### 인바운드 디바운스

같은 발신자의 빠른 텍스트 전용 메시지를 하나의 에이전트 턴으로 묶습니다. 미디어/첨부 파일은 즉시 플러시됩니다. 제어 명령은 디바운스를 우회합니다.

### TTS(텍스트 음성 변환)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto`는 기본 자동 TTS 모드를 제어합니다: `off`, `always`, `inbound`, 또는 `tagged`. `/tts on|off`는 로컬 설정을 재정의할 수 있으며, `/tts status`는 실제 상태를 보여줍니다.
- `summaryModel`은 자동 요약에 대해 `agents.defaults.model.primary`를 재정의합니다.
- `modelOverrides`는 기본적으로 활성화되며, `modelOverrides.allowProvider`의 기본값은 `false`입니다(옵트인).
- API 키는 `ELEVENLABS_API_KEY`/`XI_API_KEY` 및 `OPENAI_API_KEY`로 대체될 수 있습니다.
- 번들된 음성 provider는 Plugin이 관리합니다. `plugins.allow`가 설정된 경우 사용하려는 각 TTS provider Plugin을 포함하세요. 예: Edge TTS용 `microsoft`. 레거시 `edge` provider id는 `microsoft`의 별칭으로 허용됩니다.
- `providers.openai.baseUrl`은 OpenAI TTS 엔드포인트를 재정의합니다. 확인 순서는 config, 그다음 `OPENAI_TTS_BASE_URL`, 그다음 `https://api.openai.com/v1`입니다.
- `providers.openai.baseUrl`이 OpenAI가 아닌 엔드포인트를 가리키면 OpenClaw는 이를 OpenAI 호환 TTS 서버로 처리하고 모델/음성 검증을 완화합니다.

---

## 대화

대화 모드(macOS/iOS/Android)의 기본값입니다.

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider`는 여러 대화 provider가 구성된 경우 `talk.providers`의 키와 일치해야 합니다.
- 레거시 평면 대화 키(`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`)는 호환성 전용이며 `talk.providers.<provider>`로 자동 마이그레이션됩니다.
- Voice ID는 `ELEVENLABS_VOICE_ID` 또는 `SAG_VOICE_ID`로 대체될 수 있습니다.
- `providers.*.apiKey`는 일반 텍스트 문자열 또는 SecretRef 객체를 허용합니다.
- `ELEVENLABS_API_KEY` 대체는 대화 API 키가 구성되지 않은 경우에만 적용됩니다.
- `providers.*.voiceAliases`를 사용하면 대화 지시문에서 친숙한 이름을 사용할 수 있습니다.
- `providers.mlx.modelId`는 macOS 로컬 MLX helper가 사용하는 Hugging Face 리포지토리를 선택합니다. 생략하면 macOS는 `mlx-community/Soprano-80M-bf16`를 사용합니다.
- macOS MLX 재생은 번들된 `openclaw-mlx-tts` helper가 있으면 이를 통해 실행되고, 없으면 `PATH`의 실행 파일을 사용합니다. 개발용으로 helper 경로를 재정의하려면 `OPENCLAW_MLX_TTS_BIN`을 사용하세요.
- `silenceTimeoutMs`는 사용자 침묵 후 transcript를 보내기 전까지 대화 모드가 대기하는 시간을 제어합니다. 설정하지 않으면 플랫폼 기본 일시정지 창을 유지합니다(`macOS와 Android는 700 ms, iOS는 900 ms`).

---

## 관련 항목

- [구성 참조](/ko/gateway/configuration-reference) — 다른 모든 구성 키
- [구성](/ko/gateway/configuration) — 일반적인 작업 및 빠른 설정
- [구성 예시](/ko/gateway/configuration-examples)
