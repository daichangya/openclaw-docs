---
read_when:
    - 어느 SDK 서브패스에서 import해야 하는지 알아야 합니다
    - OpenClawPluginApi의 모든 등록 메서드에 대한 참조가 필요합니다
    - 특정 SDK export를 찾고 있습니다
sidebarTitle: SDK overview
summary: import 맵, 등록 API 참조, SDK 아키텍처
title: Plugin SDK 개요
x-i18n:
    generated_at: "2026-04-24T06:27:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7090e13508382a68988f3d345bf12d6f3822c499e01a3affb1fa7a277b22f276
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK는 Plugin과 코어 사이의 타입 지정된 계약입니다. 이 페이지는 **무엇을 import해야 하는지**와 **무엇을 등록할 수 있는지**에 대한 참조입니다.

<Tip>
  how-to 가이드를 찾고 있나요?

- 첫 Plugin이라면? [Plugins 빌드하기](/ko/plugins/building-plugins)부터 시작하세요.
- 채널 Plugin이라면? [채널 Plugins](/ko/plugins/sdk-channel-plugins)를 참조하세요.
- Provider Plugin이라면? [Provider Plugins](/ko/plugins/sdk-provider-plugins)를 참조하세요.
  </Tip>

## import 규칙

항상 특정 서브패스에서 import하세요:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

각 서브패스는 작고 독립적인 모듈입니다. 이렇게 하면 시작 속도가 빨라지고
순환 의존성 문제를 방지할 수 있습니다. 채널 전용 진입/빌드 헬퍼에는
`openclaw/plugin-sdk/channel-core`를 선호하고, 더 넓은 umbrella 표면과
`buildChannelConfigSchema` 같은 공유 헬퍼에는 `openclaw/plugin-sdk/core`를 유지하세요.

<Warning>
  provider 또는 channel 브랜드가 붙은 편의 seam(예:
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`)은
  import하지 마세요. 번들 Plugins는 자신의 `api.ts` /
  `runtime-api.ts` barrel 안에서 일반 SDK 서브패스를 조합합니다. 코어 소비자는
  해당 Plugin 로컬 barrel을 사용하거나, 필요가 진정으로
  cross-channel인 경우에만 좁은 일반 SDK 계약을 추가해야 합니다.

번들 Plugin 헬퍼 seam의 작은 집합(`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` 등)은 여전히
생성된 export 맵에 나타납니다. 이들은 번들 Plugin 유지보수 전용이며,
새 서드파티 Plugin의 권장 import 경로는 아닙니다.
</Warning>

## 서브패스 참조

Plugin SDK는 영역별로 그룹화된 좁은 서브패스 집합으로 노출됩니다(Plugin
entry, channel, provider, auth, runtime, capability, memory, 예약된
번들 Plugin 헬퍼). 전체 카탈로그는 그룹화 및 링크와 함께
[Plugin SDK 서브패스](/ko/plugins/sdk-subpaths)를 참조하세요.

200개 이상의 서브패스로 생성된 목록은 `scripts/lib/plugin-sdk-entrypoints.json`에 있습니다.

## 등록 API

`register(api)` 콜백은 다음 메서드를 가진 `OpenClawPluginApi` 객체를 받습니다:

### Capability 등록

| 메서드                                           | 등록 대상                              |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | 텍스트 추론 (LLM)                      |
| `api.registerAgentHarness(...)`                  | 실험적 저수준 에이전트 실행기          |
| `api.registerCliBackend(...)`                    | 로컬 CLI 추론 백엔드                   |
| `api.registerChannel(...)`                       | 메시징 채널                            |
| `api.registerSpeechProvider(...)`                | 텍스트 음성 변환 / STT 합성            |
| `api.registerRealtimeTranscriptionProvider(...)` | 스트리밍 실시간 전사                   |
| `api.registerRealtimeVoiceProvider(...)`         | 양방향 실시간 음성 세션                |
| `api.registerMediaUnderstandingProvider(...)`    | 이미지/오디오/비디오 분석              |
| `api.registerImageGenerationProvider(...)`       | 이미지 생성                            |
| `api.registerMusicGenerationProvider(...)`       | 음악 생성                              |
| `api.registerVideoGenerationProvider(...)`       | 비디오 생성                            |
| `api.registerWebFetchProvider(...)`              | 웹 가져오기 / 스크래핑 provider        |
| `api.registerWebSearchProvider(...)`             | 웹 검색                                |

### 도구 및 명령

| 메서드                          | 등록 대상                                            |
| ------------------------------- | ---------------------------------------------------- |
| `api.registerTool(tool, opts?)` | 에이전트 도구(필수 또는 `{ optional: true }`)        |
| `api.registerCommand(def)`      | 커스텀 명령(LLM 우회)                                |

### 인프라

| 메서드                                          | 등록 대상                              |
| ----------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | 이벤트 hook                            |
| `api.registerHttpRoute(params)`                 | Gateway HTTP 엔드포인트                |
| `api.registerGatewayMethod(name, handler)`      | Gateway RPC 메서드                     |
| `api.registerCli(registrar, opts?)`             | CLI 하위 명령                          |
| `api.registerService(service)`                  | 백그라운드 서비스                      |
| `api.registerInteractiveHandler(registration)`  | 대화형 핸들러                          |
| `api.registerEmbeddedExtensionFactory(factory)` | Pi embedded-runner 확장 팩토리         |
| `api.registerMemoryPromptSupplement(builder)`   | 추가형 메모리 인접 프롬프트 섹션       |
| `api.registerMemoryCorpusSupplement(adapter)`   | 추가형 메모리 검색/읽기 코퍼스         |

<Note>
  예약된 코어 관리자 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`)는 Plugin이 더 좁은 범위를 지정하려 해도 항상 `operator.admin`으로 유지됩니다.
  Plugin 소유 메서드에는 Plugin 전용 접두사를 선호하세요.
