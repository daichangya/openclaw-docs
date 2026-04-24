---
read_when:
    - '`tools.*` 정책, 허용 목록 또는 실험적 기능 구성하기'
    - 사용자 지정 Provider 등록 또는 base URL 재정의하기
    - OpenAI 호환 self-hosted 엔드포인트 설정하기
summary: 도구 구성(정책, 실험적 토글, Provider 기반 도구) 및 사용자 지정 Provider/base-URL 설정
title: 구성 — 도구 및 사용자 지정 Provider
x-i18n:
    generated_at: "2026-04-24T06:13:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92535fb937f688c7cd39dcf5fc55f4663c8d234388a46611527efad4b7ee85eb
    source_path: gateway/config-tools.md
    workflow: 15
---

`tools.*` 구성 키와 사용자 지정 Provider / base-URL 설정입니다. 에이전트,
채널 및 기타 최상위 구성 키는
[구성 참조](/ko/gateway/configuration-reference)를 참고하세요.

## 도구

### 도구 프로필

`tools.profile`은 `tools.allow`/`tools.deny` 전에 기본 허용 목록을 설정합니다.

로컬 온보딩은 설정되지 않은 새 로컬 구성의 기본값을 `tools.profile: "coding"`으로 설정합니다(기존의 명시적 프로필은 유지됨).

| 프로필 | 포함 항목 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status`만 |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status` |
| `full`      | 제한 없음(미설정과 동일) |

### 도구 그룹

| 그룹 | 도구 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash`는 `exec`의 별칭으로 허용됨) |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch` |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get` |
| `group:web`        | `web_search`, `x_search`, `web_fetch` |
| `group:ui`         | `browser`, `canvas` |
| `group:automation` | `cron`, `gateway` |
| `group:messaging`  | `message` |
| `group:nodes`      | `nodes` |
| `group:agents`     | `agents_list` |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts` |
| `group:openclaw`   | 모든 내장 도구(Provider Plugin 제외) |

### `tools.allow` / `tools.deny`

전역 도구 허용/거부 정책입니다(거부 우선). 대소문자를 구분하지 않으며 `*` 와일드카드를 지원합니다. Docker 샌드박스가 꺼져 있어도 적용됩니다.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

특정 Provider 또는 모델에 대해 도구를 추가로 제한합니다. 순서: 기본 프로필 → Provider 프로필 → allow/deny.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

