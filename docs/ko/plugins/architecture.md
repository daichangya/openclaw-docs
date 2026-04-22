---
read_when:
    - 네이티브 OpenClaw plugins 빌드 또는 디버깅
    - plugin capability model 또는 소유권 경계를 이해하기
    - plugin 로드 파이프라인 또는 레지스트리 작업 중
    - provider 런타임 훅 또는 채널 Plugin 구현 중
sidebarTitle: Internals
summary: 'Plugin 내부: capability model, 소유권, 계약, 로드 파이프라인, 런타임 도우미'
title: Plugin Internals
x-i18n:
    generated_at: "2026-04-22T04:24:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69080a1d0e496b321a6fd5a3e925108c3a03c41710073f8f23af13933a091e28
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin Internals

<Info>
  이것은 **심층 아키텍처 참조**입니다. 실용적인 가이드는 다음을 참고하세요.
  - [Install and use plugins](/ko/tools/plugin) — 사용자 가이드
  - [Getting Started](/ko/plugins/building-plugins) — 첫 Plugin 튜토리얼
  - [Channel Plugins](/ko/plugins/sdk-channel-plugins) — 메시징 채널 빌드
  - [Provider Plugins](/ko/plugins/sdk-provider-plugins) — 모델 provider 빌드
  - [SDK Overview](/ko/plugins/sdk-overview) — import map 및 등록 API
</Info>

이 페이지는 OpenClaw plugin 시스템의 내부 아키텍처를 다룹니다.

## 공개 capability model

Capabilities는 OpenClaw 내부의 공개 **네이티브 Plugin** model입니다. 모든
네이티브 OpenClaw Plugin은 하나 이상의 capability 유형에 대해 등록됩니다.

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| 텍스트 추론         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI 추론 백엔드  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| 음성                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| 실시간 전사 | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| 실시간 음성         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| 미디어 이해    | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| 이미지 생성       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 음악 생성       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| 비디오 생성       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| 웹 가져오기              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| 웹 검색             | `api.registerWebSearchProvider(...)`             | `google`                             |
| 채널 / 메시징    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

capability를 하나도 등록하지 않고 hooks, tools 또는
services를 제공하는 Plugin은 **레거시 hook-only** Plugin입니다. 이 패턴도 여전히 완전히 지원됩니다.

### 외부 호환성 입장

capability model은 코어에 도입되어 오늘날 번들/네이티브 plugins에서
사용되고 있지만, 외부 plugin 호환성에는 여전히 "내보내졌으니 고정됨"보다 더 엄격한 기준이 필요합니다.

현재 지침:

- **기존 외부 plugins:** hook 기반 통합이 계속 동작하도록 유지하고,
  이를 호환성 기준선으로 취급
- **새 번들/네이티브 plugins:** vendor별 직접 접근이나 새 hook-only 설계보다
  명시적 capability 등록을 선호
- **capability 등록을 채택하는 외부 plugins:** 허용되지만,
  문서가 계약을 안정적이라고 명시적으로 표시하지 않는 한 capability별 도우미 표면은
  진화 중인 것으로 취급

실질적인 규칙:

- capability 등록 API가 의도된 방향입니다
- 전환 중 외부 plugins에는 레거시 hooks가 가장 안전한 무중단 경로로 남아 있습니다
- 내보내진 도우미 하위 경로가 모두 같은 것은 아닙니다. 우연히 노출된 helper export가 아니라
  문서화된 좁은 계약을 선호하세요

### Plugin 형태

OpenClaw는 로드된 각 Plugin을 정적 메타데이터만이 아니라 실제
등록 동작을 기준으로 형태로 분류합니다.

- **plain-capability** -- 정확히 하나의 capability 유형만 등록합니다(예:
  `mistral` 같은 provider 전용 Plugin)
- **hybrid-capability** -- 여러 capability 유형을 등록합니다(예:
  `openai`는 텍스트 추론, 음성, 미디어 이해, 이미지
  생성을 소유)
- **hook-only** -- typed 또는 custom hooks만 등록하고 capabilities,
  tools, commands, services는 등록하지 않음
- **non-capability** -- tools, commands, services 또는 routes를 등록하지만
  capabilities는 등록하지 않음