</Note>

<Accordion title="registerEmbeddedExtensionFactory를 언제 사용할까">
  Plugin이 OpenClaw 내장 실행 중 Pi 네이티브
  이벤트 타이밍이 필요할 때 `api.registerEmbeddedExtensionFactory(...)`를 사용하세요. 예를 들어
  최종 tool-result 메시지가 방출되기 전에 일어나야 하는 비동기 `tool_result`
  재작성 같은 경우입니다.

현재 이것은 번들 Plugin seam입니다. 번들 Plugins만 등록할 수 있으며,
`openclaw.plugin.json`에 `contracts.embeddedExtensionFactories: ["pi"]`를
선언해야 합니다. 더 낮은 수준 seam이 필요하지 않은 작업에는 일반 OpenClaw Plugin 훅을 유지하세요.
</Accordion>

### CLI 등록 메타데이터

`api.registerCli(registrar, opts?)`는 두 종류의 최상위 메타데이터를 받습니다:

- `commands`: registrar가 소유하는 명시적 명령 루트
- `descriptors`: 루트 CLI 도움말, 라우팅, lazy Plugin CLI 등록에 사용되는 파싱 시점 명령 descriptor

Plugin 명령이 일반 루트 CLI 경로에서 lazy-loaded 상태를 유지하길 원한다면, 해당 registrar가 노출하는 모든 최상위 명령 루트를 포괄하는 `descriptors`를 제공하세요.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Matrix 계정, 검증, 디바이스, 프로필 상태 관리",
        hasSubcommands: true,
      },
    ],
  },
);
```

lazy 루트 CLI 등록이 필요하지 않을 때만 `commands` 단독 사용을 고려하세요.
그 eager 호환 경로는 여전히 지원되지만, 파싱 시점 lazy loading을 위한 descriptor 기반 placeholder는 설치하지 않습니다.

### CLI 백엔드 등록

`api.registerCliBackend(...)`는 Plugin이 `codex-cli` 같은 로컬
AI CLI 백엔드의 기본 구성을 소유하게 합니다.

- 백엔드 `id`는 `codex-cli/gpt-5` 같은 모델 참조에서 provider 접두사가 됩니다.
- 백엔드 `config`는 `agents.defaults.cliBackends.<id>`와 같은 형태를 사용합니다.
- 사용자 구성은 여전히 우선합니다. OpenClaw는 CLI를 실행하기 전에
  plugin 기본값 위에 `agents.defaults.cliBackends.<id>`를 병합합니다.
- 백엔드가 병합 후 호환성 재작성(예: 오래된 플래그 형태 정규화)이 필요하면
  `normalizeConfig`를 사용하세요.

### 배타적 슬롯

| 메서드                                     | 등록 대상                                                                                                                                                |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine(한 번에 하나만 활성). `assemble()` 콜백은 `availableTools`와 `citationsMode`를 받아 엔진이 프롬프트 추가를 조정할 수 있게 합니다.      |
| `api.registerMemoryCapability(capability)` | 통합 메모리 capability                                                                                                                                   |
| `api.registerMemoryPromptSection(builder)` | 메모리 프롬프트 섹션 빌더                                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | 메모리 flush 계획 확인기                                                                                                                                  |
| `api.registerMemoryRuntime(runtime)`       | 메모리 런타임 어댑터                                                                                                                                      |

### 메모리 임베딩 어댑터

| 메서드                                         | 등록 대상                                      |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 활성 Plugin용 메모리 임베딩 어댑터             |

- `registerMemoryCapability`는 선호되는 배타적 메모리 Plugin API입니다.
- `registerMemoryCapability`는 동반 Plugins가 특정
  메모리 Plugin의 비공개 레이아웃에 접근하는 대신
  `openclaw/plugin-sdk/memory-host-core`를 통해 내보낸 메모리 아티팩트를 소비할 수 있도록
  `publicArtifacts.listArtifacts(...)`를 노출할 수도 있습니다.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`,
  `registerMemoryRuntime`는 레거시 호환 배타적 메모리 Plugin API입니다.
