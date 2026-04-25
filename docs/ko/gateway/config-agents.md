---
read_when:
    - agent 기본값 튜닝(model, thinking, workspace, Heartbeat, 미디어, Skills)
    - 다중 agent 라우팅 및 바인딩 구성
    - 세션, 메시지 전달, talk 모드 동작 조정
summary: agent 기본값, 다중 agent 라우팅, 세션, 메시지, talk 구성
title: 구성 — agent
x-i18n:
    generated_at: "2026-04-25T12:25:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5b3adcd4c809595a51ffd536fc62d9f72ac16fe249b6e23ee0560bc4076eba5
    source_path: gateway/config-agents.md
    workflow: 15
---

`agents.*`, `multiAgent.*`, `session.*`,
`messages.*`, `talk.*` 아래의 agent 범위 구성 키입니다. 채널, tool, gateway 런타임 및 기타
최상위 키는 [구성 참고 문서](/ko/gateway/configuration-reference)를 참조하세요.

## agent 기본값

### `agents.defaults.workspace`

기본값: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

시스템 프롬프트의 Runtime 줄에 표시되는 선택적 저장소 루트입니다. 설정하지 않으면 OpenClaw이 workspace에서 상위로 탐색하며 자동 감지합니다.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills`를 설정하지 않은 agent에 대한
선택적 기본 Skills 허용 목록입니다.

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

- 기본적으로 Skills를 제한하지 않으려면 `agents.defaults.skills`를 생략하세요.
- 기본값을 상속하려면 `agents.list[].skills`를 생략하세요.
- Skills를 사용하지 않으려면 `agents.list[].skills: []`로 설정하세요.
- 비어 있지 않은 `agents.list[].skills` 목록은 해당 agent의 최종 집합이며,
  기본값과 병합되지 않습니다.

### `agents.defaults.skipBootstrap`

workspace bootstrap 파일(`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)의 자동 생성을 비활성화합니다.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

workspace bootstrap 파일을 언제 시스템 프롬프트에 주입할지 제어합니다. 기본값: `"always"`.

- `"continuation-skip"`: 안전한 연속 턴(assistant 응답이 완료된 후)에서는 workspace bootstrap 재주입을 건너뛰어 프롬프트 크기를 줄입니다. Heartbeat 실행과 Compaction 이후 재시도는 계속 컨텍스트를 다시 구성합니다.
- `"never"`: 모든 턴에서 workspace bootstrap 및 context-file 주입을 비활성화합니다. 프롬프트 수명 주기를 완전히 자체적으로 관리하는 agent(사용자 지정 컨텍스트 엔진, 자체 컨텍스트를 구성하는 네이티브 런타임, 또는 특수한 bootstrap 없는 워크플로)에만 사용하세요. Heartbeat와 Compaction 복구 턴에서도 주입을 건너뜁니다.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

잘리기 전 workspace bootstrap 파일당 최대 문자 수입니다. 기본값: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

모든 workspace bootstrap 파일에 걸쳐 주입되는 전체 최대 문자 수입니다. 기본값: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

bootstrap 컨텍스트가 잘릴 때 agent에 표시되는 경고 텍스트를 제어합니다.
기본값: `"once"`.

- `"off"`: 시스템 프롬프트에 경고 텍스트를 절대 주입하지 않습니다.
- `"once"`: 고유한 잘림 시그니처마다 한 번만 경고를 주입합니다(권장).
- `"always"`: 잘림이 있을 때마다 매 실행마다 경고를 주입합니다.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### 컨텍스트 예산 소유 맵

OpenClaw에는 대용량 프롬프트/컨텍스트 예산이 여러 개 있으며, 이들은
하나의 일반 설정으로 모두 흐르지 않고 의도적으로 하위 시스템별로 분리되어 있습니다.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  일반 workspace bootstrap 주입.
- `agents.defaults.startupContext.*`:
  최근 일별
  `memory/*.md` 파일을 포함한 일회성 `/new` 및 `/reset` 시작 prelude.
- `skills.limits.*`:
  시스템 프롬프트에 주입되는 축약된 Skills 목록.
- `agents.defaults.contextLimits.*`:
  제한된 런타임 발췌 및 런타임 소유 블록 주입.
- `memory.qmd.limits.*`:
  인덱싱된 메모리 검색 스니펫 및 주입 크기 조정.

특정 agent 하나에만 다른
예산이 필요할 때만 해당 agent별 재정의를 사용하세요:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

단독 `/new` 및 `/reset`
실행에서 주입되는 첫 턴 시작 prelude를 제어합니다.

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

제한된 런타임 컨텍스트 표면을 위한 공통 기본값입니다.

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

- `memoryGetMaxChars`: 잘림 메타데이터 및 연속 알림이 추가되기 전
  기본 `memory_get` 발췌 상한입니다.
- `memoryGetDefaultLines`: `lines`가
  생략되었을 때의 기본 `memory_get` 줄 범위입니다.
- `toolResultMaxChars`: 저장된 결과 및
  오버플로 복구에 사용되는 실시간 tool 결과 상한입니다.
- `postCompactionMaxChars`: Compaction 후
  새로 고침 주입 중 사용되는 AGENTS.md 발췌 상한입니다.

#### `agents.list[].contextLimits`

공유 `contextLimits` 설정에 대한 agent별 재정의입니다. 생략된 필드는
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

시스템 프롬프트에 주입되는 축약된 Skills 목록의 전역 상한입니다. 이는 필요 시 `SKILL.md` 파일을 읽는 동작에는 영향을 주지 않습니다.

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

Skills 프롬프트 예산에 대한 agent별 재정의입니다.

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

provider 호출 전 transcript/tool 이미지 블록에서 가장 긴 이미지 변의 최대 픽셀 크기입니다.
기본값: `1200`.