샌드박스 외부의 상승된 exec 접근을 제어합니다:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- 에이전트별 재정의(`agents.list[].tools.elevated`)는 추가 제한만 할 수 있습니다.
- `/elevated on|off|ask|full`은 상태를 세션별로 저장하며, 인라인 지시문은 단일 메시지에 적용됩니다.
- 상승된 `exec`는 샌드박싱을 우회하고 구성된 이스케이프 경로를 사용합니다(`gateway`가 기본값이며, exec 대상이 `node`일 때는 `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

도구 루프 안전성 검사는 기본적으로 **비활성화**되어 있습니다. 감지를 활성화하려면 `enabled: true`를 설정하세요.
설정은 전역 `tools.loopDetection`에 정의할 수 있으며 에이전트별로 `agents.list[].tools.loopDetection`에서 재정의할 수 있습니다.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: 루프 분석을 위해 유지되는 최대 도구 호출 기록.
- `warningThreshold`: 경고를 위한 반복 무진행 패턴 임계값.
- `criticalThreshold`: 치명적 루프 차단을 위한 더 높은 반복 임계값.
- `globalCircuitBreakerThreshold`: 모든 무진행 실행에 대한 강제 중단 임계값.
- `detectors.genericRepeat`: 동일 도구/동일 인자 호출 반복 시 경고.
- `detectors.knownPollNoProgress`: 알려진 폴 도구(`process.poll`, `command_status` 등)의 무진행 상태에서 경고/차단.
- `detectors.pingPong`: 번갈아 나타나는 무진행 쌍 패턴에서 경고/차단.
- `warningThreshold >= criticalThreshold`이거나 `criticalThreshold >= globalCircuitBreakerThreshold`이면 검증에 실패합니다.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // 또는 BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // 선택 사항; 자동 감지를 원하면 생략
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

인바운드 미디어 이해(이미지/오디오/비디오)를 구성합니다:

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // 옵트인: 완료된 비동기 음악/비디오를 채널로 직접 전송
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="미디어 모델 항목 필드">

**Provider 항목** (`type: "provider"` 또는 생략):

- `provider`: API Provider id (`openai`, `anthropic`, `google`/`gemini`, `groq` 등)
- `model`: 모델 id 재정의
- `profile` / `preferredProfile`: `auth-profiles.json` 프로필 선택

**CLI 항목** (`type: "cli"`):

- `command`: 실행할 실행 파일
- `args`: 템플릿화된 인자(`{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` 등 지원)

**공통 필드:**

- `capabilities`: 선택적 목록(`image`, `audio`, `video`). 기본값: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: 항목별 재정의.
- 실패하면 다음 항목으로 폴백합니다.

Provider 인증은 표준 순서를 따릅니다: `auth-profiles.json` → env vars → `models.providers.*.apiKey`.

**비동기 완료 필드:**

- `asyncCompletion.directSend`: `true`일 때 완료된 비동기 `music_generate`
  및 `video_generate` 작업은 먼저 채널 직접 전달을 시도합니다. 기본값: `false`
  (기존 요청자 세션 깨우기/모델 전달 경로).

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

세션 도구(`sessions_list`, `sessions_history`, `sessions_send`)가 어떤 세션을 대상으로 할 수 있는지 제어합니다.

기본값: `tree`(현재 세션 + 이 세션에서 생성된 세션, 예: 서브에이전트).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

참고:

- `self`: 현재 세션 키만.
- `tree`: 현재 세션 + 현재 세션에서 생성된 세션(서브에이전트).
- `agent`: 현재 에이전트 id에 속한 모든 세션(동일한 에이전트 id 아래 발신자별 세션을 실행하는 경우 다른 사용자 포함 가능).
- `all`: 모든 세션. 에이전트 간 타기팅에는 여전히 `tools.agentToAgent`가 필요합니다.
- 샌드박스 clamp: 현재 세션이 샌드박스 상태이고 `agents.defaults.sandbox.sessionToolsVisibility="spawned"`이면 `tools.sessions.visibility="all"`이어도 가시성은 강제로 `tree`가 됩니다.

### `tools.sessions_spawn`

`sessions_spawn`의 인라인 첨부 파일 지원을 제어합니다.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // 옵트인: 인라인 파일 첨부를 허용하려면 true로 설정
        maxTotalBytes: 5242880, // 모든 파일 합계 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // 파일당 1 MB
        retainOnSessionKeep: false, // cleanup="keep"일 때 첨부 유지
      },
    },
  },
}
```

참고:

- 첨부 파일은 `runtime: "subagent"`에서만 지원됩니다. ACP 런타임은 이를 거부합니다.
- 파일은 `.manifest.json`과 함께 `.openclaw/attachments/<uuid>/` 아래 자식 워크스페이스에 실체화됩니다.
- 첨부 파일 내용은 전사 영속화에서 자동으로 비식별화됩니다.
- Base64 입력은 엄격한 알파벳/패딩 검사와 디코드 전 크기 가드로 검증됩니다.
- 파일 권한은 디렉터리 `0700`, 파일 `0600`입니다.
- 정리는 `cleanup` 정책을 따릅니다: `delete`는 항상 첨부를 제거하고, `keep`은 `retainOnSessionKeep: true`일 때만 유지합니다.

<a id="toolsexperimental"></a>

### `tools.experimental`

실험적 내장 도구 플래그입니다. 엄격한 agentic GPT-5 자동 활성화 규칙이 적용되지 않는 한 기본값은 꺼짐입니다.

```json5
{
  tools: {
    experimental: {
      planTool: true, // 실험적 update_plan 활성화
    },
  },
}
```

참고:

- `planTool`: 중요하고 다단계인 작업 추적을 위한 구조화된 `update_plan` 도구를 활성화합니다.
- 기본값: OpenAI 또는 OpenAI Codex GPT-5 계열 실행에서 `agents.defaults.embeddedPi.executionContract`(또는 에이전트별 재정의)가 `"strict-agentic"`으로 설정된 경우를 제외하고 `false`. 이 범위 밖에서도 강제로 켜려면 `true`, strict-agentic GPT-5 실행에서도 끄려면 `false`로 설정하세요.
- 활성화되면 시스템 프롬프트에도 사용 지침이 추가되어, 모델이 실질적인 작업에만 이를 사용하고 동시에 `in_progress` 단계는 최대 하나만 유지하도록 합니다.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: 생성된 서브에이전트의 기본 모델입니다. 생략하면 서브에이전트는 호출자의 모델을 상속합니다.
- `allowAgents`: 요청 에이전트가 자체 `subagents.allowAgents`를 설정하지 않았을 때 `sessions_spawn`에 대한 대상 에이전트 id의 기본 허용 목록입니다(`["*"]` = 모두 허용, 기본값: 동일 에이전트만).
- `runTimeoutSeconds`: 도구 호출에서 `runTimeoutSeconds`를 생략했을 때 `sessions_spawn`의 기본 타임아웃(초)입니다. `0`은 타임아웃 없음입니다.
- 서브에이전트별 도구 정책: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## 사용자 지정 Provider 및 base URL

OpenClaw는 내장 모델 카탈로그를 사용합니다. 구성의 `models.providers` 또는 `~/.openclaw/agents/<agentId>/agent/models.json`을 통해 사용자 지정 Provider를 추가합니다.

```json5
{
  models: {
    mode: "merge", // merge (기본값) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- 사용자 지정 인증이 필요하면 `authHeader: true`와 `headers`를 사용하세요.
- `OPENCLAW_AGENT_DIR`(또는 레거시 환경 변수 별칭인 `PI_CODING_AGENT_DIR`)로 에이전트 구성 루트를 재정의합니다.
- 일치하는 Provider ID에 대한 병합 우선순위:
  - 비어 있지 않은 에이전트 `models.json`의 `baseUrl` 값이 우선합니다.
  - 비어 있지 않은 에이전트 `apiKey` 값은 해당 Provider가 현재 구성/auth-profile 컨텍스트에서 SecretRef로 관리되지 않을 때만 우선합니다.
  - SecretRef로 관리되는 Provider `apiKey` 값은 해석된 시크릿을 영속 저장하는 대신 소스 마커(`env` ref의 경우 `ENV_VAR_NAME`, `file`/`exec` ref의 경우 `secretref-managed`)에서 새로 고쳐집니다.
  - SecretRef로 관리되는 Provider 헤더 값은 소스 마커(`env` ref의 경우 `secretref-env:ENV_VAR_NAME`, `file`/`exec` ref의 경우 `secretref-managed`)에서 새로 고쳐집니다.
  - 비어 있거나 누락된 에이전트 `apiKey`/`baseUrl`는 구성의 `models.providers`로 폴백합니다.
  - 일치하는 모델의 `contextWindow`/`maxTokens`는 명시적 구성값과 암시적 카탈로그 값 중 더 큰 값을 사용합니다.
  - 일치하는 모델의 `contextTokens`는 명시적인 런타임 상한이 있을 경우 이를 유지합니다. 모델의 네이티브 메타데이터를 바꾸지 않고 유효 컨텍스트를 제한하려면 이를 사용하세요.
  - 구성이 `models.json`을 완전히 다시 쓰게 하려면 `models.mode: "replace"`를 사용하세요.
  - 마커 영속성은 소스 권한 기준입니다. 마커는 해석된 런타임 시크릿 값이 아니라 활성 소스 구성 스냅샷(해석 전)에서 기록됩니다.

### Provider 필드 세부 정보

- `models.mode`: Provider 카탈로그 동작(`merge` 또는 `replace`).
- `models.providers`: Provider id를 키로 하는 사용자 지정 Provider 맵.
  - 안전한 편집: 추가 업데이트에는 `openclaw config set models.providers.<id> '<json>' --strict-json --merge` 또는 `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge`를 사용하세요. `config set`은 `--replace`를 전달하지 않으면 파괴적인 교체를 거부합니다.
- `models.providers.*.api`: 요청 어댑터(`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` 등).
- `models.providers.*.apiKey`: Provider 자격 증명(SecretRef/env 치환 권장).
- `models.providers.*.auth`: 인증 전략(`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions`에서 요청에 `options.num_ctx`를 주입합니다(기본값: `true`).
- `models.providers.*.authHeader`: 필요할 때 `Authorization` 헤더로 자격 증명을 강제로 전송합니다.
- `models.providers.*.baseUrl`: 업스트림 API base URL.
- `models.providers.*.headers`: 프록시/테넌트 라우팅용 추가 정적 헤더.
- `models.providers.*.request`: 모델 Provider HTTP 요청에 대한 전송 재정의.
  - `request.headers`: 추가 헤더(Provider 기본값과 병합됨). 값은 SecretRef를 받을 수 있습니다.
  - `request.auth`: 인증 전략 재정의. 모드: `"provider-default"`(Provider의 내장 인증 사용), `"authorization-bearer"`(`token` 사용), `"header"`(`headerName`, `value`, 선택적 `prefix` 사용).
  - `request.proxy`: HTTP 프록시 재정의. 모드: `"env-proxy"`(`HTTP_PROXY`/`HTTPS_PROXY` env vars 사용), `"explicit-proxy"`(`url` 사용). 두 모드 모두 선택적 `tls` 하위 객체를 받을 수 있습니다.
  - `request.tls`: 직접 연결용 TLS 재정의. 필드: `ca`, `cert`, `key`, `passphrase`(모두 SecretRef 허용), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: `true`이면 Provider HTTP fetch 가드를 통해 DNS가 private, CGNAT 또는 유사 범위로 해석될 때 `baseUrl`에 대한 HTTPS를 허용합니다(신뢰할 수 있는 self-hosted OpenAI 호환 엔드포인트를 위한 운영자 옵트인). WebSocket은 헤더/TLS에 동일한 `request`를 사용하지만 해당 fetch SSRF 게이트는 사용하지 않습니다. 기본값은 `false`.
- `models.providers.*.models`: 명시적인 Provider 모델 카탈로그 항목.
- `models.providers.*.models.*.contextWindow`: 모델의 네이티브 컨텍스트 창 메타데이터.
- `models.providers.*.models.*.contextTokens`: 선택적 런타임 컨텍스트 상한입니다. 모델의 네이티브 `contextWindow`보다 더 작은 유효 컨텍스트 예산을 원할 때 사용하세요.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: 선택적 호환성 힌트. `api: "openai-completions"`이고 비어 있지 않은 비네이티브 `baseUrl`(`api.openai.com`이 아닌 호스트)인 경우 OpenClaw는 런타임에 이를 `false`로 강제합니다. 비어 있거나 생략된 `baseUrl`은 기본 OpenAI 동작을 유지합니다.
- `models.providers.*.models.*.compat.requiresStringContent`: 문자열 전용 OpenAI 호환 채팅 엔드포인트용 선택적 호환성 힌트. `true`이면 OpenClaw는 요청 전송 전에 순수 텍스트 `messages[].content` 배열을 일반 문자열로 평탄화합니다.
- `plugins.entries.amazon-bedrock.config.discovery`: Bedrock 자동 검색 설정 루트.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: 암시적 검색의 활성화/비활성화.
- `plugins.entries.amazon-bedrock.config.discovery.region`: 검색에 사용할 AWS 리전.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: 대상 검색용 선택적 Provider-id 필터.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: 검색 새로 고침 폴링 간격.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: 검색된 모델에 대한 폴백 컨텍스트 창.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: 검색된 모델에 대한 폴백 최대 출력 토큰 수.

### Provider 예시

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Cerebras에는 `cerebras/zai-glm-4.7`을 사용하고, Z.AI 직접 연결에는 `zai/glm-4.7`을 사용하세요.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

`OPENCODE_API_KEY`(또는 `OPENCODE_ZEN_API_KEY`)를 설정하세요. Zen 카탈로그에는 `opencode/...` 참조를, Go 카탈로그에는 `opencode-go/...` 참조를 사용하세요. 바로 가기: `openclaw onboard --auth-choice opencode-zen` 또는 `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

`ZAI_API_KEY`를 설정하세요. `z.ai/*`와 `z-ai/*`는 허용되는 별칭입니다. 바로 가기: `openclaw onboard --auth-choice zai-api-key`.

- 일반 엔드포인트: `https://api.z.ai/api/paas/v4`
- 코딩 엔드포인트(기본값): `https://api.z.ai/api/coding/paas/v4`
- 일반 엔드포인트를 사용하려면 base URL 재정의를 포함한 사용자 지정 Provider를 정의하세요.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

중국 엔드포인트의 경우: `baseUrl: "https://api.moonshot.cn/v1"` 또는 `openclaw onboard --auth-choice moonshot-api-key-cn`.

네이티브 Moonshot 엔드포인트는 공유된
`openai-completions` 전송에서 스트리밍 사용량 호환성을 광고하며, OpenClaw는 이를 내장 Provider id만이 아니라 엔드포인트 기능을 기준으로 판단합니다.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Anthropic 호환, 내장 Provider입니다. 바로 가기: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (Anthropic-compatible)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

base URL에는 `/v1`을 포함하지 않아야 합니다(Anthropic 클라이언트가 이를 추가함). 바로 가기: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (direct)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

`MINIMAX_API_KEY`를 설정하세요. 바로 가기:
`openclaw onboard --auth-choice minimax-global-api` 또는
`openclaw onboard --auth-choice minimax-cn-api`.
모델 카탈로그 기본값은 M2.7만 포함합니다.
Anthropic 호환 스트리밍 경로에서 OpenClaw는 사용자가 직접 `thinking`을 설정하지 않는 한 기본적으로 MiniMax thinking을 비활성화합니다. `/fast on` 또는 `params.fastMode: true`는 `MiniMax-M2.7`을 `MiniMax-M2.7-highspeed`로 다시 씁니다.

</Accordion>

<Accordion title="로컬 모델(LM Studio)">

[로컬 모델](/ko/gateway/local-models)을 참고하세요. 요약: 충분한 하드웨어에서는 LM Studio Responses API를 통해 큰 로컬 모델을 실행하고, 폴백을 위해 호스팅 모델은 병합된 상태로 유지하세요.

</Accordion>

---

## 관련 문서

- [구성 참조](/ko/gateway/configuration-reference) — 기타 최상위 키
- [구성 — 에이전트](/ko/gateway/config-agents)
- [구성 — 채널](/ko/gateway/config-channels)
- [도구 및 Plugins](/ko/tools)