- `registerMemoryEmbeddingProvider`는 활성 메모리 Plugin이 하나 이상의
  임베딩 어댑터 ID(예: `openai`, `gemini`, 또는 Plugin이 정의한 커스텀 ID)를 등록하게 합니다.
- `agents.defaults.memorySearch.provider` 및
  `agents.defaults.memorySearch.fallback` 같은 사용자 구성은 이러한 등록된
  어댑터 ID에 대해 확인됩니다.

### 이벤트와 수명 주기

| 메서드                                       | 기능                         |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | 타입 지정된 수명 주기 훅     |
| `api.onConversationBindingResolved(handler)` | 대화 바인딩 콜백             |

### 훅 결정 의미

- `before_tool_call`: `{ block: true }`를 반환하면 최종 결정입니다. 어떤 핸들러든 이를 설정하면 더 낮은 우선순위 핸들러는 건너뜁니다.
- `before_tool_call`: `{ block: false }`를 반환하면 재정의가 아니라 결정 없음으로 처리됩니다(`block` 생략과 동일).
- `before_install`: `{ block: true }`를 반환하면 최종 결정입니다. 어떤 핸들러든 이를 설정하면 더 낮은 우선순위 핸들러는 건너뜁니다.
- `before_install`: `{ block: false }`를 반환하면 재정의가 아니라 결정 없음으로 처리됩니다(`block` 생략과 동일).
- `reply_dispatch`: `{ handled: true, ... }`를 반환하면 최종 결정입니다. 어떤 핸들러든 dispatch를 가져가면 더 낮은 우선순위 핸들러와 기본 모델 dispatch 경로는 건너뜁니다.
- `message_sending`: `{ cancel: true }`를 반환하면 최종 결정입니다. 어떤 핸들러든 이를 설정하면 더 낮은 우선순위 핸들러는 건너뜁니다.
- `message_sending`: `{ cancel: false }`를 반환하면 재정의가 아니라 결정 없음으로 처리됩니다(`cancel` 생략과 동일).
- `message_received`: 수신 스레드/토픽 라우팅이 필요할 때는 typed `threadId` 필드를 사용하세요. `metadata`는 채널별 추가 정보를 위해 유지하세요.
- `message_sending`: 채널별 `metadata`로 폴백하기 전에 typed `replyToId` / `threadId` 라우팅 필드를 사용하세요.
- `gateway_start`: 내부 `gateway:startup` 훅에 의존하는 대신 Gateway 소유 시작 상태에는 `ctx.config`, `ctx.workspaceDir`, `ctx.getCron?.()`를 사용하세요.

### API 객체 필드