값을 낮추면 일반적으로 스크린샷이 많은 실행에서 비전 토큰 사용량과 요청 페이로드 크기가 줄어듭니다.
값을 높이면 더 많은 시각적 세부 정보가 유지됩니다.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

시스템 프롬프트 컨텍스트용 시간대입니다(메시지 타임스탬프가 아님). 호스트 시간대로 대체됩니다.

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

- `model`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - 문자열 형식은 기본 model만 설정합니다.
  - 객체 형식은 기본 model과 순서가 있는 장애 조치 model을 함께 설정합니다.
- `imageModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - `image` tool 경로에서 비전 model 구성으로 사용됩니다.
  - 선택된/기본 model이 이미지 입력을 받을 수 없을 때 대체 라우팅에도 사용됩니다.
- `imageGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - 공유 이미지 생성 capability 및 향후 이미지를 생성하는 모든 tool/Plugin 표면에서 사용됩니다.
  - 일반적인 값: 기본 Gemini 이미지 생성을 위한 `google/gemini-3.1-flash-image-preview`, fal용 `fal/fal-ai/flux/dev`, OpenAI Images용 `openai/gpt-image-2`.
  - provider/model을 직접 선택하는 경우 일치하는 provider 인증도 함께 구성하세요(예: `google/*`용 `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`, `openai/gpt-image-2`용 `OPENAI_API_KEY` 또는 OpenAI Codex OAuth, `fal/*`용 `FAL_KEY`).
  - 생략하더라도 `image_generate`는 인증이 설정된 기본 provider를 추론할 수 있습니다. 현재 기본 provider를 먼저 시도한 뒤, 나머지 등록된 이미지 생성 provider를 provider id 순서대로 시도합니다.
- `musicGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - 공유 음악 생성 capability와 내장 `music_generate` tool에서 사용됩니다.
  - 일반적인 값: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, `minimax/music-2.6`.
  - 생략하더라도 `music_generate`는 인증이 설정된 기본 provider를 추론할 수 있습니다. 현재 기본 provider를 먼저 시도한 뒤, 나머지 등록된 음악 생성 provider를 provider id 순서대로 시도합니다.
  - provider/model을 직접 선택하는 경우 일치하는 provider 인증/API 키도 함께 구성하세요.
- `videoGenerationModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - 공유 비디오 생성 capability와 내장 `video_generate` tool에서 사용됩니다.
  - 일반적인 값: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, `qwen/wan2.7-r2v`.
  - 생략하더라도 `video_generate`는 인증이 설정된 기본 provider를 추론할 수 있습니다. 현재 기본 provider를 먼저 시도한 뒤, 나머지 등록된 비디오 생성 provider를 provider id 순서대로 시도합니다.
  - provider/model을 직접 선택하는 경우 일치하는 provider 인증/API 키도 함께 구성하세요.
  - 번들된 Qwen 비디오 생성 provider는 최대 출력 비디오 1개, 입력 이미지 1개, 입력 비디오 4개, 최대 10초 길이, 그리고 provider 수준의 `size`, `aspectRatio`, `resolution`, `audio`, `watermark` 옵션을 지원합니다.