Plugin의 형태와 capability 세부 내역은 `openclaw plugins inspect <id>`로 확인할 수 있습니다.
자세한 내용은 [CLI reference](/cli/plugins#inspect)를 참고하세요.

### 레거시 hooks

`before_agent_start` hook은 hook-only plugins를 위한 호환성 경로로 계속 지원됩니다.
실제 레거시 plugins가 여전히 여기에 의존합니다.

방향:

- 계속 동작하도록 유지
- 레거시로 문서화
- 모델/provider 재정의 작업에는 `before_model_resolve`를 선호
- 프롬프트 변경 작업에는 `before_prompt_build`를 선호
- 실제 사용량이 감소하고 fixture 커버리지가 마이그레이션 안전성을 입증한 후에만 제거

### 호환성 신호

`openclaw doctor` 또는 `openclaw plugins inspect <id>`를 실행하면
다음 라벨 중 하나를 볼 수 있습니다.

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | 구성이 정상적으로 파싱되고 plugins가 확인됨                       |
| **compatibility advisory** | Plugin이 지원되지만 오래된 패턴을 사용함(예: `hook-only`) |
| **legacy warning**         | Plugin이 더 이상 권장되지 않는 `before_agent_start`를 사용함        |
| **hard error**             | 구성이 잘못되었거나 plugin 로드에 실패함                   |

`hook-only`와 `before_agent_start`는 모두 현재 Plugin을 깨뜨리지 않습니다.
`hook-only`는 권고 사항이며, `before_agent_start`는 경고만 발생시킵니다. 이
신호들은 `openclaw status --all`과 `openclaw plugins doctor`에도 표시됩니다.

## 아키텍처 개요

OpenClaw의 plugin 시스템은 네 개의 계층으로 구성됩니다.

1. **Manifest + 검색**
   OpenClaw는 구성된 경로, workspace 루트,
   전역 extension 루트, 번들 extensions에서 후보 plugins를 찾습니다. 검색은 먼저 네이티브
   `openclaw.plugin.json` manifests와 지원되는 번들 manifests를 읽습니다.
2. **활성화 + 검증**
   코어는 검색된 Plugin이 활성화, 비활성화, 차단 또는
   memory 같은 독점 슬롯에 선택되었는지 결정합니다.
3. **런타임 로드**
   네이티브 OpenClaw plugins는 jiti를 통해 in-process로 로드되고
   중앙 registry에 capabilities를 등록합니다. 호환 가능한 bundles는
   런타임 코드를 import하지 않고 registry 레코드로 정규화됩니다.
4. **표면 소비**
   OpenClaw의 나머지 부분은 registry를 읽어 tools, channels, provider
   설정, hooks, HTTP routes, CLI commands, services를 노출합니다.

특히 plugin CLI의 경우, 루트 명령 검색은 두 단계로 나뉩니다.

- parse-time 메타데이터는 `registerCli(..., { descriptors: [...] })`에서 제공됩니다
- 실제 plugin CLI 모듈은 lazy 상태를 유지하다가 첫 호출 시 등록될 수 있습니다

이렇게 하면 plugin 소유 CLI 코드를 plugin 내부에 유지하면서도 OpenClaw가
파싱 전에 루트 명령 이름을 예약할 수 있습니다.

중요한 설계 경계:

- 검색 + 구성 검증은 plugin 코드를 실행하지 않고
  **manifest/schema 메타데이터**로 동작해야 합니다
- 네이티브 런타임 동작은 plugin 모듈의 `register(api)` 경로에서 옵니다

이 분리는 OpenClaw가 전체 런타임이 활성화되기 전에
구성을 검증하고, 누락/비활성화된 plugins를 설명하고, UI/schema 힌트를 구성할 수 있게 합니다.

### 채널 plugins와 공유 message tool

채널 plugins는 일반 채팅 작업을 위해 별도의 send/edit/react tool을 등록할 필요가 없습니다.
OpenClaw는 코어에 하나의 공유 `message` tool을 유지하고,
채널 plugins는 그 뒤의 채널별 검색과 실행을 소유합니다.

현재 경계는 다음과 같습니다.

- 코어는 공유 `message` tool 호스트, 프롬프트 연결, 세션/스레드
  bookkeeping, 실행 디스패치를 소유
- 채널 plugins는 범위가 지정된 action 검색, capability 검색, 채널별 스키마 조각을 소유
- 채널 plugins는 conversation ID가 thread ID를 어떻게 인코딩하거나
  부모 대화에서 상속하는지 같은 provider별 세션 대화 문법을 소유
- 채널 plugins는 action adapter를 통해 최종 action을 실행

채널 plugins의 SDK 표면은
`ChannelMessageActionAdapter.describeMessageTool(...)`입니다. 이 통합 검색
호출을 통해 Plugin은 표시할 actions, capabilities, 스키마 기여를
함께 반환할 수 있으므로 이 조각들이 서로 어긋나지 않습니다.

채널별 message-tool 매개변수가 로컬 경로 또는 원격 미디어 URL 같은
미디어 소스를 전달하는 경우, Plugin은 또한
`describeMessageTool(...)`에서 `mediaSourceParams`를 반환해야 합니다. 코어는 이 명시적
목록을 사용해 plugin 소유 매개변수 이름을 하드코딩하지 않고도 샌드박스 경로 정규화와 발신 미디어 액세스 힌트를 적용합니다.
거기서는 채널 전체의 단일 평면 목록이 아니라 action 범위 맵을
선호하세요. 그래야 profile 전용 미디어 매개변수가 `send` 같은
무관한 action에서 정규화되지 않습니다.

코어는 런타임 범위를 이 검색 단계에 전달합니다. 중요한 필드는 다음과 같습니다.

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 신뢰된 수신 `requesterSenderId`

이는 컨텍스트 민감 Plugin에 중요합니다. 채널은 코어 `message` tool에 채널별 분기를 하드코딩하지 않고도
활성 계정, 현재 room/thread/message,
또는 신뢰된 요청자 ID에 따라 message actions를 숨기거나 노출할 수 있습니다.

이 때문에 임베디드 runner 라우팅 변경은 여전히 plugin 작업입니다. runner는
현재 chat/session ID를 plugin 검색 경계로 전달해야 하며, 그래야 공유 `message` tool이 현재 턴에 맞는 채널 소유 표면을 노출할 수 있습니다.

채널 소유 실행 helpers의 경우, 번들 plugins는 실행
런타임을 자체 extension 모듈 내부에 유지해야 합니다. 코어는 더 이상
`src/agents/tools` 아래의 Discord, Slack, Telegram, WhatsApp 메시지 action 런타임을 소유하지 않습니다.
우리는 별도의 `plugin-sdk/*-action-runtime` 하위 경로를 공개하지 않으며, 번들
plugins는 자체 extension 소유 모듈에서 로컬 런타임 코드를 직접 import해야 합니다.

동일한 경계는 일반적인 provider 이름이 붙은 SDK seam에도 적용됩니다. 코어는
Slack, Discord, Signal, WhatsApp 또는 유사한 extension에 대한 채널별 편의 barrel을 import해서는 안 됩니다.
코어에 동작이 필요하다면 번들 plugin 자체의 `api.ts` / `runtime-api.ts`
barrel을 사용하거나, 필요 사항을 공유 SDK의 좁고 일반적인 capability로 승격해야 합니다.

특히 투표의 경우 두 가지 실행 경로가 있습니다.

- `outbound.sendPoll`은 공통 투표 model에 맞는 채널을 위한 공유 기준선입니다
- `actions.handleAction("poll")`은 채널별 투표 의미 체계 또는 추가 투표 매개변수에 권장되는 경로입니다

이제 코어는 plugin 투표 디스패치가 action을 거절한 후에야 공유 투표 파싱을 수행하므로,
plugin 소유 투표 handlers는 먼저 일반 투표 파서에 막히지 않고 채널별 투표
필드를 수용할 수 있습니다.

전체 시작 순서는 [Load pipeline](#load-pipeline)을 참고하세요.

## Capability ownership model

OpenClaw는 네이티브 Plugin을 관련 없는 통합의 모음이 아니라 **회사** 또는
**기능**에 대한 소유권 경계로 취급합니다.

이는 다음을 의미합니다.

- 회사 Plugin은 일반적으로 해당 회사의 OpenClaw 대상
  표면 전체를 소유해야 합니다
- 기능 Plugin은 일반적으로 자신이 도입하는 전체 기능 표면을 소유해야 합니다
- 채널은 provider 동작을 임의로 재구현하는 대신 공유 코어 capabilities를 소비해야 합니다

예시:

- 번들 `openai` Plugin은 OpenAI 모델 provider 동작과 OpenAI
  음성 + 실시간 음성 + 미디어 이해 + 이미지 생성 동작을 소유합니다
- 번들 `elevenlabs` Plugin은 ElevenLabs 음성 동작을 소유합니다
- 번들 `microsoft` Plugin은 Microsoft 음성 동작을 소유합니다
- 번들 `google` Plugin은 Google 모델 provider 동작과 함께 Google
  미디어 이해 + 이미지 생성 + 웹 검색 동작을 소유합니다
- 번들 `firecrawl` Plugin은 Firecrawl 웹 가져오기 동작을 소유합니다
- 번들 `minimax`, `mistral`, `moonshot`, `zai` plugins는 해당
  미디어 이해 백엔드를 소유합니다
- 번들 `qwen` Plugin은 Qwen 텍스트 provider 동작과 함께
  미디어 이해 및 비디오 생성 동작을 소유합니다
- `voice-call` Plugin은 기능 Plugin입니다. 통화 transport, tools,
  CLI, routes, Twilio 미디어 스트림 브리징을 소유하지만, vendor plugins를 직접
  import하는 대신 공유 음성과 실시간 전사, 실시간 음성 capabilities를 소비합니다

의도된 최종 상태는 다음과 같습니다.

- OpenAI는 텍스트 모델, 음성, 이미지, 향후 비디오까지 포함하더라도 하나의 Plugin에 존재합니다
- 다른 vendor도 자체 표면 영역에 대해 동일하게 할 수 있습니다
- 채널은 어떤 vendor Plugin이 provider를 소유하는지 신경 쓰지 않고, 코어가 노출하는
  공유 capability 계약을 소비합니다

이것이 핵심 구분입니다.

- **plugin** = 소유권 경계
- **capability** = 여러 plugins가 구현하거나 소비할 수 있는 코어 계약

따라서 OpenClaw가 비디오 같은 새 도메인을 추가할 때 첫 질문은
"어떤 provider가 비디오 처리를 하드코딩해야 하는가?"가 아닙니다. 첫 질문은 "코어 비디오 capability 계약은
무엇인가?"입니다. 그 계약이 존재하면 vendor plugins는 그 계약에 등록할 수 있고,
채널/기능 plugins는 이를 소비할 수 있습니다.

capability가 아직 없다면, 일반적으로 올바른 방법은 다음과 같습니다.

1. 코어에서 누락된 capability를 정의합니다
2. 이를 plugin API/런타임을 통해 타입이 있는 방식으로 노출합니다
3. 채널/기능을 해당 capability에 맞게 연결합니다
4. vendor plugins가 구현을 등록하게 합니다

이렇게 하면 소유권은 명시적으로 유지하면서도 단일 vendor나
일회성 plugin별 코드 경로에 의존하는 코어 동작을 피할 수 있습니다.

### Capability 계층화

코드가 어디에 속해야 하는지 결정할 때 다음 mental model을 사용하세요.

- **코어 capability 계층**: 공유 오케스트레이션, 정책, 대체, 구성
  병합 규칙, 전달 의미 체계, 타입 계약
- **vendor Plugin 계층**: vendor별 API, 인증, 모델 카탈로그, 음성
  합성, 이미지 생성, 향후 비디오 백엔드, 사용량 엔드포인트
- **채널/기능 Plugin 계층**: 공유 코어 capabilities를
  소비하고 이를 표면에 제시하는 Slack/Discord/voice-call 등의 통합

예를 들어 TTS는 다음 형태를 따릅니다.

- 코어는 응답 시점 TTS 정책, 대체 순서, 환경설정, 채널 전달을 소유합니다
- `openai`, `elevenlabs`, `microsoft`는 합성 구현을 소유합니다
- `voice-call`은 전화 TTS 런타임 helper를 소비합니다

향후 capabilities에도 동일한 패턴을 선호해야 합니다.

### 다중 capability 회사 Plugin 예시

회사 Plugin은 외부에서 볼 때 응집력 있게 느껴져야 합니다. OpenClaw에
모델, 음성, 실시간 전사, 실시간 음성, 미디어
이해, 이미지 생성, 비디오 생성, 웹 가져오기, 웹 검색에 대한 공유
계약이 있다면, vendor는 모든 표면을 한 곳에서 소유할 수 있습니다.

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

중요한 것은 정확한 helper 이름이 아닙니다. 형태가 중요합니다.

- 하나의 Plugin이 vendor 표면을 소유합니다
- 코어는 여전히 capability 계약을 소유합니다
- 채널과 기능 plugins는 vendor 코드가 아니라 `api.runtime.*` helpers를 소비합니다
- 계약 테스트는 Plugin이 자신이 소유한다고 주장하는 capabilities를
  등록했는지 단언할 수 있습니다

### Capability 예시: 비디오 이해

OpenClaw는 이미 이미지/오디오/비디오 이해를 하나의 공유
capability로 취급합니다. 여기에 동일한 소유권 model이 적용됩니다.

1. 코어가 media-understanding 계약을 정의합니다
2. vendor plugins가 해당하는 경우 `describeImage`, `transcribeAudio`,
   `describeVideo`를 등록합니다
3. 채널과 기능 plugins는 vendor 코드에 직접 연결하는 대신 공유 코어 동작을 소비합니다

이렇게 하면 한 provider의 비디오 가정을 코어에 박아 넣는 일을 피할 수 있습니다. Plugin이
vendor 표면을 소유하고, 코어는 capability 계약과 대체 동작을 소유합니다.

비디오 생성도 이미 동일한 순서를 사용합니다. 코어가 타입이 있는
capability 계약과 런타임 helper를 소유하고, vendor plugins는
`api.registerVideoGenerationProvider(...)` 구현을 등록합니다.

구체적인 롤아웃 체크리스트가 필요하신가요? [Capability Cookbook](/ko/plugins/architecture)를 참고하세요.

## 계약 및 강제

plugin API 표면은 의도적으로
`OpenClawPluginApi`에 타입이 지정되고 중앙화되어 있습니다. 이 계약은 지원되는 등록 지점과
Plugin이 의존할 수 있는 런타임 helpers를 정의합니다.

이것이 중요한 이유:

- plugin 작성자는 하나의 안정적인 내부 표준을 얻습니다
- 코어는 두 plugins가 같은 provider ID를 등록하는 것 같은 중복 소유권을 거부할 수 있습니다
- 시작 시 잘못된 등록에 대해 실행 가능한 진단을 표시할 수 있습니다
- 계약 테스트가 번들 plugin 소유권을 강제하고 조용한 드리프트를 방지할 수 있습니다

강제는 두 계층으로 이루어집니다.

1. **런타임 등록 강제**
   Plugin registry는 plugins가 로드될 때 등록을 검증합니다. 예:
   중복 provider ID, 중복 음성 provider ID, 잘못된
   등록은 정의되지 않은 동작 대신 plugin 진단을 생성합니다.
2. **계약 테스트**
   번들 plugins는 테스트 실행 중 계약 registry에 캡처되므로
   OpenClaw가 소유권을 명시적으로 단언할 수 있습니다. 현재는 모델
   providers, 음성 providers, 웹 검색 providers, 번들 등록
   소유권에 사용됩니다.

실질적인 효과는 OpenClaw가 어떤 Plugin이 어떤
표면을 소유하는지 사전에 안다는 점입니다. 이는 소유권이 암묵적이 아니라 명시적이고 타입이 있으며 테스트 가능하기 때문에
코어와 채널이 매끄럽게 조합될 수 있게 합니다.

### 계약에 포함되어야 하는 것

좋은 plugin 계약은 다음과 같습니다.

- 타입이 있음
- 작음
- capability별
- 코어 소유
- 여러 plugins가 재사용 가능
- 채널/기능이 vendor 지식 없이 소비 가능

나쁜 plugin 계약은 다음과 같습니다.

- 코어에 숨겨진 vendor별 정책
- registry를 우회하는 일회성 plugin 탈출구
- vendor 구현에 직접 접근하는 채널 코드
- `OpenClawPluginApi` 또는
  `api.runtime`의 일부가 아닌 임시 런타임 객체

확신이 없으면 추상화 수준을 높이세요. 먼저 capability를 정의한 다음,
plugins가 여기에 연결되도록 하세요.

## 실행 model

네이티브 OpenClaw plugins는 Gateway와 **같은 프로세스 내에서**
실행됩니다. 샌드박스되지 않습니다. 로드된 네이티브 Plugin은 코어 코드와 동일한 프로세스 수준 신뢰 경계를 가집니다.

의미하는 바:

- 네이티브 Plugin은 tools, 네트워크 handlers, hooks, services를 등록할 수 있습니다
- 네이티브 Plugin 버그는 gateway를 크래시시키거나 불안정하게 만들 수 있습니다
- 악의적인 네이티브 Plugin은 OpenClaw 프로세스 내부의 임의 코드 실행과 동일합니다

호환 가능한 bundles는 OpenClaw가 현재 이를
메타데이터/콘텐츠 팩으로 취급하기 때문에 기본적으로 더 안전합니다. 현재 릴리스에서는 이는 주로 번들
Skills를 의미합니다.

번들이 아닌 plugins에는 허용 목록과 명시적 설치/로드 경로를 사용하세요. workspace plugins는
프로덕션 기본값이 아니라 개발 시점 코드로 취급하세요.

번들 workspace 패키지 이름의 경우, plugin ID는 기본적으로 npm
이름인 `@openclaw/<id>`에 고정하거나, 패키지가 의도적으로 더 좁은 plugin 역할을 노출하는 경우
승인된 타입 접미사인 `-provider`, `-plugin`, `-speech`, `-sandbox`, `-media-understanding`를 사용하세요.

중요한 신뢰 참고:

- `plugins.allow`는 소스 출처가 아니라 **plugin IDs**를 신뢰합니다.
- 번들 Plugin과 동일한 ID를 가진 workspace Plugin은 해당 workspace Plugin이 활성화/허용 목록에 있을 때 의도적으로
  번들 사본을 가립니다.
- 이는 로컬 개발, 패치 테스트, 핫픽스에 정상적이며 유용합니다.

## export 경계

OpenClaw는 구현 편의성이 아니라 capabilities를 export합니다.

capability 등록은 공개로 유지하세요. 비계약 helper export는 줄이세요.

- 번들 plugin 전용 helper 하위 경로
- 공개 API로 의도되지 않은 런타임 배관 하위 경로
- vendor별 편의 helpers
- 구현 세부 사항인 설정/온보딩 helpers

일부 번들 plugin helper 하위 경로는 호환성과 번들 plugin 유지보수를 위해 생성된 SDK export
맵에 여전히 남아 있습니다. 현재 예시로는
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, 그리고 여러 `plugin-sdk/matrix*` seam이 있습니다. 이들은
새 서드파티 plugins에 권장되는 SDK 패턴이 아니라 예약된 구현 세부 export로 취급하세요.

## Load pipeline

시작 시 OpenClaw는 대략 다음을 수행합니다.

1. 후보 plugin 루트를 검색
2. 네이티브 또는 호환 bundle manifest와 package 메타데이터를 읽음
3. 안전하지 않은 후보를 거부
4. plugin 구성 정규화(`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. 각 후보의 활성화 여부 결정
6. jiti를 통해 활성화된 네이티브 모듈 로드
7. 네이티브 `register(api)`(또는 레거시 별칭인 `activate(api)`) hook을 호출하고 plugin registry에 등록을 수집
8. registry를 명령/런타임 표면에 노출

<Note>
`activate`는 `register`의 레거시 별칭입니다. 로더는 존재하는 것을 확인하여(`def.register ?? def.activate`) 같은 시점에 호출합니다. 모든 번들 plugins는 `register`를 사용합니다. 새 plugins에는 `register`를 선호하세요.
</Note>

안전 게이트는 런타임 실행 **이전**에 발생합니다. 후보는
entry가 plugin 루트 밖으로 벗어나거나, 경로가 world-writable이거나,
번들이 아닌 plugins에 대해 경로 소유권이 의심스러워 보이면 차단됩니다.

### Manifest 우선 동작

manifest는 컨트롤 플레인의 진실 원본입니다. OpenClaw는 이를 사용해 다음을 수행합니다.

- Plugin 식별
- 선언된 channels/Skills/구성 스키마 또는 bundle capabilities 검색
- `plugins.entries.<id>.config` 검증
- Control UI 라벨/placeholder 보강
- 설치/카탈로그 메타데이터 표시
- plugin 런타임을 로드하지 않고도 저렴한 활성화 및 설정 descriptor 유지

네이티브 plugins의 경우 런타임 모듈은 데이터 플레인 부분입니다. 이것은
hooks, tools, commands, provider 흐름 같은 실제 동작을 등록합니다.

선택적 manifest `activation` 및 `setup` 블록은 컨트롤 플레인에 남아 있습니다.
이들은 활성화 계획과 설정 검색을 위한 메타데이터 전용 descriptor이며,
런타임 등록, `register(...)`, 또는 `setupEntry`를 대체하지 않습니다.
첫 번째 라이브 활성화 소비자는 이제 manifest 명령, 채널, provider 힌트를 사용해
더 광범위한 registry 구체화 전에 plugin 로드를 좁힙니다.

- CLI 로드는 요청된 기본 명령을 소유한 plugins로 좁혀집니다
- 채널 설정/plugin 확인은 요청된
  채널 ID를 소유한 plugins로 좁혀집니다
- 명시적 provider 설정/런타임 확인은 요청된 provider ID를 소유한 plugins로 좁혀집니다

이제 설정 검색은 먼저 `setup.providers` 및 `setup.cliBackends` 같은
descriptor 소유 ID를 사용해 후보 plugins를 좁힌 다음,
여전히 설정 시점 런타임 hooks가 필요한 plugins에 대해서만
`setup-api`로 대체합니다. 검색된 둘 이상의 Plugin이 동일하게 정규화된 설정 provider 또는 CLI backend
ID를 주장하면, 설정 조회는 검색 순서에 의존하지 않고
모호한 소유자를 거부합니다.

### 로더가 캐시하는 것

OpenClaw는 다음에 대해 짧은 in-process 캐시를 유지합니다.

- 검색 결과
- manifest registry 데이터
- 로드된 plugin registry

이 캐시는 급격한 시작 부하와 반복 명령 오버헤드를 줄입니다. 이것들은
영속성이 아니라 수명이 짧은 성능 캐시로 생각하면 안전합니다.

성능 참고:

- 이 캐시를 비활성화하려면 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 또는
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`을 설정하세요.
- `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 및
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`로 캐시 기간을 조정하세요.

## Registry model

로드된 plugins는 임의의 코어 전역 상태를 직접 변경하지 않습니다. 대신
중앙 plugin registry에 등록합니다.

registry는 다음을 추적합니다.

- plugin 레코드(ID, 소스, 원본, 상태, 진단)
- tools
- 레거시 hooks 및 타입이 있는 hooks
- channels
- providers
- Gateway RPC handlers
- HTTP routes
- CLI registrars
- 백그라운드 services
- plugin 소유 commands

그런 다음 코어 기능은 plugin 모듈과 직접 대화하는 대신 해당 registry에서 읽습니다.
이렇게 하면 로딩이 단방향으로 유지됩니다.

- plugin 모듈 -> registry 등록
- 코어 런타임 -> registry 소비

이 분리는 유지보수성에 중요합니다. 대부분의 코어 표면이
"모든 plugin 모듈을 특수 처리"가 아니라 "registry 읽기"라는 하나의 통합 지점만
필요하게 되기 때문입니다.

## 대화 바인딩 콜백

대화를 바인딩하는 plugins는 승인이 해결될 때 반응할 수 있습니다.

바인드 요청이 승인되거나 거부된 후 콜백을 받으려면
`api.onConversationBindingResolved(...)`를 사용하세요.

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // 이제 이 plugin + conversation에 대한 binding이 존재합니다.
        console.log(event.binding?.conversationId);
        return;
      }

      // 요청이 거부되었습니다. 로컬 보류 상태를 모두 지우세요.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

콜백 페이로드 필드:

- `status`: `"approved"` 또는 `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, 또는 `"deny"`
- `binding`: 승인된 요청에 대한 해결된 바인딩
- `request`: 원래 요청 요약, 분리 힌트, 발신자 ID, 대화 메타데이터

이 콜백은 알림 전용입니다. 누가 대화를 바인딩할 수 있는지를 바꾸지 않으며,
코어 승인 처리가 끝난 후 실행됩니다.

## Provider 런타임 hooks

이제 provider plugins에는 두 계층이 있습니다.

- manifest 메타데이터: 런타임 로드 전에 저렴한 provider env 인증 조회를 위한 `providerAuthEnvVars`,
  인증을 공유하는 provider 변형을 위한 `providerAuthAliases`,
  런타임 로드 전에 저렴한 채널 env/설정 조회를 위한 `channelEnvVars`,
  런타임 로드 전에 저렴한 온보딩/인증 선택 라벨과
  CLI 플래그 메타데이터를 위한 `providerAuthChoices`
- 구성 시점 hooks: `catalog` / 레거시 `discovery`, 그리고 `applyConfigDefaults`
- 런타임 hooks: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw는 여전히 일반 에이전트 루프, 대체, transcript 처리, tool 정책을 소유합니다.
이 hooks는 전체 사용자 지정 추론 transport가 필요하지 않으면서
provider별 동작을 위한 확장 표면입니다.

provider에 런타임을 로드하지 않고도 일반 인증/상태/모델 선택기 경로가 볼 수 있어야 하는
env 기반 자격 증명이 있다면 manifest `providerAuthEnvVars`를 사용하세요.
하나의 provider ID가 다른 provider ID의 env vars, 인증 프로필,
구성 기반 인증, API 키 온보딩 선택을 재사용해야 한다면 manifest `providerAuthAliases`를 사용하세요.
온보딩/인증 선택 CLI 표면이 provider 런타임을 로드하지 않고도
provider의 choice ID, 그룹 라벨, 간단한
단일 플래그 인증 연결을 알아야 한다면 manifest `providerAuthChoices`를 사용하세요. provider 런타임
`envVars`는 온보딩 라벨이나 OAuth
client-id/client-secret 설정 변수 같은 운영자 대상 힌트용으로 유지하세요.

채널에 런타임을 로드하지 않고도 일반 shell-env 대체, config/status 검사,
설정 프롬프트가 볼 수 있어야 하는 env 기반 인증 또는 설정이 있다면
manifest `channelEnvVars`를 사용하세요.

### Hook 순서와 사용 시점

모델/provider plugins의 경우 OpenClaw는 대략 다음 순서로 hooks를 호출합니다.
"언제 사용할지" 열은 빠른 의사결정 가이드입니다.

| #   | Hook                              | 수행 내용                                                                                                   | 사용 시점                                                                                                                                 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 생성 중 `models.providers`에 provider 구성을 게시                                | provider가 카탈로그 또는 기본 base URL을 소유할 때                                                                                                |
| 2   | `applyConfigDefaults`             | 구성 구체화 중 provider 소유 전역 구성 기본값을 적용                                      | 기본값이 인증 모드, env 또는 provider 모델 계열 의미 체계에 따라 달라질 때                                                                       |
| --  | _(built-in model lookup)_         | OpenClaw가 먼저 일반 registry/카탈로그 경로를 시도함                                                          | _(plugin hook 아님)_                                                                                                                       |
| 3   | `normalizeModelId`                | 조회 전에 레거시 또는 프리뷰 모델 ID 별칭을 정규화                                                     | provider가 정식 모델 확인 전에 별칭 정리를 소유할 때                                                                               |
| 4   | `normalizeTransport`              | 일반 모델 조립 전에 provider 계열 `api` / `baseUrl`을 정규화                                      | provider가 동일한 transport 계열의 사용자 지정 provider ID에 대한 transport 정리를 소유할 때                                                        |
| 5   | `normalizeConfig`                 | 런타임/provider 확인 전에 `models.providers.<id>`를 정규화                                           | plugin과 함께 있어야 하는 구성 정리가 필요할 때. 번들 Google 계열 helpers는 지원되는 Google 구성 항목의 대체 수단도 제공함 |
| 6   | `applyNativeStreamingUsageCompat` | 구성 providers에 네이티브 streaming-usage 호환성 재작성을 적용                                               | provider가 엔드포인트 기반 네이티브 streaming usage 메타데이터 수정이 필요할 때                                                                        |
| 7   | `resolveConfigApiKey`             | 런타임 인증 로드 전에 구성 providers의 env-marker 인증을 확인                                       | provider가 provider 소유 env-marker API 키 확인이 필요할 때. `amazon-bedrock`은 여기에 내장 AWS env-marker 확인기도 가짐                |
| 8   | `resolveSyntheticAuth`            | 일반 텍스트를 영속화하지 않고 로컬/셀프호스팅 또는 구성 기반 인증을 노출                                   | provider가 synthetic/로컬 자격 증명 marker로 동작할 수 있을 때                                                                               |
| 9   | `resolveExternalAuthProfiles`     | provider 소유 외부 인증 프로필을 오버레이함. CLI/앱 소유 자격 증명의 기본 `persistence`는 `runtime-only`임 | provider가 복사된 refresh token을 영속화하지 않고 외부 인증 자격 증명을 재사용할 때                                                          |
| 10  | `shouldDeferSyntheticProfileAuth` | 저장된 synthetic 프로필 placeholder를 env/구성 기반 인증보다 낮게 둠                                      | provider가 우선순위를 차지하면 안 되는 synthetic placeholder 프로필을 저장할 때                                                               |
| 11  | `resolveDynamicModel`             | 아직 로컬 registry에 없는 provider 소유 모델 ID에 대한 동기 대체                                       | provider가 임의의 업스트림 모델 ID를 허용할 때                                                                                               |
| 12  | `prepareDynamicModel`             | 비동기 워밍업 후 `resolveDynamicModel`을 다시 실행                                                           | provider가 알 수 없는 ID를 확인하기 전에 네트워크 메타데이터가 필요할 때                                                                                |
| 13  | `normalizeResolvedModel`          | 임베디드 runner가 확인된 모델을 사용하기 전 최종 재작성                                               | provider가 transport 재작성이 필요하지만 여전히 코어 transport를 사용할 때                                                                           |
| 14  | `contributeResolvedModelCompat`   | 다른 호환 transport 뒤에 있는 vendor 모델에 대한 compat 플래그를 제공                                  | provider가 provider를 인수하지 않고 프록시 transport에서 자체 모델을 인식할 때                                                     |
| 15  | `capabilities`                    | 공유 코어 로직이 사용하는 provider 소유 transcript/tooling 메타데이터                                           | provider에 transcript/provider-family 특이점이 필요할 때                                                                                            |
| 16  | `normalizeToolSchemas`            | 임베디드 runner가 보기 전에 tool 스키마를 정규화                                                    | provider에 transport 계열 스키마 정리가 필요할 때                                                                                              |
| 17  | `inspectToolSchemas`              | 정규화 후 provider 소유 스키마 진단을 노출                                                  | 코어에 provider별 규칙을 가르치지 않고 provider가 키워드 경고를 제공하려 할 때                                                               |
| 18  | `resolveReasoningOutputMode`      | 네이티브 vs 태그 기반 reasoning-output 계약을 선택                                                              | provider가 네이티브 필드 대신 태그 기반 reasoning/final output이 필요할 때                                                                       |
| 19  | `prepareExtraParams`              | 일반 스트림 옵션 래퍼 전에 요청 매개변수 정규화                                              | provider에 기본 요청 매개변수 또는 provider별 매개변수 정리가 필요할 때                                                                         |
| 20  | `createStreamFn`                  | 일반 스트림 경로를 사용자 지정 transport로 완전히 대체                                                   | provider에 래퍼만이 아니라 사용자 지정 wire protocol이 필요할 때                                                                                   |
| 21  | `wrapStreamFn`                    | 일반 래퍼 적용 후 스트림 래퍼 적용                                                              | provider에 사용자 지정 transport 없이 요청 헤더/본문/모델 compat 래퍼가 필요할 때                                                        |
| 22  | `resolveTransportTurnState`       | 네이티브 턴별 transport 헤더 또는 메타데이터를 첨부                                                           | provider가 일반 transport가 provider 네이티브 턴 ID를 보내도록 하려 할 때                                                                     |
| 23  | `resolveWebSocketSessionPolicy`   | 네이티브 WebSocket 헤더 또는 세션 쿨다운 정책을 첨부                                                    | provider가 일반 WS transport가 세션 헤더 또는 대체 정책을 조정하도록 하려 할 때                                                             |
| 24  | `formatApiKey`                    | 인증 프로필 형식 지정자: 저장된 프로필을 런타임 `apiKey` 문자열로 변환                                     | provider가 추가 인증 메타데이터를 저장하고 사용자 지정 런타임 토큰 형태가 필요할 때                                                                  |
| 25  | `refreshOAuth`                    | 사용자 지정 refresh 엔드포인트 또는 refresh 실패 정책을 위한 OAuth refresh 재정의                                  | provider가 공유 `pi-ai` refresher에 맞지 않을 때                                                                                         |
| 26  | `buildAuthDoctorHint`             | OAuth refresh 실패 시 추가되는 복구 힌트                                                                  | refresh 실패 후 provider 소유 인증 복구 지침이 필요할 때                                                                    |
| 27  | `matchesContextOverflowError`     | provider 소유 context-window 초과 매처                                                                 | provider에 일반 휴리스틱이 놓칠 원시 overflow 오류가 있을 때                                                                              |
| 28  | `classifyFailoverReason`          | provider 소유 대체 사유 분류                                                                  | provider가 원시 API/transport 오류를 rate-limit/overload 등으로 매핑할 수 있을 때                                                                        |
| 29  | `isCacheTtlEligible`              | 프록시/백홀 providers용 prompt-cache 정책                                                               | provider에 프록시별 캐시 TTL 게이트가 필요할 때                                                                                              |
| 30  | `buildMissingAuthMessage`         | 일반 missing-auth 복구 메시지를 대체                                                      | provider에 provider별 missing-auth 복구 힌트가 필요할 때                                                                               |
| 31  | `suppressBuiltInModel`            | 오래된 업스트림 모델 억제와 선택적 사용자 대상 오류 힌트                                          | provider가 오래된 업스트림 행을 숨기거나 vendor 힌트로 대체해야 할 때                                                               |
| 32  | `augmentModelCatalog`             | 검색 후 synthetic/final 카탈로그 행을 추가                                                          | provider가 `models list`와 선택기에 synthetic 순방향 호환 행이 필요할 때                                                                   |
| 33  | `resolveThinkingProfile`          | 모델별 `/think` 수준 집합, 표시 라벨, 기본값                                                 | provider가 선택된 모델에 대해 사용자 지정 thinking 단계 또는 이진 라벨을 노출할 때                                                               |
| 34  | `isBinaryThinking`                | on/off reasoning 토글 호환성 hook                                                                     | provider가 이진 thinking on/off만 노출할 때                                                                                                |
| 35  | `supportsXHighThinking`           | `xhigh` reasoning 지원 호환성 hook                                                                   | provider가 일부 모델에서만 `xhigh`를 사용하려 할 때                                                                                           |
| 36  | `resolveDefaultThinkingLevel`     | 기본 `/think` 수준 호환성 hook                                                                      | provider가 모델 계열의 기본 `/think` 정책을 소유할 때                                                                                    |
| 37  | `isModernModelRef`                | 라이브 프로필 필터 및 스모크 선택용 modern-model 매처                                              | provider가 라이브/스모크 선호 모델 매칭을 소유할 때                                                                                           |
| 38  | `prepareRuntimeAuth`              | 추론 직전에 구성된 자격 증명을 실제 런타임 토큰/키로 교환                       | provider에 토큰 교환 또는 수명이 짧은 요청 자격 증명이 필요할 때                                                                           |
| 39  | `resolveUsageAuth`                | `/usage` 및 관련 상태 표면에 대한 사용량/청구 자격 증명을 확인                                     | provider에 사용자 지정 사용량/할당량 토큰 파싱 또는 다른 사용량 자격 증명이 필요할 때                                                             |
| 40  | `fetchUsageSnapshot`              | 인증 확인 후 provider별 사용량/할당량 스냅샷을 가져오고 정규화                             | provider에 provider별 사용량 엔드포인트 또는 페이로드 파서가 필요할 때                                                                         |
| 41  | `createEmbeddingProvider`         | 메모리/검색용 provider 소유 임베딩 어댑터를 빌드                                                     | 메모리 임베딩 동작이 provider plugin에 속해야 할 때                                                                                  |
| 42  | `buildReplayPolicy`               | provider의 transcript 처리를 제어하는 replay policy를 반환                                        | provider에 사용자 지정 transcript 정책이 필요할 때(예: thinking 블록 제거)                                                             |
| 43  | `sanitizeReplayHistory`           | 일반 transcript 정리 후 replay 기록을 재작성                                                        | provider에 공유 compaction helper를 넘어서는 provider별 replay 재작성이 필요할 때                                                           |
| 44  | `validateReplayTurns`             | 임베디드 runner 전에 최종 replay turn 검증 또는 재구성                                           | provider transport에 일반 정리 후 더 엄격한 turn 검증이 필요할 때                                                                  |
| 45  | `onModelSelected`                 | provider 소유 선택 후 부수 효과를 실행                                                                 | 모델이 활성화될 때 provider에 텔레메트리 또는 provider 소유 상태가 필요할 때                                                                |

`normalizeModelId`, `normalizeTransport`, `normalizeConfig`는 먼저 일치하는
provider Plugin을 확인한 다음, 실제로 모델 ID 또는 transport/config를 변경하는 항목이 나올 때까지
다른 hook 지원 provider plugins로 순차적으로 넘어갑니다. 이렇게 하면
호출자가 어떤 번들 Plugin이 재작성을 소유하는지 알 필요 없이
별칭/호환 provider shim이 동작할 수 있습니다. 어떤 provider hook도 지원되는
Google 계열 구성 항목을 재작성하지 않으면, 번들 Google 구성 정규화기가 여전히
그 호환성 정리를 적용합니다.

provider에 완전히 사용자 지정된 wire protocol 또는 사용자 지정 요청 실행기가 필요하다면,
그것은 다른 종류의 확장입니다. 이 hooks는 여전히 OpenClaw의 일반 추론 루프에서 실행되는
provider 동작을 위한 것입니다.

### Provider 예시

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### 내장 예시

- Anthropic은 `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveThinkingProfile`, `applyConfigDefaults`, `isModernModelRef`,
  `wrapStreamFn`을 사용합니다. Claude 4.6 순방향 호환,
  provider-family 힌트, 인증 복구 지침, 사용량 엔드포인트 통합,
  prompt-cache 적격성, 인증 인지 구성 기본값, Claude
  기본/적응형 thinking 정책, 베타 헤더,
  `/fast` / `serviceTier`, `context1m`에 대한 Anthropic 전용 스트림 형상화를 소유하기 때문입니다.
- Anthropic의 Claude 전용 스트림 helpers는 당분간 번들 Plugin 자체의
  공개 `api.ts` / `contract-api.ts` seam에 남아 있습니다. 이 패키지 표면은
  한 provider의 베타 헤더 규칙을 중심으로 일반 SDK를 넓히는 대신
  `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, 더 저수준의
  Anthropic 래퍼 빌더를 export합니다.
- OpenAI는 `resolveDynamicModel`, `normalizeResolvedModel`,
  `capabilities`와 함께 `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile`, `isModernModelRef`를 사용합니다.
  GPT-5.4 순방향 호환, 직접 OpenAI
  `openai-completions` -> `openai-responses` 정규화, Codex 인지 인증
  힌트, Spark 억제, synthetic OpenAI 목록 행, GPT-5 thinking /
  라이브 모델 정책을 소유하기 때문입니다. `openai-responses-defaults` 스트림 계열은
  attribution 헤더,
  `/fast`/`serviceTier`, 텍스트 verbosity, 네이티브 Codex 웹 검색,
  reasoning-compat 페이로드 형상화, Responses 컨텍스트 관리를 위한
  공유 네이티브 OpenAI Responses 래퍼를 소유합니다.
- OpenRouter는 `catalog`와 함께 `resolveDynamicModel`,
  `prepareDynamicModel`을 사용합니다. provider가 pass-through이며 OpenClaw의 정적 카탈로그가 업데이트되기 전에
  새 모델 ID를 노출할 수 있기 때문입니다. 또한
  `capabilities`, `wrapStreamFn`, `isCacheTtlEligible`를 사용해
  provider별 요청 헤더, 라우팅 메타데이터, reasoning 패치,
  prompt-cache 정책을 코어 밖에 유지합니다. replay 정책은
  `passthrough-gemini` 계열에서 오고, `openrouter-thinking` 스트림 계열은
  프록시 reasoning 주입과 지원되지 않는 모델 / `auto` 건너뛰기를 소유합니다.
- GitHub Copilot은 `catalog`, `auth`, `resolveDynamicModel`,
  `capabilities`와 함께 `prepareRuntimeAuth`, `fetchUsageSnapshot`를 사용합니다.
  provider 소유 디바이스 로그인, 모델 대체 동작, Claude transcript
  특이점, GitHub 토큰 -> Copilot 토큰 교환, provider 소유 사용량
  엔드포인트가 필요하기 때문입니다.
- OpenAI Codex는 `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth`, `augmentModelCatalog`와 함께
  `prepareExtraParams`, `resolveUsageAuth`, `fetchUsageSnapshot`를 사용합니다.
  여전히 코어 OpenAI transport에서 실행되지만 transport/base URL
  정규화, OAuth refresh 대체 정책, 기본 transport 선택,
  synthetic Codex 카탈로그 행, ChatGPT 사용량 엔드포인트 통합을 소유하기 때문입니다.
  직접 OpenAI와 동일한 `openai-responses-defaults` 스트림 계열을 공유합니다.
- Google AI Studio와 Gemini CLI OAuth는 `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn`, `isModernModelRef`를 사용합니다.
  `google-gemini` replay 계열이 Gemini 3.1 순방향 호환 대체,
  네이티브 Gemini replay 검증, bootstrap replay 정리, 태그 기반
  reasoning-output 모드, modern-model 매칭을 소유하고,
  `google-thinking` 스트림 계열이 Gemini thinking 페이로드 정규화를 소유하기 때문입니다.
  Gemini CLI OAuth는 또한 토큰 형식화, 토큰 파싱, quota 엔드포인트
  연결을 위해 `formatApiKey`, `resolveUsageAuth`,
  `fetchUsageSnapshot`를 사용합니다.
- Anthropic Vertex는
  `anthropic-by-model` replay 계열을 통해 `buildReplayPolicy`를 사용합니다. Claude 전용 replay 정리가
  모든 `anthropic-messages` transport가 아니라 Claude ID에만
  범위가 지정되도록 하기 위함입니다.
- Amazon Bedrock은 `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `resolveThinkingProfile`을 사용합니다.
  Anthropic-on-Bedrock 트래픽에 대한 Bedrock 전용
  throttle/not-ready/context-overflow 오류 분류를 소유하기 때문입니다.
  replay 정책은 여전히 동일한
  Claude 전용 `anthropic-by-model` 가드를 공유합니다.
- OpenRouter, Kilocode, Opencode, Opencode Go는 `buildReplayPolicy`를
  `passthrough-gemini` replay 계열을 통해 사용합니다. OpenAI 호환 transport를 통해
  Gemini 모델을 프록시하고 있으며, 네이티브 Gemini replay 검증이나
  bootstrap 재작성 없이 Gemini
  thought-signature 정리가 필요하기 때문입니다.
- MiniMax는
  `hybrid-anthropic-openai` replay 계열을 통해 `buildReplayPolicy`를 사용합니다. 하나의 provider가
  Anthropic-message와 OpenAI 호환 의미 체계를 모두 소유하기 때문입니다. Anthropic 쪽에서는 Claude 전용
  thinking 블록 제거를 유지하면서 reasoning
  출력 모드를 다시 네이티브로 재정의하고, `minimax-fast-mode` 스트림 계열은
  공유 스트림 경로에서 fast-mode 모델 재작성을 소유합니다.
- Moonshot은 `catalog`, `resolveThinkingProfile`, `wrapStreamFn`을 사용합니다. 여전히 공유
  OpenAI transport를 사용하지만 provider 소유 thinking 페이로드 정규화가 필요하기 때문입니다.
  `moonshot-thinking` 스트림 계열은 구성과 `/think` 상태를
  네이티브 이진 thinking 페이로드에 매핑합니다.
- Kilocode는 `catalog`, `capabilities`, `wrapStreamFn`,
  `isCacheTtlEligible`를 사용합니다. provider 소유 요청 헤더,
  reasoning 페이로드 정규화, Gemini transcript 힌트, Anthropic
  cache-TTL 게이트가 필요하기 때문입니다. `kilocode-thinking` 스트림 계열은
  `kilo/auto` 및 명시적 reasoning 페이로드를 지원하지 않는 기타 프록시 모델 ID를 건너뛰면서
  공유 프록시 스트림 경로에서 Kilo thinking
  주입을 유지합니다.
- Z.AI는 `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth`, `fetchUsageSnapshot`를 사용합니다. GLM-5 대체,
  `tool_stream` 기본값, 이진 thinking UX, modern-model 매칭, 그리고
  사용량 인증 + quota 가져오기를 모두 소유하기 때문입니다. `tool-stream-default-on` 스트림 계열은
  기본 활성화 `tool_stream` 래퍼를 provider별 수작업 glue 밖에 유지합니다.
- xAI는 `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel`, `isModernModelRef`를 사용합니다.
  네이티브 xAI Responses transport 정규화, Grok fast-mode
  별칭 재작성, 기본 `tool_stream`, strict-tool / reasoning-payload
  정리, plugin 소유 도구용 대체 인증 재사용, 순방향 호환 Grok
  모델 확인, xAI tool-schema
  프로필, 지원되지 않는 스키마 키워드, 네이티브 `web_search`, HTML 엔터티
  tool-call 인수 디코딩 같은 provider 소유 compat 패치를 소유하기 때문입니다.
- Mistral, OpenCode Zen, OpenCode Go는
  transcript/tooling 특이점을 코어 밖에 유지하기 위해 `capabilities`만 사용합니다.
- `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway`, `volcengine` 같은
  카탈로그 전용 번들 providers는 `catalog`만 사용합니다.
- Qwen은 텍스트 provider를 위해 `catalog`를 사용하고, 멀티모달 표면을 위해 공유 미디어 이해 및
  비디오 생성 등록을 사용합니다.
- MiniMax와 Xiaomi는 추론이 여전히 공유
  transport를 통해 실행되더라도 `/usage`
  동작이 plugin 소유이므로 `catalog`와 함께 사용량 hooks를 사용합니다.

## 런타임 helpers

plugins는 `api.runtime`를 통해 선택된 코어 helper에 접근할 수 있습니다. TTS의 경우:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

참고:

- `textToSpeech`는 파일/voice-note 표면용 일반 코어 TTS 출력 페이로드를 반환합니다.
- 코어 `messages.tts` 구성과 provider 선택을 사용합니다.
- PCM 오디오 버퍼 + 샘플 속도를 반환합니다. plugins는 provider에 맞게 재샘플링/인코딩해야 합니다.
- `listVoices`는 provider별 선택 사항입니다. vendor 소유 음성 선택기나 설정 흐름에 사용하세요.
- 음성 목록에는 provider 인지 선택기를 위한 locale, gender, personality 태그 같은 더 풍부한 메타데이터가 포함될 수 있습니다.
- 현재 전화 기능은 OpenAI와 ElevenLabs를 지원합니다. Microsoft는 지원하지 않습니다.

plugins는 `api.registerSpeechProvider(...)`를 통해 음성 providers를 등록할 수도 있습니다.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

참고:

- TTS 정책, 대체, 응답 전달은 코어에 유지하세요.
- vendor 소유 합성 동작에는 speech providers를 사용하세요.
- 레거시 Microsoft `edge` 입력은 `microsoft` provider ID로 정규화됩니다.
- 권장되는 소유권 model은 회사 중심입니다. OpenClaw가 이러한
  capability 계약을 추가함에 따라 하나의 vendor Plugin이
  텍스트, 음성, 이미지, 향후 미디어 providers를 소유할 수 있습니다.

이미지/오디오/비디오 이해의 경우, plugins는 일반 key/value bag 대신
타입이 있는 하나의 media-understanding provider를 등록합니다.

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

참고:

- 오케스트레이션, 대체, 구성, 채널 연결은 코어에 유지하세요.
- vendor 동작은 provider Plugin에 유지하세요.
- 점진적 확장은 타입을 유지해야 합니다. 새 선택적 메서드, 새 선택적
  결과 필드, 새 선택적 capabilities.
- 비디오 생성은 이미 동일한 패턴을 따릅니다.
  - 코어가 capability 계약과 런타임 helper를 소유합니다
  - vendor plugins가 `api.registerVideoGenerationProvider(...)`를 등록합니다
  - 기능/채널 plugins가 `api.runtime.videoGeneration.*`를 소비합니다

media-understanding 런타임 helpers의 경우, plugins는 다음을 호출할 수 있습니다.

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

오디오 전사의 경우, plugins는 media-understanding 런타임
또는 이전 STT 별칭을 사용할 수 있습니다.

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // MIME을 안정적으로 추론할 수 없을 때 선택 사항:
  mime: "audio/ogg",
});
```

참고:

- `api.runtime.mediaUnderstanding.*`는
  이미지/오디오/비디오 이해를 위한 선호되는 공유 표면입니다.
- 코어 media-understanding 오디오 구성(`tools.media.audio`)과 provider 대체 순서를 사용합니다.
- 전사 출력이 생성되지 않으면 `{ text: undefined }`를 반환합니다(예: 건너뜀/지원되지 않는 입력).
- `api.runtime.stt.transcribeAudioFile(...)`는 호환성 별칭으로 계속 남아 있습니다.

plugins는 또한 `api.runtime.subagent`를 통해 백그라운드 하위 에이전트 실행을 시작할 수 있습니다.

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

참고:

- `provider`와 `model`은 영구 세션 변경이 아니라 실행별 선택적 재정의입니다.
- OpenClaw는 신뢰된 호출자에 대해서만 해당 재정의 필드를 적용합니다.
- plugin 소유 대체 실행의 경우, 운영자는 `plugins.entries.<id>.subagent.allowModelOverride: true`로 opt in해야 합니다.
- 신뢰된 plugins를 특정 정식 `provider/model` 대상으로 제한하려면 `plugins.entries.<id>.subagent.allowedModels`를 사용하고, 모든 대상을 명시적으로 허용하려면 `"*"`를 사용하세요.
- 신뢰되지 않은 plugin 하위 에이전트 실행도 여전히 동작하지만, 재정의 요청은 조용히 대체되지 않고 거부됩니다.

웹 검색의 경우, plugins는 에이전트 tool 연결에 직접 접근하는 대신
공유 런타임 helper를 사용할 수 있습니다.

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

plugins는 또한
`api.registerWebSearchProvider(...)`를 통해 웹 검색 providers를 등록할 수 있습니다.

참고:

- provider 선택, 자격 증명 확인, 공유 요청 의미 체계는 코어에 유지하세요.
- vendor별 검색 transport에는 웹 검색 providers를 사용하세요.
- `api.runtime.webSearch.*`는 에이전트 tool 래퍼에 의존하지 않고 검색 동작이 필요한 기능/채널 plugins를 위한 선호되는 공유 표면입니다.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: 구성된 이미지 생성 provider 체인을 사용해 이미지를 생성합니다.
- `listProviders(...)`: 사용 가능한 이미지 생성 providers와 해당 capabilities를 나열합니다.

## Gateway HTTP routes

plugins는 `api.registerHttpRoute(...)`를 사용해 HTTP 엔드포인트를 노출할 수 있습니다.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

route 필드:

- `path`: Gateway HTTP 서버 아래의 route 경로
- `auth`: 필수. 일반 Gateway 인증이 필요하면 `"gateway"`를 사용하고, plugin 관리 인증/Webhook 검증에는 `"plugin"`을 사용하세요.
- `match`: 선택 사항. `"exact"`(기본값) 또는 `"prefix"`.
- `replaceExisting`: 선택 사항. 동일 Plugin이 자신의 기존 route 등록을 대체할 수 있게 합니다.
- `handler`: route가 요청을 처리했으면 `true`를 반환합니다.

참고:

- `api.registerHttpHandler(...)`는 제거되었으며 plugin 로드 오류를 발생시킵니다. 대신 `api.registerHttpRoute(...)`를 사용하세요.
- plugin routes는 `auth`를 명시적으로 선언해야 합니다.
- 정확히 같은 `path + match` 충돌은 `replaceExisting: true`가 아닌 한 거부되며, 한 Plugin이 다른 Plugin의 route를 대체할 수는 없습니다.
- `auth` 수준이 다른 중첩 route는 거부됩니다. `exact`/`prefix` 폴스루 체인은 동일한 인증 수준에서만 유지하세요.
- `auth: "plugin"` routes는 운영자 런타임 범위를 자동으로 받지 **않습니다**. 권한 있는 Gateway helper 호출이 아니라 plugin 관리 Webhook/서명 검증용입니다.
- `auth: "gateway"` routes는 Gateway 요청 런타임 범위 내부에서 실행되지만, 그 범위는 의도적으로 보수적입니다.
  - 공유 시크릿 bearer 인증(`gateway.auth.mode = "token"` / `"password"`)은 호출자가 `x-openclaw-scopes`를 보내더라도 plugin-route 런타임 범위를 `operator.write`에 고정합니다
  - 신뢰된 ID 포함 HTTP 모드(예: `trusted-proxy` 또는 private ingress의 `gateway.auth.mode = "none"`)는 헤더가 명시적으로 존재할 때만 `x-openclaw-scopes`를 적용합니다
  - 해당 ID 포함 plugin-route 요청에 `x-openclaw-scopes`가 없으면 런타임 범위는 `operator.write`로 대체됩니다
- 실질적인 규칙: gateway 인증 plugin route가 암묵적인 관리자 표면이라고 가정하지 마세요. route에 관리자 전용 동작이 필요하면, ID 포함 인증 모드를 요구하고 명시적인 `x-openclaw-scopes` 헤더 계약을 문서화하세요.

## Plugin SDK import 경로

plugins를 작성할 때는 단일 `openclaw/plugin-sdk` import 대신
SDK 하위 경로를 사용하세요.

- plugin 등록 기본 요소에는 `openclaw/plugin-sdk/plugin-entry`
- 일반 공유 plugin 대상 계약에는 `openclaw/plugin-sdk/core`
- 루트 `openclaw.json` Zod 스키마
  export(`OpenClawSchema`)에는 `openclaw/plugin-sdk/config-schema`
- `openclaw/plugin-sdk/channel-setup` 같은 안정적인 채널 기본 요소,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input`, 그리고
  `openclaw/plugin-sdk/webhook-ingress`는 공유 설정/인증/응답/Webhook
  연결용입니다. `channel-inbound`는 디바운스, 멘션 매칭,
  수신 멘션 정책 helpers, envelope 형식화, 수신 envelope
  컨텍스트 helpers를 위한 공유 홈입니다.
  `channel-setup`은 좁은 범위의 선택적 설치 설정 seam입니다.
  `setup-runtime`은 `setupEntry` /
  지연 시작에 사용되는 런타임 안전 설정 표면이며, import 안전 setup 패치 어댑터를 포함합니다.
  `setup-adapter-runtime`은 env 인지 account-setup adapter seam입니다.
  `setup-tools`는 작은 CLI/archive/docs helper seam입니다(`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- `openclaw/plugin-sdk/channel-config-helpers` 같은 도메인 하위 경로,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store`, 그리고
  `openclaw/plugin-sdk/directory-runtime`는 공유 런타임/구성 helpers용입니다.
  `telegram-command-config`는 Telegram 사용자 지정
  명령 정규화/검증을 위한 좁은 공개 seam이며, 번들
  Telegram 계약 표면을 일시적으로 사용할 수 없더라도 계속 제공됩니다.
  `text-runtime`은
  assistant-visible-text 제거, 마크다운 렌더/청크 helpers, redaction
  helpers, directive-tag helpers, safe-text utilities를 포함한 공유 텍스트/마크다운/로깅 seam입니다.
- 승인 전용 채널 seam은 plugin의 하나의 `approvalCapability`
  계약을 선호해야 합니다. 그러면 코어는 승인 인증, 전달, 렌더,
  네이티브 라우팅, 지연 네이티브 핸들러 동작을 관련 없는 plugin 필드에 승인 동작을 섞는 대신
  그 하나의 capability를 통해 읽습니다.
- `openclaw/plugin-sdk/channel-runtime`은 더 이상 권장되지 않으며,
  오래된 plugins를 위한 호환성 shim으로만 남아 있습니다. 새 코드는 더 좁은
  일반 기본 요소를 import해야 하며, 저장소 코드도 shim의 새 import를 추가해서는 안 됩니다.
- 번들 extension 내부는 비공개로 유지됩니다. 외부 plugins는
  `openclaw/plugin-sdk/*` 하위 경로만 사용해야 합니다. OpenClaw 코어/테스트 코드는
  `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js`, 그리고
  `login-qr-api.js` 같은 좁은 범위 파일 등 plugin 패키지 루트 아래의 저장소 공개 진입점을 사용할 수 있습니다.
  코어나 다른 extension에서 plugin 패키지의 `src/*`를 절대 import하지 마세요.
- 저장소 진입점 분리:
  `<plugin-package-root>/api.js`는 helper/types barrel,
  `<plugin-package-root>/runtime-api.js`는 런타임 전용 barrel,
  `<plugin-package-root>/index.js`는 번들 Plugin 진입점,
  `<plugin-package-root>/setup-entry.js`는 설정 Plugin 진입점입니다.
- 현재 번들 provider 예시:
  - Anthropic은 `wrapAnthropicProviderStream`, 베타 헤더 helpers,
    `service_tier` 파싱 같은 Claude 스트림 helpers에 `api.js` / `contract-api.js`를 사용합니다.
  - OpenAI는 provider 빌더, 기본 모델 helpers,
    실시간 provider 빌더에 `api.js`를 사용합니다.
  - OpenRouter는 provider 빌더와 온보딩/구성
    helpers에 `api.js`를 사용하고, `register.runtime.js`는 여전히 저장소 로컬 사용을 위해
    일반 `plugin-sdk/provider-stream` helpers를 다시 export할 수 있습니다.
- facade 로드 공개 진입점은 활성 런타임 구성 스냅샷이 있으면 그것을 우선 사용하고,
  OpenClaw가 아직 런타임 스냅샷을 제공하지 않을 때는 디스크의 확인된 구성 파일로 대체합니다.
- 일반 공유 기본 요소는 계속 선호되는 공개 SDK 계약입니다. 소규모의
  예약된 호환성 집합으로 번들 채널 브랜드 helper seam이 여전히 존재합니다. 이들은
  새로운 서드파티 import 대상이 아니라 번들 유지보수/호환성 seam으로 취급하세요.
  새로운 교차 채널 계약은 여전히 일반 `plugin-sdk/*` 하위 경로나 plugin 로컬 `api.js` /
  `runtime-api.js` barrel에 도입되어야 합니다.

호환성 참고:

- 새 코드에서는 루트 `openclaw/plugin-sdk` barrel을 피하세요.
- 먼저 좁고 안정적인 기본 요소를 선호하세요. 더 새로운 setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool 하위 경로는 새
  번들 및 외부 plugin 작업을 위한 의도된 계약입니다.
  대상 파싱/매칭은 `openclaw/plugin-sdk/channel-targets`에 속합니다.
  메시지 action 게이트와 reaction message-id helpers는
  `openclaw/plugin-sdk/channel-actions`에 속합니다.
- 번들 extension 전용 helper barrel은 기본적으로 안정적이지 않습니다. helper가
  번들 extension에만 필요하다면, 이를
  `openclaw/plugin-sdk/<extension>`로 승격하는 대신 extension의 로컬
  `api.js` 또는 `runtime-api.js` seam 뒤에 유지하세요.
- 새 공유 helper seam은 채널 브랜드가 아니라 일반적이어야 합니다. 공유 대상
  파싱은 `openclaw/plugin-sdk/channel-targets`에 속하고, 채널별
  내부 사항은 소유 plugin의 로컬 `api.js` 또는 `runtime-api.js`
  seam 뒤에 유지됩니다.
- `image-generation`,
  `media-understanding`, `speech` 같은 capability별 하위 경로는 번들/네이티브 plugins가
  현재 이를 사용하기 때문에 존재합니다. 이것이 존재한다고 해서 내보낸 모든 helper가
  장기적으로 고정된 외부 계약이라는 뜻은 아닙니다.

## Message tool 스키마

plugins는 reactions, reads, polls 같은 비메시지 기본 요소에 대해
채널별 `describeMessageTool(...)` 스키마 기여를 소유해야 합니다.
공유 send presentation은 provider 네이티브 button, component, block, card 필드 대신
일반 `MessagePresentation` 계약을 사용해야 합니다.
계약, 대체 규칙, provider 매핑, plugin 작성자 체크리스트는 [Message Presentation](/ko/plugins/message-presentation)를 참고하세요.

전송 가능한 plugins는 message capabilities를 통해 자신이 렌더링할 수 있는 것을 선언합니다.

- 의미 기반 presentation 블록(`text`, `context`, `divider`, `buttons`, `select`)용 `presentation`
- 고정 전달 요청용 `delivery-pin`

코어는 presentation을 네이티브로 렌더링할지 텍스트로 저하할지 결정합니다.
일반 message tool에서 provider 네이티브 UI 탈출구를 노출하지 마세요.
레거시 네이티브 스키마용 더 이상 권장되지 않는 SDK helpers는 기존
서드파티 plugins를 위해 계속 export되지만, 새 plugins는 이를 사용하지 않아야 합니다.

## 채널 대상 확인

채널 plugins는 채널별 대상 의미 체계를 소유해야 합니다. 공유
outbound 호스트는 일반적으로 유지하고, provider 규칙에는 메시징 adapter 표면을 사용하세요.

- `messaging.inferTargetChatType({ to })`는 정규화된 대상이
  디렉터리 조회 전에 `direct`, `group`, `channel` 중 무엇으로 처리되어야 하는지 결정합니다.
- `messaging.targetResolver.looksLikeId(raw, normalized)`는
  입력이 디렉터리 검색 대신 ID 유사 확인으로 바로 넘어가야 하는지 코어에 알려줍니다.
- `messaging.targetResolver.resolveTarget(...)`는
  정규화 후 또는 디렉터리 미스 후 코어에 최종 provider 소유 확인이 필요할 때 plugin의 대체 수단입니다.
- `messaging.resolveOutboundSessionRoute(...)`는 대상이 확인된 후 provider별 세션
  route 구성을 소유합니다.

권장 분리:

- peer/group 검색 전에 발생해야 하는 범주 결정에는 `inferTargetChatType`을 사용하세요.
- "이것을 명시적/네이티브 대상 ID로 취급" 검사에는 `looksLikeId`를 사용하세요.
- 광범위한 디렉터리 검색이 아니라 provider별 정규화 대체에는 `resolveTarget`을 사용하세요.
- chat IDs, thread IDs, JIDs, handles, room IDs 같은 provider 네이티브 ID는
  일반 SDK 필드가 아니라 `target` 값 또는 provider별 params 내부에 유지하세요.

## 구성 기반 디렉터리

구성에서 디렉터리 항목을 파생하는 plugins는 해당 로직을
plugin 내부에 유지하고
`openclaw/plugin-sdk/directory-runtime`의 공유 helpers를 재사용해야 합니다.

다음과 같은 구성 기반 peer/group이 필요한 채널에 사용하세요.

- 허용 목록 기반 DM peers
- 구성된 채널/그룹 맵
- account 범위 정적 디렉터리 대체

`directory-runtime`의 공유 helpers는 일반 작업만 처리합니다.

- 쿼리 필터링
- 제한 적용
- 중복 제거/정규화 helpers
- `ChannelDirectoryEntry[]` 빌드

채널별 account 검사와 ID 정규화는
plugin 구현에 남아 있어야 합니다.

## Provider 카탈로그

provider plugins는
`registerProvider({ catalog: { run(...) { ... } } })`로 추론용 모델 카탈로그를 정의할 수 있습니다.

`catalog.run(...)`은 OpenClaw가
`models.providers`에 쓰는 것과 동일한 형태를 반환합니다.

- 하나의 provider 항목에는 `{ provider }`
- 여러 provider 항목에는 `{ providers }`

plugin이 provider별 모델 ID, 기본 base URL,
또는 인증으로 보호되는 모델 메타데이터를 소유할 때 `catalog`를 사용하세요.

`catalog.order`는 plugin의 카탈로그가 OpenClaw의
내장 암시적 providers에 비해 언제 병합되는지 제어합니다.

- `simple`: 일반 API 키 또는 env 기반 providers
- `profile`: 인증 프로필이 있을 때 나타나는 providers
- `paired`: 서로 관련된 여러 provider 항목을 합성하는 providers
- `late`: 다른 암시적 providers 이후 마지막 단계

나중의 provider가 키 충돌 시 우선하므로, plugins는 동일한 provider ID를 가진
내장 provider 항목을 의도적으로 재정의할 수 있습니다.

호환성:

- `discovery`는 레거시 별칭으로 계속 동작합니다
- `catalog`와 `discovery`가 모두 등록되면 OpenClaw는 `catalog`를 사용합니다

## 읽기 전용 채널 검사

Plugin이 채널을 등록한다면
`resolveAccount(...)`와 함께 `plugin.config.inspectAccount(cfg, accountId)` 구현을 선호하세요.

이유:

- `resolveAccount(...)`는 런타임 경로입니다. 자격 증명이
  완전히 구체화되었다고 가정할 수 있으며, 필요한 시크릿이 없으면 빠르게 실패해도 됩니다.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, doctor/config
  복구 흐름 같은 읽기 전용 명령 경로는 구성을 설명하기 위해
  런타임 자격 증명을 구체화할 필요가 없어야 합니다.

권장 `inspectAccount(...)` 동작:

- 설명용 account 상태만 반환합니다.
- `enabled`와 `configured`를 보존합니다.
- 관련 있는 경우 자격 증명 source/status 필드를 포함합니다. 예:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 읽기 전용 가용성을 보고하기 위해 원시 토큰 값을 반환할 필요는 없습니다.
  상태형 명령에는 `tokenStatus: "available"`(및 일치하는 source 필드)만 반환해도 충분합니다.
- SecretRef를 통해 자격 증명이 구성되었지만
  현재 명령 경로에서 사용할 수 없으면 `configured_unavailable`을 사용하세요.

이렇게 하면 읽기 전용 명령이 account를 구성되지 않은 것으로 잘못 보고하거나 크래시하는 대신
"이 명령 경로에서는 구성되었지만 사용할 수 없음"을 보고할 수 있습니다.

## Package packs

plugin 디렉터리에는 `openclaw.extensions`가 포함된 `package.json`이 있을 수 있습니다.

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

각 항목은 하나의 Plugin이 됩니다. pack이 여러 extensions를 나열하면 Plugin ID는
`name/<fileBase>`가 됩니다.

Plugin이 npm 의존성을 import한다면, 해당 디렉터리에 이를 설치하여
`node_modules`를 사용할 수 있게 하세요(`npm install` / `pnpm install`).

보안 가드레일: 모든 `openclaw.extensions` 항목은 symlink 확인 후에도 plugin
디렉터리 내부에 머물러야 합니다. 패키지 디렉터리 밖으로 벗어나는 항목은
거부됩니다.

보안 참고: `openclaw plugins install`은
`npm install --omit=dev --ignore-scripts`로 plugin 의존성을 설치합니다(라이프사이클 스크립트 없음, 런타임 dev 의존성 없음). plugin 의존성
트리는 "순수 JS/TS"로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.

선택 사항: `openclaw.setupEntry`는 가벼운 setup 전용 모듈을 가리킬 수 있습니다.
OpenClaw가 비활성화된 채널 Plugin의 setup 표면이 필요하거나,
채널 Plugin이 활성화되어 있지만 아직 구성되지 않은 경우,
전체 plugin 진입점 대신 `setupEntry`를 로드합니다. 이렇게 하면 기본 plugin 진입점이
tools, hooks, 기타 런타임 전용
코드도 연결하는 경우 시작과 설정이 더 가벼워집니다.

선택 사항: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`은
채널이 이미 구성된 경우에도 gateway의
pre-listen 시작 단계 동안 채널 Plugin이 동일한 `setupEntry` 경로를 사용하도록 opt in할 수 있습니다.

이 옵션은 `setupEntry`가 gateway가 수신을 시작하기 전에 반드시 존재해야 하는
시작 표면을 완전히 다룰 때만 사용하세요. 실제로는 setup entry가
시작 시 의존하는 모든 채널 소유 capability를 등록해야 함을 의미합니다. 예:

- 채널 등록 자체
- gateway가 수신을 시작하기 전에 사용할 수 있어야 하는 모든 HTTP routes
- 같은 기간에 존재해야 하는 모든 gateway methods, tools, services

전체 entry가 여전히 필요한 시작 capability를 소유하고 있다면 이 플래그를 활성화하지 마세요.
기본 동작을 유지하고 OpenClaw가 시작 중 전체 entry를 로드하게 하세요.

번들 채널은 전체 채널 런타임이 로드되기 전에 코어가 참고할 수 있는
setup 전용 계약 표면 helpers도 게시할 수 있습니다. 현재 setup
승격 표면은 다음과 같습니다.

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

코어는 전체 plugin entry를 로드하지 않고도 레거시 단일 account 채널
구성을 `channels.<id>.accounts.*`로 승격해야 할 때 이 표면을 사용합니다.
Matrix가 현재 번들 예시입니다. 이미 명명된 accounts가 존재할 때
인증/bootstrap 키만 명명된 승격 account로 이동하며, 항상
`accounts.default`를 생성하는 대신 구성된 비정규 기본 account 키를 보존할 수 있습니다.

이 setup patch adapter는 번들 계약 표면 검색을 lazy 상태로 유지합니다.
import 시점은 가볍게 유지되고, 승격 표면은 모듈 import 시 번들 채널 시작에 다시 진입하는 대신
처음 사용할 때만 로드됩니다.

그러한 시작 표면에 gateway RPC methods가 포함되는 경우,
plugin별 접두사에 유지하세요. 코어 관리자 네임스페이스(`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`)는 예약되어 있으며, Plugin이 더 좁은 범위를 요청하더라도
항상 `operator.admin`으로 확인됩니다.

예시:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### 채널 카탈로그 메타데이터

채널 plugins는 `openclaw.channel`을 통해 setup/discovery 메타데이터를 광고하고,
`openclaw.install`을 통해 설치 힌트를 광고할 수 있습니다. 이렇게 하면 코어 카탈로그를 데이터 없이 유지할 수 있습니다.

예시:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

최소 예시 외에 유용한 `openclaw.channel` 필드:

- `detailLabel`: 더 풍부한 카탈로그/상태 표면을 위한 보조 라벨
- `docsLabel`: 문서 링크의 링크 텍스트 재정의
- `preferOver`: 이 카탈로그 항목이 우선해야 하는 더 낮은 우선순위의 plugin/channel ID
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: 선택 표면 복사 제어
- `markdownCapable`: 발신 형식 결정용으로 채널을 마크다운 가능으로 표시
- `exposure.configured`: `false`로 설정하면 구성된 채널 목록 표면에서 채널 숨김
- `exposure.setup`: `false`로 설정하면 대화형 설정/구성 선택기에서 채널 숨김
- `exposure.docs`: 문서 탐색 표면에서 채널을 내부/비공개로 표시
- `showConfigured` / `showInSetup`: 호환성을 위해 기존 별칭도 계속 허용되지만 `exposure`를 선호
- `quickstartAllowFrom`: 채널을 표준 빠른 시작 `allowFrom` 흐름에 opt in
- `forceAccountBinding`: account가 하나만 있어도 명시적 account 바인딩 요구
- `preferSessionLookupForAnnounceTarget`: announce 대상 확인 시 세션 조회를 선호

OpenClaw는 **외부 채널 카탈로그**(예: MPM
registry export)도 병합할 수 있습니다. 다음 위치 중 하나에 JSON 파일을 두세요.

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

또는 하나 이상의 JSON 파일을 가리키도록 `OPENCLAW_PLUGIN_CATALOG_PATHS`(또는 `OPENCLAW_MPM_CATALOG_PATHS`)를 설정하세요(쉼표/세미콜론/`PATH` 구분). 각 파일은
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`를 포함해야 합니다. 파서는 `"entries"` 키의 기존 별칭으로 `"packages"` 또는 `"plugins"`도 허용합니다.

## 컨텍스트 엔진 plugins

컨텍스트 엔진 plugins는 수집, 조립,
Compaction을 위한 세션 컨텍스트 오케스트레이션을 소유합니다.
`api.registerContextEngine(id, factory)`로 plugin에서 등록한 다음,
`plugins.slots.contextEngine`으로 활성 엔진을 선택하세요.

기본 컨텍스트
파이프라인을 단순히 메모리 검색이나 hooks 추가가 아니라 교체하거나 확장해야 하는 경우 이를 사용하세요.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

엔진이 Compaction 알고리즘을 **소유하지 않는다면** `compact()`
를 계속 구현하고 이를 명시적으로 위임하세요.

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## 새 capability 추가

plugin에 현재 API에 맞지 않는 동작이 필요할 때는 private reach-in으로
plugin 시스템을 우회하지 마세요. 누락된 capability를 추가하세요.

권장 순서:

1. 코어 계약 정의
   코어가 소유해야 하는 공유 동작(정책, 대체, 구성 병합,
   lifecycle, 채널 대상 의미 체계, 런타임 helper 형태)을 결정합니다.
2. 타입이 있는 plugin 등록/런타임 표면 추가
   가장 작고 유용한
   타입 capability 표면으로 `OpenClawPluginApi` 및/또는 `api.runtime`을 확장합니다.
3. 코어 + 채널/기능 소비자 연결
   채널과 기능 plugins는 vendor 구현을 직접 import하지 말고,
   코어를 통해 새 capability를 소비해야 합니다.
4. vendor 구현 등록
   그런 다음 vendor plugins가 capability에 대해 자체 백엔드를 등록합니다.
5. 계약 커버리지 추가
   시간이 지나도 소유권과 등록 형태가 명시적으로 유지되도록 테스트를 추가합니다.

이것이 OpenClaw가 한 provider의 세계관에 하드코딩되지 않으면서도
명확한 입장을 유지하는 방식입니다. 구체적인 파일 체크리스트와 예시는
[Capability Cookbook](/ko/plugins/architecture)를 참고하세요.

### Capability 체크리스트

새 capability를 추가할 때 구현은 일반적으로 다음 표면을 함께 다뤄야 합니다.

- `src/<capability>/types.ts`의 코어 계약 타입
- `src/<capability>/runtime.ts`의 코어 runner/런타임 helper
- `src/plugins/types.ts`의 plugin API 등록 표면
- `src/plugins/registry.ts`의 plugin registry 연결
- 기능/채널
  plugins가 이를 소비해야 할 때 `src/plugins/runtime/*`의 plugin 런타임 노출
- `src/test-utils/plugin-registration.ts`의 캡처/테스트 helpers
- `src/plugins/contracts/registry.ts`의 소유권/계약 단언
- `docs/`의 운영자/plugin 문서

이 표면 중 하나가 빠져 있다면, 대개 capability가
아직 완전히 통합되지 않았다는 신호입니다.

### Capability 템플릿

최소 패턴:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

계약 테스트 패턴:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

이렇게 하면 규칙이 단순하게 유지됩니다.

- 코어는 capability 계약 + 오케스트레이션을 소유합니다
- vendor plugins는 vendor 구현을 소유합니다
- 기능/채널 plugins는 런타임 helpers를 소비합니다
- 계약 테스트는 소유권을 명시적으로 유지합니다