| 필드                    | 타입                      | 설명                                                                                         |
| ----------------------- | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                | `string`                  | Plugin ID                                                                                    |
| `api.name`              | `string`                  | 표시 이름                                                                                    |
| `api.version`           | `string?`                 | Plugin 버전(선택 사항)                                                                       |
| `api.description`       | `string?`                 | Plugin 설명(선택 사항)                                                                       |
| `api.source`            | `string`                  | Plugin 소스 경로                                                                             |
| `api.rootDir`           | `string?`                 | Plugin 루트 디렉터리(선택 사항)                                                              |
| `api.config`            | `OpenClawConfig`          | 현재 구성 스냅샷(가능한 경우 활성 메모리 내 런타임 스냅샷)                                   |
| `api.pluginConfig`      | `Record<string, unknown>` | `plugins.entries.<id>.config`의 Plugin 전용 구성                                             |
| `api.runtime`           | `PluginRuntime`           | [런타임 헬퍼](/ko/plugins/sdk-runtime)                                                          |
| `api.logger`            | `PluginLogger`            | 범위가 지정된 로거 (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`  | `PluginRegistrationMode`  | 현재 로드 모드. `"setup-runtime"`은 전체 entry 이전의 경량 시작/설정 창입니다               |
| `api.resolvePath(input)`| `(string) => string`      | Plugin 루트를 기준으로 경로 확인                                                             |

## 내부 모듈 규칙

Plugin 내부에서는 내부 import에 로컬 barrel 파일을 사용하세요:

```
my-plugin/
  api.ts            # 외부 소비자를 위한 공개 export
  runtime-api.ts    # 내부 전용 런타임 export
  index.ts          # Plugin 진입점
  setup-entry.ts    # 경량 설정 전용 entry (선택 사항)
```

<Warning>
  프로덕션 코드에서 `openclaw/plugin-sdk/<your-plugin>`을 통해 자신의 Plugin을
  import하지 마세요. 내부 import는 `./api.ts` 또는
  `./runtime-api.ts`를 통하도록 하세요. SDK 경로는 외부 계약 전용입니다.
</Warning>

파사드로 로드되는 번들 Plugin 공개 표면(`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` 및 유사한 공개 entry 파일)은
OpenClaw가 이미 실행 중이면 활성 런타임 구성 스냅샷을 우선합니다. 아직 런타임
스냅샷이 없으면 디스크에 있는 확인된 구성 파일로 폴백합니다.

provider Plugins는 헬퍼가 의도적으로 provider 전용이며 아직 일반 SDK
서브패스에 속하지 않을 때 좁은 Plugin 로컬 계약 barrel을 노출할 수 있습니다.
번들 예시:

- **Anthropic**: Claude
  beta-header 및 `service_tier` 스트림 헬퍼를 위한 공개 `api.ts` / `contract-api.ts` seam
- **`@openclaw/openai-provider`**: `api.ts`가 provider 빌더,
  기본 모델 헬퍼, 실시간 provider 빌더를 export
- **`@openclaw/openrouter-provider`**: `api.ts`가 provider 빌더와
  온보딩/구성 헬퍼를 export

<Warning>
  확장 프로덕션 코드 역시 `openclaw/plugin-sdk/<other-plugin>`
  import를 피해야 합니다. 헬퍼가 정말로 공유되어야 한다면, 두 Plugin을 서로 결합하는 대신
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` 또는 다른
  capability 지향 표면 같은 중립 SDK 서브패스로 승격하세요.
</Warning>

## 관련

<CardGroup cols={2}>
  <Card title="진입점" icon="door-open" href="/ko/plugins/sdk-entrypoints">
    `definePluginEntry` 및 `defineChannelPluginEntry` 옵션.
  </Card>
  <Card title="런타임 헬퍼" icon="gears" href="/ko/plugins/sdk-runtime">
    전체 `api.runtime` 네임스페이스 참조.
  </Card>
  <Card title="설정 및 구성" icon="sliders" href="/ko/plugins/sdk-setup">
    패키징, 매니페스트, 구성 스키마.
  </Card>
  <Card title="테스트" icon="vial" href="/ko/plugins/sdk-testing">
    테스트 유틸리티와 lint 규칙.
  </Card>
  <Card title="SDK 마이그레이션" icon="arrows-turn-right" href="/ko/plugins/sdk-migration">
    더 이상 권장되지 않는 표면에서 마이그레이션하기.
  </Card>
  <Card title="Plugin 내부 구조" icon="diagram-project" href="/ko/plugins/architecture">
    심층 아키텍처와 capability 모델.
  </Card>
</CardGroup>