- `pdfModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  - `pdf` tool의 model 라우팅에 사용됩니다.
  - 생략하면 PDF tool은 `imageModel`, 그다음 확인된 세션/기본 model로 대체됩니다.
- `pdfMaxBytesMb`: 호출 시 `maxBytesMb`가 전달되지 않았을 때 `pdf` tool에 적용되는 기본 PDF 크기 제한입니다.
- `pdfMaxPages`: `pdf` tool의 추출 대체 모드에서 고려하는 기본 최대 페이지 수입니다.
- `verboseDefault`: agent의 기본 상세 출력 수준입니다. 값: `"off"`, `"on"`, `"full"`. 기본값: `"off"`.
- `elevatedDefault`: agent의 기본 확장 출력 수준입니다. 값: `"off"`, `"on"`, `"ask"`, `"full"`. 기본값: `"on"`.
- `model.primary`: 형식은 `provider/model`입니다(예: API 키 액세스용 `openai/gpt-5.4`, Codex OAuth용 `openai-codex/gpt-5.5`). provider를 생략하면 OpenClaw은 먼저 별칭을 시도하고, 그다음 해당 정확한 model id에 대한 고유한 구성된 provider 일치를 찾은 뒤, 마지막으로 구성된 기본 provider로 대체합니다(이 동작은 더 이상 권장되지 않는 호환성용이므로 명시적인 `provider/model`을 권장합니다). 해당 provider가 더 이상 구성된 기본 model을 노출하지 않으면, OpenClaw은 오래되어 제거된 provider 기본값을 그대로 노출하는 대신 첫 번째로 구성된 provider/model로 대체합니다.
- `models`: `/model`용 구성된 model catalog 및 허용 목록입니다. 각 항목에는 `alias`(단축 이름)와 `params`(provider별 설정, 예: `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `extra_body`/`extraBody`)를 포함할 수 있습니다.
  - 안전한 수정: `openclaw config set agents.defaults.models '<json>' --strict-json --merge`를 사용해 항목을 추가하세요. `config set`은 `--replace`를 전달하지 않으면 기존 허용 목록 항목을 제거하는 교체를 거부합니다.
  - provider 범위 configure/onboarding 흐름은 선택된 provider model을 이 맵에 병합하고, 이미 구성된 관련 없는 provider는 그대로 유지합니다.
  - 직접 OpenAI Responses model을 사용할 때는 서버 측 Compaction이 자동으로 활성화됩니다. `context_management` 주입을 중단하려면 `params.responsesServerCompaction: false`를 사용하고, 임계값을 재정의하려면 `params.responsesCompactThreshold`를 사용하세요. 자세한 내용은 [OpenAI 서버 측 Compaction](/ko/providers/openai#server-side-compaction-responses-api)을 참조하세요.
- `params`: 모든 model에 적용되는 전역 기본 provider 매개변수입니다. `agents.defaults.params`에서 설정합니다(예: `{ cacheRetention: "long" }`).
- `params` 병합 우선순위(config): `agents.defaults.params`(전역 기본값)는 `agents.defaults.models["provider/model"].params`(model별)로 재정의되고, 그다음 `agents.list[].params`(일치하는 agent id)가 키별로 재정의합니다. 자세한 내용은 [프롬프트 캐싱](/ko/reference/prompt-caching)을 참조하세요.
- `params.extra_body`/`params.extraBody`: OpenAI 호환 프록시의 `api: "openai-completions"` 요청 본문에 병합되는 고급 전달 JSON입니다. 생성된 요청 키와 충돌하면 extra body가 우선합니다. 네이티브 completions가 아닌 경로에서는 이후에도 OpenAI 전용 `store`가 제거됩니다.
- `embeddedHarness`: 기본 저수준 내장 agent 런타임 정책입니다. runtime을 생략하면 OpenClaw Pi가 기본값입니다. 내장 PI harness를 강제하려면 `runtime: "pi"`를, 등록된 Plugin harness가 지원하는 model을 처리하도록 허용하려면 `runtime: "auto"`를, 또는 `runtime: "codex"` 같은 등록된 harness id를 사용하세요. 자동 PI 대체를 비활성화하려면 `fallback: "none"`을 설정하세요. `codex` 같은 명시적 Plugin runtime은 같은 재정의 범위에서 `fallback: "pi"`를 설정하지 않으면 기본적으로 닫힌 실패(fail closed) 동작을 합니다. model 참조는 `provider/model`의 표준 형식을 유지하고, Codex, Claude CLI, Gemini CLI 및 기타 실행 백엔드는 레거시 runtime provider 접두사 대신 runtime 구성을 통해 선택하세요. provider/model 선택과의 차이점은 [Agent 런타임](/ko/concepts/agent-runtimes)을 참조하세요.
- 이러한 필드를 변경하는 config 작성기(예: `/models set`, `/models set-image`, 장애 조치 추가/제거 명령)는 가능한 경우 표준 객체 형식으로 저장하고 기존 장애 조치 목록을 보존합니다.
- `maxConcurrent`: 세션 전체에서 병렬 agent 실행의 최대 수입니다(각 세션은 여전히 직렬화됨). 기본값: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness`는 내장 agent 턴을 실행할 저수준 실행기를 제어합니다.
대부분의 배포는 기본 OpenClaw Pi 런타임을 유지해야 합니다.
번들된
Codex app-server harness처럼 신뢰할 수 있는 Plugin이 네이티브 harness를 제공할 때 사용하세요. 개념적 모델은
[Agent 런타임](/ko/concepts/agent-runtimes)을 참조하세요.

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

- `runtime`: `"auto"`, `"pi"` 또는 등록된 Plugin harness id입니다. 번들된 Codex Plugin은 `codex`를 등록합니다.
- `fallback`: `"pi"` 또는 `"none"`입니다. `runtime: "auto"`에서는 fallback을 생략하면 기본값이 `"pi"`이므로, 이전 config는 어떤 Plugin harness도 실행을 맡지 않을 때 계속 PI를 사용할 수 있습니다. `runtime: "codex"` 같은 명시적 Plugin runtime 모드에서는 fallback을 생략하면 기본값이 `"none"`이므로, harness가 없을 경우 조용히 PI를 사용하는 대신 실패합니다. runtime 재정의는 더 넓은 범위의 fallback을 상속하지 않습니다. 의도적으로 해당 호환성 fallback을 원한다면 명시적 runtime과 함께 `fallback: "pi"`를 설정하세요. 선택된 Plugin harness 실패는 항상 직접 표시됩니다.
- 환경 변수 재정의: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>`는 `runtime`을 재정의하고, `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none`은 해당 프로세스의 fallback을 재정의합니다.
- Codex 전용 배포에서는 `model: "openai/gpt-5.5"`와 `embeddedHarness.runtime: "codex"`를 설정하세요. 가독성을 위해 `embeddedHarness.fallback: "none"`도 명시적으로 설정할 수 있으며, 이는 명시적 Plugin runtime의 기본값입니다.
- 첫 번째 내장 실행 이후 harness 선택은 세션 id별로 고정됩니다. config/env 변경은 새 세션 또는 재설정된 세션에만 영향을 주며, 기존 transcript에는 영향을 주지 않습니다. transcript 기록은 있지만 고정 기록이 없는 레거시 세션은 PI에 고정된 것으로 처리됩니다. `/status`는 `Runtime: OpenClaw Pi Default` 또는 `Runtime: OpenAI Codex`처럼 실제 런타임을 보고합니다.
- 이는 내장 채팅 harness만 제어합니다. 미디어 생성, 비전, PDF, 음악, 비디오, TTS는 여전히 각각의 provider/model 설정을 사용합니다.

**내장 별칭 단축 이름** (`agents.defaults.models`에 model이 있을 때만 적용):

| Alias               | Model                                              |
| ------------------- | -------------------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`                        |
| `sonnet`            | `anthropic/claude-sonnet-4-6`                      |
| `gpt`               | `openai/gpt-5.4` 또는 구성된 Codex OAuth GPT-5.5 |
| `gpt-mini`          | `openai/gpt-5.4-mini`                              |
| `gpt-nano`          | `openai/gpt-5.4-nano`                              |
| `gemini`            | `google/gemini-3.1-pro-preview`                    |
| `gemini-flash`      | `google/gemini-3-flash-preview`                    |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`             |

사용자가 구성한 별칭은 항상 기본값보다 우선합니다.

Z.AI GLM-4.x model은 `--thinking off`를 설정하거나 `agents.defaults.models["zai/<model>"].params.thinking`을 직접 정의하지 않는 한 자동으로 thinking 모드를 활성화합니다.
Z.AI model은 tool 호출 스트리밍을 위해 기본적으로 `tool_stream`을 활성화합니다. 비활성화하려면 `agents.defaults.models["zai/<model>"].params.tool_stream`을 `false`로 설정하세요.
Anthropic Claude 4.6 model은 명시적인 thinking 수준이 설정되지 않은 경우 기본적으로 `adaptive` thinking을 사용합니다.

### `agents.defaults.cliBackends`

텍스트 전용 대체 실행(tool 호출 없음)을 위한 선택적 CLI 백엔드입니다. API provider가 실패할 때 백업으로 유용합니다.

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
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI 백엔드는 텍스트 우선이며, tool은 항상 비활성화됩니다.
- `sessionArg`가 설정된 경우 세션이 지원됩니다.
- `imageArg`가 파일 경로를 받을 수 있으면 이미지 전달이 지원됩니다.

### `agents.defaults.systemPromptOverride`

OpenClaw이 조합한 전체 시스템 프롬프트를 고정 문자열로 대체합니다. 기본 수준(`agents.defaults.systemPromptOverride`) 또는 agent별(`agents.list[].systemPromptOverride`)로 설정할 수 있습니다. agent별 값이 우선하며, 비어 있거나 공백뿐인 값은 무시됩니다. 통제된 프롬프트 실험에 유용합니다.

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

model 계열별로 적용되는 provider 독립적 프롬프트 오버레이입니다. GPT-5 계열 model id는 provider 전반에 걸쳐 공유 동작 계약을 받으며, `personality`는 친근한 상호작용 스타일 계층만 제어합니다.

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
- `"off"`는 친근한 계층만 비활성화하며, 태그된 GPT-5 동작 계약은 계속 활성화됩니다.
- 이 공유 설정이 지정되지 않은 경우 레거시 `plugins.entries.openai.config.personality`도 계속 읽습니다.

### `agents.defaults.heartbeat`

주기적인 Heartbeat 실행입니다.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
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
- `includeSystemPromptSection`: false이면 시스템 프롬프트에서 Heartbeat 섹션을 생략하고 bootstrap 컨텍스트에 `HEARTBEAT.md`를 주입하지 않습니다. 기본값: `true`.
- `suppressToolErrorWarnings`: true이면 Heartbeat 실행 중 tool 오류 경고 페이로드를 숨깁니다.
- `timeoutSeconds`: Heartbeat agent 턴이 중단되기 전까지 허용되는 최대 시간(초)입니다. 설정하지 않으면 `agents.defaults.timeoutSeconds`를 사용합니다.
- `directPolicy`: direct/DM 전달 정책입니다. `allow`(기본값)은 direct 대상 전달을 허용합니다. `block`은 direct 대상 전달을 막고 `reason=dm-blocked`를 발생시킵니다.
- `lightContext`: true이면 Heartbeat 실행에서 경량 bootstrap 컨텍스트를 사용하며 workspace bootstrap 파일 중 `HEARTBEAT.md`만 유지합니다.
- `isolatedSession`: true이면 각 Heartbeat가 이전 대화 기록 없이 새 세션에서 실행됩니다. Cron의 `sessionTarget: "isolated"`와 같은 격리 패턴입니다. Heartbeat당 토큰 비용을 약 100K에서 약 2~5K 토큰으로 줄입니다.
- agent별 설정: `agents.list[].heartbeat`를 사용합니다. 어떤 agent든 `heartbeat`를 정의하면 **해당 agent들만** Heartbeat를 실행합니다.
- Heartbeat는 전체 agent 턴을 실행하므로, 간격이 짧을수록 더 많은 토큰을 소모합니다.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
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

- `mode`: `default` 또는 `safeguard`(긴 기록을 위한 청크 단위 요약)입니다. [Compaction](/ko/concepts/compaction)을 참조하세요.
- `provider`: 등록된 compaction provider Plugin의 id입니다. 설정하면 내장 LLM 요약 대신 provider의 `summarize()`가 호출됩니다. 실패 시 내장 방식으로 대체됩니다. provider를 설정하면 `mode: "safeguard"`가 강제됩니다. [Compaction](/ko/concepts/compaction)을 참조하세요.
- `timeoutSeconds`: OpenClaw이 중단하기 전 단일 Compaction 작업에 허용되는 최대 초 수입니다. 기본값: `900`.
- `keepRecentTokens`: 가장 최근 transcript 꼬리 부분을 원문 그대로 유지하기 위한 Pi cut-point 예산입니다. 수동 `/compact`는 명시적으로 설정된 경우 이 값을 따르며, 그렇지 않으면 수동 Compaction은 하드 체크포인트입니다.
- `identifierPolicy`: `strict`(기본값), `off`, 또는 `custom`입니다. `strict`는 Compaction 요약 중 불투명 식별자 유지에 대한 내장 지침을 앞에 추가합니다.
- `identifierInstructions`: `identifierPolicy=custom`일 때 사용되는 선택적 사용자 지정 식별자 보존 텍스트입니다.
- `qualityGuard`: safeguard 요약의 잘못된 출력에 대한 재시도 검사입니다. safeguard 모드에서는 기본적으로 활성화되며, 검사를 건너뛰려면 `enabled: false`로 설정하세요.
- `postCompactionSections`: Compaction 후 다시 주입할 선택적 AGENTS.md H2/H3 섹션 이름입니다. 기본값은 `["Session Startup", "Red Lines"]`이며, 다시 주입하지 않으려면 `[]`로 설정하세요. 설정하지 않았거나 해당 기본 쌍으로 명시한 경우 이전 `Every Session`/`Safety` 제목도 레거시 대체값으로 허용됩니다.
- `model`: Compaction 요약에만 적용되는 선택적 `provider/model-id` 재정의입니다. 메인 세션은 한 model을 유지하되 Compaction 요약은 다른 model에서 실행하려는 경우 사용합니다. 설정하지 않으면 Compaction은 세션의 기본 model을 사용합니다.
- `notifyUser`: `true`이면 Compaction 시작 및 완료 시 사용자에게 짧은 알림을 보냅니다(예: `"Compacting context..."`, `"Compaction complete"`). 기본적으로 비활성화되어 Compaction을 조용히 수행합니다.
- `memoryFlush`: 자동 Compaction 전에 지속 메모리를 저장하기 위한 조용한 agent 턴입니다. workspace가 읽기 전용이면 건너뜁니다.

### `agents.defaults.contextPruning`

LLM으로 보내기 전에 메모리 내 컨텍스트에서 **오래된 tool 결과**를 가지치기합니다. 디스크에 있는 세션 기록은 **수정하지 않습니다**.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
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

- `mode: "cache-ttl"`은 가지치기 패스를 활성화합니다.
- `ttl`은 마지막 캐시 터치 이후 언제 다시 가지치기를 실행할 수 있는지 제어합니다.
- 가지치기는 먼저 큰 tool 결과를 소프트 트림하고, 필요하면 더 오래된 tool 결과를 하드 클리어합니다.

**소프트 트림**은 앞부분 + 뒷부분을 유지하고 중간에 `...`를 삽입합니다.

**하드 클리어**는 전체 tool 결과를 placeholder로 대체합니다.

참고:

- 이미지 블록은 절대 트림/클리어되지 않습니다.
- 비율은 정확한 토큰 수가 아니라 문자 기반의 대략적인 값입니다.
- `keepLastAssistants`보다 assistant 메시지가 적으면 가지치기는 건너뜁니다.

</Accordion>

동작 세부 정보는 [세션 가지치기](/ko/concepts/session-pruning)를 참조하세요.

### 블록 스트리밍

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Telegram이 아닌 채널에서는 블록 응답을 활성화하려면 명시적으로 `*.blockStreaming: true`가 필요합니다.
- 채널 재정의: `channels.<channel>.blockStreamingCoalesce`(및 계정별 변형). Signal/Slack/Discord/Google Chat의 기본값은 `minChars: 1500`입니다.
- `humanDelay`: 블록 응답 사이의 무작위 지연입니다. `natural` = 800–2500ms. agent별 재정의: `agents.list[].humanDelay`.

동작 및 청킹 세부 정보는 [스트리밍](/ko/concepts/streaming)을 참조하세요.

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

- 기본값: direct 채팅/멘션은 `instant`, 멘션되지 않은 그룹 채팅은 `message`.
- 세션별 재정의: `session.typingMode`, `session.typingIntervalSeconds`.

[입력 중 표시기](/ko/concepts/typing-indicators)를 참조하세요.

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

내장 agent를 위한 선택적 sandboxing입니다. 전체 가이드는 [Sandboxing](/ko/gateway/sandboxing)을 참조하세요.

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
          // SecretRefs / inline contents also supported:
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

<Accordion title="Sandbox 세부 정보">

**백엔드:**

- `docker`: 로컬 Docker 런타임(기본값)
- `ssh`: 일반 SSH 기반 원격 런타임
- `openshell`: OpenShell 런타임

`backend: "openshell"`을 선택한 경우 런타임별 설정은
`plugins.entries.openshell.config`로 이동합니다.

**SSH 백엔드 구성:**

- `target`: `user@host[:port]` 형식의 SSH 대상
- `command`: SSH 클라이언트 명령(기본값: `ssh`)
- `workspaceRoot`: 범위별 workspace에 사용되는 절대 원격 루트
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH에 전달되는 기존 로컬 파일
- `identityData` / `certificateData` / `knownHostsData`: OpenClaw이 런타임에 임시 파일로 구체화하는 인라인 내용 또는 SecretRef
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH host-key 정책 설정

**SSH 인증 우선순위:**

- `identityData`가 `identityFile`보다 우선합니다.
- `certificateData`가 `certificateFile`보다 우선합니다.
- `knownHostsData`가 `knownHostsFile`보다 우선합니다.
- SecretRef 기반 `*Data` 값은 sandbox 세션이 시작되기 전에 활성 secrets 런타임 스냅샷에서 확인됩니다.

**SSH 백엔드 동작:**

- 생성 또는 재생성 후 원격 workspace를 한 번 시드합니다.
- 그다음 원격 SSH workspace를 기준 상태로 유지합니다.
- `exec`, 파일 tool, 미디어 경로를 SSH를 통해 라우팅합니다.
- 원격 변경 사항을 호스트로 자동 동기화하지 않습니다.
- sandbox 브라우저 컨테이너는 지원하지 않습니다.

**workspace 접근:**

- `none`: `~/.openclaw/sandboxes` 아래의 범위별 sandbox workspace
- `ro`: `/workspace`의 sandbox workspace, `/agent`에 읽기 전용으로 마운트된 agent workspace
- `rw`: `/workspace`에 읽기/쓰기 가능하게 마운트된 agent workspace

**범위:**

- `session`: 세션별 컨테이너 + workspace
- `agent`: agent별 컨테이너 + workspace 1개(기본값)
- `shared`: 공유 컨테이너 및 workspace(세션 간 격리 없음)

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

- `mirror`: 실행 전에 로컬에서 원격으로 시드하고, 실행 후 다시 동기화합니다. 로컬 workspace가 기준 상태로 유지됩니다.
- `remote`: sandbox 생성 시 한 번만 원격으로 시드한 뒤, 원격 workspace를 기준 상태로 유지합니다.

`remote` 모드에서는 시드 단계 후 OpenClaw 외부에서 이루어진 호스트 로컬 편집이 sandbox로 자동 동기화되지 않습니다.
전송은 OpenShell sandbox로의 SSH를 사용하지만, sandbox 수명 주기와 선택적 mirror 동기화는 Plugin이 관리합니다.

**`setupCommand`**는 컨테이너 생성 후 한 번 실행됩니다(`sh -lc` 사용). 네트워크 송신, 쓰기 가능한 루트, 루트 사용자가 필요합니다.

**컨테이너는 기본적으로 `network: "none"`입니다** — agent에 외부 접근이 필요하면 `"bridge"`(또는 사용자 지정 bridge 네트워크)로 설정하세요.
`"host"`는 차단됩니다. `"container:<id>"`도 기본적으로 차단되며,
명시적으로 `sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`를 설정한 경우에만 허용됩니다(비상 탈출 옵션).

**수신 첨부 파일**은 활성 workspace의 `media/inbound/*`로 준비됩니다.

**`docker.binds`**는 추가 호스트 디렉터리를 마운트하며, 전역 및 agent별 bind는 병합됩니다.

**sandbox 브라우저**(`sandbox.browser.enabled`): 컨테이너 내부의 Chromium + CDP입니다. noVNC URL이 시스템 프롬프트에 주입됩니다. `openclaw.json`에서 `browser.enabled`가 필요하지 않습니다.
noVNC 관찰자 접근은 기본적으로 VNC 인증을 사용하며, OpenClaw은 공유 URL에 비밀번호를 노출하는 대신 짧은 수명의 토큰 URL을 발급합니다.

- `allowHostControl: false`(기본값)는 sandbox 세션이 호스트 브라우저를 대상으로 지정하는 것을 차단합니다.
- `network`의 기본값은 `openclaw-sandbox-browser`(전용 bridge 네트워크)입니다. 전역 bridge 연결이 명시적으로 필요할 때만 `bridge`로 설정하세요.
- `cdpSourceRange`는 컨테이너 경계에서 CDP 유입을 CIDR 범위(예: `172.21.0.1/32`)로 제한할 수 있습니다.
- `sandbox.browser.binds`는 추가 호스트 디렉터리를 sandbox 브라우저 컨테이너에만 마운트합니다. 설정되면(`[]` 포함) 브라우저 컨테이너에서는 `docker.binds`를 대체합니다.
- 실행 기본값은 `scripts/sandbox-browser-entrypoint.sh`에 정의되어 있으며 컨테이너 호스트에 맞게 조정되어 있습니다:
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
    기본적으로 활성화되며, WebGL/3D 사용에 필요할 경우
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`으로 비활성화할 수 있습니다.
  - 워크플로에 확장 기능이 필요하면
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`으로 다시 활성화할 수 있습니다.
  - `--renderer-process-limit=2`는
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`으로 변경할 수 있습니다. Chromium의
    기본 프로세스 제한을 사용하려면 `0`으로 설정하세요.
  - `noSandbox`가 활성화된 경우 `--no-sandbox`도 추가됩니다.
  - 기본값은 컨테이너 이미지의 기준선입니다. 컨테이너 기본값을 변경하려면 사용자 지정
    entrypoint가 있는 사용자 지정 브라우저 이미지를 사용하세요.

</Accordion>

브라우저 sandboxing과 `sandbox.docker.binds`는 Docker에서만 지원됩니다.

이미지 빌드:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list`(agent별 재정의)

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
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        skills: ["docs-search"], // replaces agents.defaults.skills when set
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

- `id`: 안정적인 agent id(필수).
- `default`: 여러 개가 설정되면 첫 번째가 우선합니다(경고 로그 기록). 아무것도 설정되지 않으면 첫 번째 목록 항목이 기본값입니다.
- `model`: 문자열 형식은 `primary`만 재정의하고, 객체 형식 `{ primary, fallbacks }`는 둘 다 재정의합니다(`[]`는 전역 fallback 비활성화). `primary`만 재정의하는 Cron 작업은 `fallbacks: []`를 설정하지 않으면 기본 fallback을 계속 상속합니다.
- `params`: `agents.defaults.models`에서 선택된 model 항목 위에 병합되는 agent별 스트림 매개변수입니다. 전체 model catalog를 복제하지 않고 `cacheRetention`, `temperature`, `maxTokens` 같은 agent별 재정의에 사용하세요.
- `skills`: 선택적 agent별 Skills 허용 목록입니다. 생략하면 agent는 설정된 경우 `agents.defaults.skills`를 상속하며, 명시적 목록은 기본값과 병합되지 않고 대체하며, `[]`는 Skills 없음을 의미합니다.
- `thinkingDefault`: 선택적 agent별 기본 thinking 수준(`off | minimal | low | medium | high | xhigh | adaptive | max`). 메시지별 또는 세션별 재정의가 없을 때 이 agent의 `agents.defaults.thinkingDefault`를 재정의합니다. 선택된 provider/model 프로필이 어떤 값이 유효한지 제어합니다. Google Gemini의 경우 `adaptive`는 provider 소유 동적 thinking을 유지합니다(Gemini 3/3.1에서는 `thinkingLevel` 생략, Gemini 2.5에서는 `thinkingBudget: -1`).
- `reasoningDefault`: 선택적 agent별 기본 reasoning 표시 방식(`on | off | stream`). 메시지별 또는 세션별 reasoning 재정의가 없을 때 적용됩니다.
- `fastModeDefault`: 선택적 agent별 기본 fast 모드 값(`true | false`). 메시지별 또는 세션별 fast-mode 재정의가 없을 때 적용됩니다.
- `embeddedHarness`: 선택적 agent별 저수준 harness 정책 재정의입니다. 한 agent만 Codex 전용으로 만들고 다른 agent는 `auto` 모드에서 기본 PI fallback을 유지하려면 `{ runtime: "codex" }`를 사용하세요.
- `runtime`: 선택적 agent별 런타임 설명자입니다. agent가 기본적으로 ACP harness 세션을 사용해야 할 때는 `type: "acp"`와 `runtime.acp` 기본값(`agent`, `backend`, `mode`, `cwd`)을 사용하세요.
- `identity.avatar`: workspace 기준 상대 경로, `http(s)` URL 또는 `data:` URI.
- `identity`는 기본값을 파생합니다: `emoji`로부터 `ackReaction`, `name`/`emoji`로부터 `mentionPatterns`.
- `subagents.allowAgents`: `sessions_spawn`용 agent id 허용 목록(`["*"]` = 모든 agent, 기본값: 같은 agent만).
- Sandbox 상속 보호: 요청 세션이 sandbox 상태이면 `sessions_spawn`은 sandbox 없이 실행될 대상은 거부합니다.
- `subagents.requireAgentId`: true이면 `agentId`를 생략한 `sessions_spawn` 호출을 차단합니다(명시적 프로필 선택 강제, 기본값: false).

---

## 다중 agent 라우팅

하나의 Gateway 안에서 여러 격리된 agent를 실행합니다. [다중 Agent](/ko/concepts/multi-agent)를 참조하세요.

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

- `type`(선택 사항): 일반 라우팅용 `route`(type이 없으면 route 기본값), 지속형 ACP 대화 바인딩용 `acp`.
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
6. 기본 agent

각 계층 안에서는 먼저 일치하는 `bindings` 항목이 우선합니다.

`type: "acp"` 항목의 경우 OpenClaw은 정확한 대화 식별성(`match.channel` + 계정 + `match.peer.id`)으로 확인하며, 위의 route 바인딩 계층 순서를 사용하지 않습니다.

### agent별 접근 프로필

<Accordion title="전체 접근 권한(sandbox 없음)">

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

<Accordion title="읽기 전용 tool + workspace">

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

<Accordion title="파일 시스템 접근 없음(메시징 전용)">

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

우선순위 세부 정보는 [다중 Agent Sandbox 및 Tools](/ko/tools/multi-agent-sandbox-tools)를 참조하세요.

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
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="세션 필드 세부 정보">

- **`scope`**: 그룹 채팅 컨텍스트에 대한 기본 세션 그룹화 전략입니다.
  - `per-sender`(기본값): 채널 컨텍스트 내에서 각 발신자가 격리된 세션을 가집니다.
  - `global`: 채널 컨텍스트의 모든 참가자가 하나의 세션을 공유합니다(공유 컨텍스트가 의도된 경우에만 사용).
- **`dmScope`**: DM을 그룹화하는 방식입니다.
  - `main`: 모든 DM이 메인 세션을 공유합니다.
  - `per-peer`: 채널 전반에서 발신자 id별로 격리합니다.
  - `per-channel-peer`: 채널 + 발신자별로 격리합니다(다중 사용자 받은편지함에 권장).
  - `per-account-channel-peer`: 계정 + 채널 + 발신자별로 격리합니다(다중 계정에 권장).
- **`identityLinks`**: 채널 간 세션 공유를 위해 표준 id를 provider 접두사가 있는 peer에 매핑합니다.
- **`reset`**: 기본 재설정 정책입니다. `daily`는 로컬 시간 `atHour`에 재설정되고, `idle`은 `idleMinutes` 후 재설정됩니다. 둘 다 구성된 경우 먼저 만료되는 쪽이 우선합니다.
- **`resetByType`**: 유형별 재정의(`direct`, `group`, `thread`)입니다. 레거시 `dm`도 `direct`의 별칭으로 허용됩니다.
- **`parentForkMaxTokens`**: 분기된 thread 세션을 만들 때 허용되는 부모 세션의 최대 `totalTokens`입니다(기본값 `100000`).
  - 부모 `totalTokens`가 이 값을 초과하면 OpenClaw은 부모 transcript 기록을 상속하는 대신 새 thread 세션을 시작합니다.
  - 이 보호 기능을 비활성화하고 항상 부모 분기를 허용하려면 `0`으로 설정하세요.
- **`mainKey`**: 레거시 필드입니다. 런타임은 메인 direct-chat 버킷에 항상 `"main"`을 사용합니다.
- **`agentToAgent.maxPingPongTurns`**: agent 간 교환 중 agent끼리 다시 응답하는 최대 턴 수입니다(정수, 범위: `0`–`5`). `0`은 핑퐁 체이닝을 비활성화합니다.
- **`sendPolicy`**: `channel`, `chatType`(`direct|group|channel`, 레거시 `dm` 별칭 포함), `keyPrefix`, `rawKeyPrefix`로 일치시킵니다. 첫 번째 deny가 우선합니다.
- **`maintenance`**: 세션 저장소 정리 및 보존 제어입니다.
  - `mode`: `warn`은 경고만 기록하고, `enforce`는 정리를 적용합니다.
  - `pruneAfter`: 오래된 항목에 대한 보존 기간 기준값입니다(기본값 `30d`).
  - `maxEntries`: `sessions.json`의 최대 항목 수입니다(기본값 `500`).
  - `rotateBytes`: `sessions.json`이 이 크기를 초과하면 회전합니다(기본값 `10mb`).
  - `resetArchiveRetention`: `*.reset.<timestamp>` transcript 아카이브의 보존 기간입니다. 기본값은 `pruneAfter`이며, 비활성화하려면 `false`로 설정합니다.
  - `maxDiskBytes`: 선택적 세션 디렉터리 디스크 예산입니다. `warn` 모드에서는 경고를 기록하고, `enforce` 모드에서는 가장 오래된 아티팩트/세션부터 제거합니다.
  - `highWaterBytes`: 예산 정리 후 목표값입니다. 기본값은 `maxDiskBytes`의 `80%`입니다.
- **`threadBindings`**: thread 바인딩 세션 기능의 전역 기본값입니다.
  - `enabled`: 마스터 기본 스위치(provider가 재정의할 수 있음; Discord는 `channels.discord.threadBindings.enabled` 사용)
  - `idleHours`: 기본 비활성 자동 포커스 해제 시간(시간 단위, `0`이면 비활성화, provider가 재정의 가능)
  - `maxAgeHours`: 기본 하드 최대 사용 기간(시간 단위, `0`이면 비활성화, provider가 재정의 가능)

</Accordion>

---

## 메시지

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
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
      debounceMs: 2000, // 0 disables
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

확인 순서(가장 구체적인 값이 우선): 계정 → 채널 → 전역. `""`는 비활성화하며 상위 확인도 중단합니다. `"auto"`는 `[{identity.name}]`를 생성합니다.

**템플릿 변수:**

| Variable          | 설명                 | 예시                        |
| ----------------- | -------------------- | --------------------------- |
| `{model}`         | 짧은 model 이름      | `claude-opus-4-6`           |
| `{modelFull}`     | 전체 model 식별자    | `anthropic/claude-opus-4-6` |
| `{provider}`      | provider 이름        | `anthropic`                 |
| `{thinkingLevel}` | 현재 thinking 수준   | `high`, `low`, `off`        |
| `{identity.name}` | agent identity 이름  | (`"auto"`와 동일)           |

변수는 대소문자를 구분하지 않습니다. `{think}`는 `{thinkingLevel}`의 별칭입니다.

### 확인 반응

- 기본값은 활성 agent의 `identity.emoji`이며, 없으면 `"👀"`입니다. 비활성화하려면 `""`로 설정하세요.
- 채널별 재정의: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- 확인 순서: 계정 → 채널 → `messages.ackReaction` → identity 대체값.
- 범위: `group-mentions`(기본값), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: Slack, Discord, Telegram에서 응답 후 확인 반응을 제거합니다.
- `messages.statusReactions.enabled`: Slack, Discord, Telegram에서 수명 주기 상태 반응을 활성화합니다.
  Slack과 Discord에서는 설정하지 않으면 확인 반응이 활성화된 경우 상태 반응도 활성 상태로 유지됩니다.
  Telegram에서는 수명 주기 상태 반응을 활성화하려면 명시적으로 `true`로 설정해야 합니다.

### 수신 디바운스

같은 발신자의 빠른 텍스트 전용 메시지를 하나의 agent 턴으로 묶습니다. 미디어/첨부 파일은 즉시 플러시됩니다. 제어 명령은 디바운스를 우회합니다.

### TTS(text-to-speech)

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

- `auto`는 기본 자동 TTS 모드를 제어합니다: `off`, `always`, `inbound`, `tagged`. `/tts on|off`는 로컬 기본 설정을 재정의할 수 있고, `/tts status`는 실제 적용 상태를 표시합니다.
- `summaryModel`은 자동 요약에 대해 `agents.defaults.model.primary`를 재정의합니다.
- `modelOverrides`는 기본적으로 활성화되어 있으며, `modelOverrides.allowProvider`의 기본값은 `false`입니다(opt-in).
- API 키는 `ELEVENLABS_API_KEY`/`XI_API_KEY` 및 `OPENAI_API_KEY`로 대체될 수 있습니다.
- 번들된 음성 provider는 Plugin이 소유합니다. `plugins.allow`가 설정된 경우 사용하려는 각 TTS provider Plugin을 포함하세요. 예를 들어 Edge TTS용 `microsoft`가 있습니다. 레거시 `edge` provider id는 `microsoft`의 별칭으로 허용됩니다.
- `providers.openai.baseUrl`은 OpenAI TTS 엔드포인트를 재정의합니다. 확인 순서는 config, 그다음 `OPENAI_TTS_BASE_URL`, 그다음 `https://api.openai.com/v1`입니다.
- `providers.openai.baseUrl`이 OpenAI가 아닌 엔드포인트를 가리키면 OpenClaw은 이를 OpenAI 호환 TTS 서버로 처리하고 model/voice 검사를 완화합니다.

---

## Talk

Talk 모드(macOS/iOS/Android)의 기본값입니다.

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

- `talk.provider`는 여러 Talk provider가 구성된 경우 `talk.providers`의 키와 일치해야 합니다.
- 레거시 평면 Talk 키(`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`)는 호환성 전용이며 `talk.providers.<provider>`로 자동 마이그레이션됩니다.
- Voice ID는 `ELEVENLABS_VOICE_ID` 또는 `SAG_VOICE_ID`로 대체될 수 있습니다.
- `providers.*.apiKey`는 평문 문자열 또는 SecretRef 객체를 받을 수 있습니다.
- `ELEVENLABS_API_KEY` 대체값은 Talk API 키가 구성되지 않은 경우에만 적용됩니다.
- `providers.*.voiceAliases`를 사용하면 Talk 지시문에서 친숙한 이름을 사용할 수 있습니다.
- `providers.mlx.modelId`는 macOS 로컬 MLX helper가 사용하는 Hugging Face 저장소를 선택합니다. 생략하면 macOS는 `mlx-community/Soprano-80M-bf16`를 사용합니다.
- macOS MLX 재생은 번들된 `openclaw-mlx-tts` helper가 있으면 이를 통해 실행되고, 없으면 `PATH`의 실행 파일을 사용합니다. 개발용으로 helper 경로를 재정의하려면 `OPENCLAW_MLX_TTS_BIN`을 사용하세요.
- `silenceTimeoutMs`는 사용자가 조용해진 뒤 Talk 모드가 transcript를 보내기 전에 얼마나 오래 기다릴지 제어합니다. 설정하지 않으면 플랫폼 기본 일시 정지 창을 유지합니다(macOS와 Android는 `700 ms`, iOS는 `900 ms`).

---

## 관련

- [구성 참고 문서](/ko/gateway/configuration-reference) — 기타 모든 config 키
- [구성](/ko/gateway/configuration) — 일반 작업 및 빠른 설정
- [구성 예시](/ko/gateway/configuration-examples)
