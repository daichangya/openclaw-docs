---
read_when:
    - 기본 OpenClaw Plugin을 빌드하거나 디버깅하는 중입니다
    - Plugin 기능 모델 또는 소유권 경계를 이해하는 중입니다
    - Plugin 로드 파이프라인 또는 레지스트리 작업 중입니다
    - provider 런타임 훅 또는 채널 plugin을 구현하는 중입니다
sidebarTitle: Internals
summary: 'Plugin 내부: 기능 모델, 소유권, 계약, 로드 파이프라인 및 런타임 헬퍼'
title: Plugin 내부
x-i18n:
    generated_at: "2026-04-21T06:05:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 38b763841ae27137c2f2d080a3cb17ca11ee20e60dd2a95b4d6bed7dcb75e2ae
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin 내부

<Info>
  이것은 **심층 아키텍처 참조**입니다. 실용적인 가이드는 다음을 참조하세요:
  - [plugin 설치 및 사용](/ko/tools/plugin) — 사용자 가이드
  - [시작하기](/ko/plugins/building-plugins) — 첫 plugin 튜토리얼
  - [채널 Plugins](/ko/plugins/sdk-channel-plugins) — 메시징 채널 빌드
  - [Provider Plugins](/ko/plugins/sdk-provider-plugins) — 모델 provider 빌드
  - [SDK 개요](/ko/plugins/sdk-overview) — import map 및 등록 API
</Info>

이 페이지는 OpenClaw plugin 시스템의 내부 아키텍처를 다룹니다.

## 공개 기능 모델

기능은 OpenClaw 내부의 공개 **기본 plugin** 모델입니다. 모든
기본 OpenClaw plugin은 하나 이상의 기능 유형에 대해 등록됩니다:

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| 텍스트 추론            | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI 추론 백엔드        | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| 음성                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| 실시간 전사            | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| 실시간 음성            | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| 미디어 이해            | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| 이미지 생성            | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 음악 생성              | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| 비디오 생성            | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| 웹 가져오기            | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| 웹 검색                | `api.registerWebSearchProvider(...)`             | `google`                             |
| 채널 / 메시징          | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

기능을 전혀 등록하지 않지만 hook, tool 또는
서비스를 제공하는 plugin은 **레거시 hook-only** plugin입니다. 이 패턴도 여전히 완전히 지원됩니다.

### 외부 호환성 입장

기능 모델은 이미 core에 적용되어 있으며 오늘날 번들/기본 plugins에서
사용되고 있지만, 외부 plugin 호환성은 여전히 "export되었으니
고정되었다"보다 더 엄격한 기준이 필요합니다.

현재 가이드:

- **기존 외부 plugins:** hook 기반 통합이 계속 동작하도록 유지하고,
  이를 호환성 기준선으로 취급
- **새 번들/기본 plugins:** vendor별 직접 접근이나 새로운 hook-only 설계보다
  명시적 기능 등록을 우선
- **기능 등록을 채택하는 외부 plugins:** 허용되지만, 문서에서 계약을
  안정적이라고 명시하지 않는 한 기능별 helper 표면은 계속 진화하는 것으로 간주

실용적인 규칙:

- 기능 등록 API는 의도된 방향입니다
- 레거시 hooks는 전환기 동안 외부 plugins에 대해 가장 안전한
  비파괴 경로로 남아 있습니다
- export된 helper 하위 경로가 모두 같은 것은 아닙니다. 우연히 노출된
  helper export가 아니라 문서화된 좁은 계약을 우선하세요

### Plugin 형태

OpenClaw는 로드된 각 plugin을 정적 메타데이터가 아니라 실제
등록 동작을 기준으로 형태로 분류합니다:

- **plain-capability** -- 정확히 하나의 기능 유형만 등록함(예:
  `mistral` 같은 provider 전용 plugin)
- **hybrid-capability** -- 여러 기능 유형을 등록함(예:
  `openai`는 텍스트 추론, 음성, 미디어 이해, 이미지
  생성을 소유함)
- **hook-only** -- hooks만 등록하고(typed 또는 custom), 기능,
  tools, commands, services는 등록하지 않음
- **non-capability** -- tools, commands, services 또는 routes를 등록하지만 기능은 등록하지 않음

plugin의 형태와 기능 분류를 보려면 `openclaw plugins inspect <id>`를
사용하세요. 자세한 내용은 [CLI 참조](/cli/plugins#inspect)를 참조하세요.

### 레거시 hooks

`before_agent_start` hook은 hook-only plugins를 위한 호환성 경로로 계속 지원됩니다.
실제 레거시 plugins는 여전히 이것에 의존합니다.

방향:

- 계속 동작하게 유지
- 레거시로 문서화
- 모델/provider 재정의 작업에는 `before_model_resolve`를 우선
- 프롬프트 변경 작업에는 `before_prompt_build`를 우선
- 실제 사용량이 줄고 fixture 커버리지가 마이그레이션 안전성을 증명한 후에만 제거

### 호환성 신호

`openclaw doctor` 또는 `openclaw plugins inspect <id>`를 실행하면
다음 레이블 중 하나가 보일 수 있습니다:

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | config가 정상적으로 파싱되고 plugins가 확인됨                |
| **compatibility advisory** | plugin이 지원되지만 오래된 패턴을 사용함(예: `hook-only`)    |
| **legacy warning**         | plugin이 더 이상 권장되지 않는 `before_agent_start`를 사용함 |
| **hard error**             | config가 유효하지 않거나 plugin 로드 실패                    |

`hook-only`와 `before_agent_start`는 오늘날 plugin을 깨뜨리지 않습니다 --
`hook-only`는 권고 수준이고, `before_agent_start`는 경고만 발생시킵니다. 이러한
신호는 `openclaw status --all` 및 `openclaw plugins doctor`에도 표시됩니다.

## 아키텍처 개요

OpenClaw의 plugin 시스템은 네 개의 계층으로 이루어집니다:

1. **Manifest + discovery**
   OpenClaw는 구성된 경로, workspace 루트,
   전역 extension 루트, 번들 extensions에서 후보 plugins를 찾습니다. Discovery는
   기본 `openclaw.plugin.json` manifest와 지원되는 bundle manifest를 먼저 읽습니다.
2. **활성화 + 검증**
   Core는 발견된 plugin이 활성화, 비활성화, 차단 또는
   memory 같은 독점 슬롯에 선택되었는지 결정합니다.
3. **런타임 로드**
   기본 OpenClaw plugins는 jiti를 통해 프로세스 내에서 로드되고
   기능을 중앙 레지스트리에 등록합니다. 호환 bundle은
   런타임 코드를 import하지 않고 레지스트리 레코드로 정규화됩니다.
4. **표면 소비**
   OpenClaw의 나머지 부분은 레지스트리를 읽어 tools, channels, provider
   setup, hooks, HTTP routes, CLI commands, services를 노출합니다.

특히 plugin CLI의 경우, 루트 명령 discovery는 두 단계로 나뉩니다:

- 파싱 시점 메타데이터는 `registerCli(..., { descriptors: [...] })`에서 가져옵니다
- 실제 plugin CLI 모듈은 지연 로드 상태를 유지하다가 첫 호출 시 등록될 수 있습니다

이렇게 하면 plugin 소유 CLI 코드를 plugin 내부에 유지하면서도 OpenClaw가
파싱 전에 루트 명령 이름을 예약할 수 있습니다.

중요한 설계 경계:

- discovery + config 검증은 plugin 코드를 실행하지 않고
  **manifest/schema 메타데이터**로 동작해야 합니다
- 기본 런타임 동작은 plugin 모듈의 `register(api)` 경로에서 옵니다

이 분리를 통해 OpenClaw는 전체 런타임이 활성화되기 전에 config를 검증하고,
누락되었거나 비활성화된 plugins를 설명하며, UI/schema 힌트를 빌드할 수 있습니다.

### 채널 plugins와 공유 메시지 도구

채널 plugins는 일반적인 채팅 작업을 위해 별도의 send/edit/react tool을
등록할 필요가 없습니다. OpenClaw는 core에 하나의 공유 `message` tool을 유지하고,
채널 plugins는 그 뒤의 채널별 discovery와 실행을 소유합니다.

현재 경계는 다음과 같습니다:

- core는 공유 `message` tool 호스트, 프롬프트 연결, 세션/스레드
  bookkeeping, 실행 디스패치를 소유합니다
- 채널 plugins는 범위 지정된 액션 discovery, 기능 discovery 및
  채널별 schema fragment를 소유합니다
- 채널 plugins는 conversation id가 thread id를 어떻게 인코딩하거나
  부모 conversation에서 어떻게 상속하는지 같은 provider별 세션 conversation 문법을 소유합니다
- 채널 plugins는 액션 어댑터를 통해 최종 액션을 실행합니다

채널 plugins의 경우 SDK 표면은
`ChannelMessageActionAdapter.describeMessageTool(...)`입니다. 이 통합 discovery
호출을 통해 plugin은 보이는 액션, 기능, schema 기여를 함께 반환할 수 있어
이 조각들이 서로 어긋나지 않습니다.

채널별 message-tool 파라미터가 로컬 경로나 원격 미디어 URL 같은
미디어 소스를 포함하는 경우, plugin은
`describeMessageTool(...)`에서 `mediaSourceParams`도 반환해야 합니다. Core는
이 명시적 목록을 사용해 plugin 소유 파라미터 이름을 하드코딩하지 않고도
sandbox 경로 정규화와 아웃바운드 미디어 액세스 힌트를 적용합니다.
여기서는 채널 전체의 평평한 목록 하나보다 액션 범위 맵을
우선하세요. 그래야 profile 전용 미디어 파라미터가 `send` 같은 관련 없는 액션에서
정규화되지 않습니다.

Core는 런타임 범위를 이 discovery 단계에 전달합니다. 중요한 필드는 다음과 같습니다:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 신뢰된 인바운드 `requesterSenderId`

이것은 컨텍스트 민감형 plugins에 중요합니다. 채널은 활성 계정,
현재 room/thread/message 또는 신뢰된 요청자 identity를 기준으로 메시지 액션을 숨기거나 노출할 수 있으며,
core `message` tool에 채널별 분기를 하드코딩할 필요가 없습니다.

이 때문에 embedded-runner 라우팅 변경은 여전히 plugin 작업입니다: runner는
현재 채팅/세션 identity를 plugin discovery 경계로 전달해 공유 `message`
tool이 현재 턴에 맞는 채널 소유 표면을 노출하도록 해야 합니다.

채널 소유 실행 helper의 경우, 번들 plugins는 실행
런타임을 자신의 extension 모듈 내부에 유지해야 합니다. Core는 더 이상
`src/agents/tools` 아래의 Discord,
Slack, Telegram 또는 WhatsApp 메시지 액션 런타임을 소유하지 않습니다.
별도의 `plugin-sdk/*-action-runtime` 하위 경로는 게시하지 않으며, 번들
plugins는 자신의 extension 소유 모듈에서 직접 로컬 런타임 코드를 import해야 합니다.

같은 경계는 일반적인 provider 명명 SDK seam에도 적용됩니다: core는
Slack, Discord, Signal,
WhatsApp 또는 유사 extensions를 위한 채널별 편의 barrel을 import해서는 안 됩니다. Core에 동작이 필요하면,
번들 plugin 자체의 `api.ts` / `runtime-api.ts` barrel을 소비하거나
공유 SDK의 좁고 일반적인 기능으로 필요 사항을 승격하세요.

특히 투표의 경우 두 가지 실행 경로가 있습니다:

- `outbound.sendPoll`은 공통
  투표 모델에 맞는 채널을 위한 공유 기준선입니다
- `actions.handleAction("poll")`은 채널별
  투표 의미론 또는 추가 투표 파라미터를 위한 선호 경로입니다

Core는 이제 plugin 투표 디스패치가 액션을 거절한 뒤에야 공유 투표 파싱을 지연하므로,
plugin 소유 투표 핸들러는 일반 투표 파서에 먼저 막히지 않고 채널별 투표
필드를 받을 수 있습니다.

전체 시작 시퀀스는 [로드 파이프라인](#load-pipeline)을 참조하세요.

## 기능 소유권 모델

OpenClaw는 기본 plugin을 **회사** 또는
**기능**에 대한 소유권 경계로 취급하며, 관련 없는 통합의 모음으로 보지 않습니다.

이는 다음을 의미합니다:

- 회사 plugin은 일반적으로 해당 회사의 모든 OpenClaw 대상
  표면을 소유해야 합니다
- 기능 plugin은 일반적으로 자신이 도입하는 전체 기능 표면을
  소유해야 합니다
- 채널은 provider 동작을 임시로 재구현하는 대신 공유 core 기능을 소비해야 합니다

예시:

- 번들된 `openai` plugin은 OpenAI 모델 provider 동작과 OpenAI
  음성 + 실시간 음성 + 미디어 이해 + 이미지 생성 동작을 소유합니다
- 번들된 `elevenlabs` plugin은 ElevenLabs 음성 동작을 소유합니다
- 번들된 `microsoft` plugin은 Microsoft 음성 동작을 소유합니다
- 번들된 `google` plugin은 Google 모델 provider 동작과 Google
  미디어 이해 + 이미지 생성 + 웹 검색 동작을 소유합니다
- 번들된 `firecrawl` plugin은 Firecrawl 웹 가져오기 동작을 소유합니다
- 번들된 `minimax`, `mistral`, `moonshot`, `zai` plugins는 각자의
  미디어 이해 백엔드를 소유합니다
- 번들된 `qwen` plugin은 Qwen 텍스트 provider 동작과
  미디어 이해 및 비디오 생성 동작을 소유합니다
- `voice-call` plugin은 기능 plugin입니다. 통화 전송, tools,
  CLI, routes, Twilio 미디어 스트림 브리징을 소유하지만, vendor plugins를 직접 import하는 대신 공유 음성과
  실시간 전사 및 실시간 음성 기능을 소비합니다

의도된 최종 상태는 다음과 같습니다:

- OpenAI는 텍스트 모델, 음성, 이미지,
  미래의 비디오에 걸쳐 있더라도 하나의 plugin에 존재합니다
- 다른 vendor도 자기 표면 영역에 대해 같은 방식을 사용할 수 있습니다
- 채널은 어떤 vendor plugin이 provider를 소유하는지 신경 쓰지 않으며, core가 노출하는
  공유 기능 계약을 소비합니다

이것이 핵심 구분입니다:

- **plugin** = 소유권 경계
- **capability** = 여러 plugins가 구현하거나 소비할 수 있는 core 계약

따라서 OpenClaw가 비디오 같은 새로운 도메인을 추가할 때 첫 질문은
"어떤 provider가 비디오 처리를 하드코딩해야 하는가?"가 아닙니다. 첫 질문은 "core 비디오 기능 계약이
무엇인가?"입니다. 그 계약이 존재하면 vendor plugins는 여기에 등록할 수 있고
채널/기능 plugins는 이를 소비할 수 있습니다.

아직 기능이 존재하지 않는다면, 일반적으로 올바른 순서는 다음과 같습니다:

1. core에 누락된 기능을 정의
2. 이를 plugin API/런타임을 통해 타입이 있는 방식으로 노출
3. 채널/기능을 그 기능에 맞춰 연결
4. vendor plugins가 구현을 등록하도록 함

이렇게 하면 소유권을 명시적으로 유지하면서, 단일 vendor 또는 일회성 plugin 전용 코드 경로에
의존하는 core 동작을 피할 수 있습니다.

### 기능 계층

코드를 어디에 둘지 결정할 때 다음 사고 모델을 사용하세요:

- **core 기능 계층**: 공유 오케스트레이션, 정책, 대체 경로, config
  병합 규칙, 전달 의미론, 타입이 있는 계약
- **vendor plugin 계층**: vendor별 API, 인증, 모델 카탈로그, 음성
  합성, 이미지 생성, 미래의 비디오 백엔드, 사용량 엔드포인트
- **채널/기능 plugin 계층**: Slack/Discord/voice-call 등 통합으로,
  core 기능을 소비하고 이를 표면에 제공합니다

예를 들어 TTS는 다음 형태를 따릅니다:

- core는 응답 시점 TTS 정책, 대체 순서, 기본 설정, 채널 전달을 소유합니다
- `openai`, `elevenlabs`, `microsoft`는 합성 구현을 소유합니다
- `voice-call`은 전화 TTS 런타임 helper를 소비합니다

같은 패턴은 미래 기능에도 우선 적용되어야 합니다.

### 다중 기능 회사 plugin 예시

회사 plugin은 외부에서 보기에 일관된 하나의 덩어리처럼 느껴져야 합니다. OpenClaw에
모델, 음성, 실시간 전사, 실시간 음성, 미디어
이해, 이미지 생성, 비디오 생성, 웹 가져오기, 웹 검색에 대한 공유
계약이 있다면, vendor는 모든 표면을 한 곳에서 소유할 수 있습니다:

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

중요한 것은 정확한 helper 이름이 아닙니다. 중요한 것은 형태입니다:

- 하나의 plugin이 vendor 표면을 소유합니다
- core는 여전히 기능 계약을 소유합니다
- 채널과 기능 plugins는 vendor 코드가 아니라 `api.runtime.*` helper를 소비합니다
- 계약 테스트는 plugin이 자신이 소유한다고 주장하는 기능을 실제로 등록했는지
  검증할 수 있습니다

### 기능 예시: 비디오 이해

OpenClaw는 이미 이미지/오디오/비디오 이해를 하나의 공유
기능으로 취급합니다. 여기에도 같은 소유권 모델이 적용됩니다:

1. core가 media-understanding 계약을 정의
2. vendor plugins가 해당되는 경우 `describeImage`, `transcribeAudio`,
   `describeVideo`를 등록
3. 채널과 기능 plugins는 vendor 코드에 직접
   연결하는 대신 공유 core 동작을 소비

이렇게 하면 특정 provider의 비디오 가정을 core에 굳혀 넣는 일을 피할 수 있습니다. Plugin이
vendor 표면을 소유하고, core는 기능 계약과 대체 동작을 소유합니다.

비디오 생성도 이미 같은 순서를 사용합니다. core가 타입이 있는
기능 계약과 런타임 helper를 소유하고, vendor plugins는
`api.registerVideoGenerationProvider(...)` 구현을 여기에 등록합니다.

구체적인 출시 체크리스트가 필요하신가요?  
[기능 요리책](/ko/plugins/architecture)을 참조하세요.

## 계약 및 강제

plugin API 표면은 의도적으로 타입이 있으며
`OpenClawPluginApi`에 중앙화되어 있습니다. 이 계약은 지원되는 등록 지점과
plugin이 의존할 수 있는 런타임 helper를 정의합니다.

이것이 중요한 이유:

- plugin 작성자는 하나의 안정적인 내부 표준을 얻습니다
- core는 두 plugins가 같은
  provider id를 등록하는 중복 소유권을 거부할 수 있습니다
- 시작 시 잘못된 등록에 대해 실행 가능한 진단을 표시할 수 있습니다
- 계약 테스트는 번들 plugin의 소유권을 강제하고 조용한 드리프트를 막을 수 있습니다

강제는 두 계층으로 이루어집니다:

1. **런타임 등록 강제**
   plugin 레지스트리는 plugin이 로드될 때 등록을 검증합니다. 예:
   중복 provider id, 중복 음성 provider id, 잘못된
   등록은 정의되지 않은 동작이 아니라 plugin 진단을 생성합니다.
2. **계약 테스트**
   번들 plugins는 테스트 실행 중 계약 레지스트리에 캡처되어
   OpenClaw가 소유권을 명시적으로 검증할 수 있습니다. 오늘날 이는 모델
   providers, 음성 providers, 웹 검색 providers, 번들 등록
   소유권에 사용됩니다.

실질적인 효과는, OpenClaw가 어떤 plugin이 어떤
표면을 소유하는지 미리 안다는 것입니다. 이로 인해 core와 채널은 소유권이
암묵적이 아니라 선언적이고, 타입이 있고, 테스트 가능하므로 자연스럽게 조합될 수 있습니다.

### 계약에 포함되어야 하는 것

좋은 plugin 계약은 다음과 같습니다:

- 타입이 있음
- 작음
- 기능별로 구체적임
- core가 소유함
- 여러 plugins가 재사용 가능함
- 채널/기능이 vendor 지식 없이 소비 가능함

나쁜 plugin 계약은 다음과 같습니다:

- core에 숨겨진 vendor별 정책
- 레지스트리를 우회하는 일회성 plugin 탈출구
- vendor 구현을 직접 들여다보는 채널 코드
- `OpenClawPluginApi` 또는
  `api.runtime`의 일부가 아닌 임시 런타임 객체

의심되면 추상화 수준을 높이세요. 먼저 기능을 정의한 다음,
plugins가 여기에 연결되도록 하세요.

## 실행 모델

기본 OpenClaw plugins는 Gateway와 **같은 프로세스 내에서**
실행됩니다. 샌드박스되지 않습니다. 로드된 기본 plugin은 core 코드와 같은
프로세스 수준 신뢰 경계를 가집니다.

의미:

- 기본 plugin은 tools, 네트워크 핸들러, hooks, services를 등록할 수 있습니다
- 기본 plugin 버그는 Gateway를 크래시시키거나 불안정하게 만들 수 있습니다
- 악성 기본 plugin은 OpenClaw 프로세스 내부의 임의 코드 실행과 동일합니다

호환 bundle은 OpenClaw가 현재 이를
메타데이터/콘텐츠 팩으로 취급하기 때문에 기본적으로 더 안전합니다. 현재 릴리스에서는 이는
대체로 번들 Skills를 의미합니다.

번들되지 않은 plugins에는 allowlist와 명시적 install/load 경로를 사용하세요.  
workspace plugins는 프로덕션 기본값이 아니라 개발 시점 코드로 취급하세요.

번들 workspace 패키지 이름의 경우, plugin id는 기본적으로 npm
이름 `@openclaw/<id>`에 고정하세요. 또는 패키지가 의도적으로 더 좁은 plugin 역할을
노출할 때는 승인된 타입 접미사인 `-provider`, `-plugin`, `-speech`, `-sandbox`, `-media-understanding`를 사용하세요.

중요한 신뢰 참고 사항:

- `plugins.allow`는 **plugin id**를 신뢰하며, 소스 출처를 신뢰하지 않습니다.
- 번들 plugin과 같은 id를 가진 workspace plugin은 해당 workspace plugin이 활성화/allowlist되면
  의도적으로 번들 사본을 가립니다.
- 이는 로컬 개발, 패치 테스트, 핫픽스에 대해 정상적이고 유용한 동작입니다.

## export 경계

OpenClaw는 구현 편의성이 아니라 기능을 export합니다.

기능 등록은 공개 상태로 유지하세요. 계약이 아닌 helper export는 정리하세요:

- 번들 plugin 전용 helper 하위 경로
- 공개 API로 의도되지 않은 런타임 배관 하위 경로
- vendor별 편의 helper
- 구현 세부사항인 setup/onboarding helper

일부 번들 plugin helper 하위 경로는 호환성과 번들 plugin 유지보수를 위해
생성된 SDK export map에 여전히 남아 있습니다. 현재 예로는
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, 그리고 여러 `plugin-sdk/matrix*` seam이 있습니다. 이를
새 서드파티 plugins를 위한 권장 SDK 패턴이 아니라, 예약된 구현 세부 export로 취급하세요.

## 로드 파이프라인

시작 시 OpenClaw는 대략 다음을 수행합니다:

1. 후보 plugin 루트를 발견
2. 기본 또는 호환 bundle manifest와 패키지 메타데이터를 읽음
3. 안전하지 않은 후보를 거부
4. plugin config를 정규화(`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. 각 후보의 활성화 여부를 결정
6. 활성화된 기본 모듈을 jiti로 로드
7. 기본 `register(api)`(또는 레거시 별칭 `activate(api)`) hook을 호출하고 등록을 plugin 레지스트리에 수집
8. 레지스트리를 명령/런타임 표면에 노출

<Note>
`activate`는 `register`의 레거시 별칭입니다 — 로더는 존재하는 항목(`def.register ?? def.activate`)을 확인해 같은 지점에서 호출합니다. 모든 번들 plugins는 `register`를 사용합니다. 새 plugins에는 `register`를 우선하세요.
</Note>

안전 게이트는 런타임 실행 **이전**에 발생합니다. 후보는
entry가 plugin 루트를 벗어나거나, 경로가 world-writable이거나,
번들되지 않은 plugins에 대해 경로 소유권이 의심스러워 보일 때 차단됩니다.

### Manifest 우선 동작

manifest는 control-plane의 source of truth입니다. OpenClaw는 이를 사용해:

- plugin을 식별
- 선언된 channels/Skills/config schema 또는 bundle 기능을 발견
- `plugins.entries.<id>.config`를 검증
- Control UI 레이블/플레이스홀더를 보강
- 설치/카탈로그 메타데이터를 표시
- plugin 런타임을 로드하지 않고도 가벼운 활성화 및 setup descriptor를 유지

기본 plugins의 경우 런타임 모듈은 data-plane 부분입니다. 이것은
hooks, tools, commands, provider 흐름 같은 실제 동작을 등록합니다.

선택적 manifest `activation` 및 `setup` 블록은 control plane에 남습니다.
이들은 활성화 계획 및 setup discovery를 위한 메타데이터 전용 descriptor이며,
런타임 등록, `register(...)` 또는 `setupEntry`를 대체하지 않습니다.
첫 번째 라이브 활성화 소비자는 이제 manifest 명령, 채널, provider 힌트를 사용해
더 넓은 레지스트리 구체화 전에 plugin 로드를 좁힙니다:

- CLI 로드는 요청된 기본 명령을 소유한 plugins로 좁혀집니다
- 채널 setup/plugin 확인은 요청된
  channel id를 소유한 plugins로 좁혀집니다
- 명시적 provider setup/런타임 확인은 요청된 provider id를 소유한 plugins로 좁혀집니다

setup discovery는 이제 `setup.providers` 및 `setup.cliBackends` 같은 descriptor 소유 id를 우선 사용해 후보 plugins를 좁힌 뒤, 여전히 setup 시점 런타임 hook이 필요한 plugins에 대해서만 `setup-api`로 대체합니다. 둘 이상의 발견된 plugin이 같은 정규화된 setup provider 또는 CLI backend id를 주장하면, setup lookup은 discovery 순서에 의존하지 않고 모호한 소유자를 거부합니다.

### 로더가 캐시하는 항목

OpenClaw는 다음에 대해 짧은 프로세스 내 캐시를 유지합니다:

- discovery 결과
- manifest 레지스트리 데이터
- 로드된 plugin 레지스트리

이 캐시는 급격한 시작 부하와 반복 명령 오버헤드를 줄입니다. 이는 영속성이 아니라
짧게 유지되는 성능 캐시로 이해하면 안전합니다.

성능 참고:

- 이 캐시를 비활성화하려면 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 또는
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`를 설정하세요.
- 캐시 시간은 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 및
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`로 조정하세요.

## 레지스트리 모델

로드된 plugins는 임의의 core 전역 상태를 직접 변경하지 않습니다. 대신
중앙 plugin 레지스트리에 등록합니다.

레지스트리는 다음을 추적합니다:

- plugin 레코드(identity, source, origin, status, diagnostics)
- tools
- 레거시 hooks 및 typed hooks
- channels
- providers
- Gateway RPC 핸들러
- HTTP routes
- CLI registrars
- 백그라운드 services
- plugin 소유 commands

그런 다음 core 기능은 plugin 모듈과 직접 통신하지 않고 이 레지스트리에서
읽습니다. 이렇게 하면 로딩 방향이 한쪽으로 유지됩니다:

- plugin module -> 레지스트리 등록
- core runtime -> 레지스트리 소비

이 분리는 유지보수성에 중요합니다. 대부분의 core 표면은
"모든 plugin 모듈을 특수 처리"가 아니라 "레지스트리 읽기"라는
하나의 통합 지점만 필요하다는 뜻입니다.

## 대화 바인딩 콜백

대화를 바인딩하는 plugins는 승인이 해결될 때 반응할 수 있습니다.

바인드 요청이 승인되거나 거부된 후 콜백을 받으려면
`api.onConversationBindingResolved(...)`를 사용하세요:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // 이 plugin + 대화에 대한 바인딩이 이제 존재합니다.
        console.log(event.binding?.conversationId);
        return;
      }

      // 요청이 거부되었습니다. 로컬 대기 상태를 정리합니다.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

콜백 페이로드 필드:

- `status`: `"approved"` 또는 `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` 또는 `"deny"`
- `binding`: 승인된 요청에 대해 확인된 바인딩
- `request`: 원래 요청 요약, detach 힌트, sender id,
  대화 메타데이터

이 콜백은 알림 전용입니다. 대화를 누가 바인딩할 수 있는지는 바꾸지 않으며,
core 승인 처리가 끝난 뒤 실행됩니다.

## Provider 런타임 hook

Provider plugins는 이제 두 계층으로 구성됩니다:

- manifest 메타데이터: 런타임 로드 전에 가벼운 provider env-auth 조회를 위한 `providerAuthEnvVars`,
  인증을 공유하는 provider variant를 위한 `providerAuthAliases`,
  런타임 로드 전에 가벼운 채널 env/setup 조회를 위한 `channelEnvVars`,
  그리고 런타임 로드 전에 가벼운 onboarding/auth-choice 레이블과
  CLI 플래그 메타데이터를 위한 `providerAuthChoices`
- config 시점 hook: `catalog` / 레거시 `discovery` 및 `applyConfigDefaults`
- 런타임 hook: `normalizeModelId`, `normalizeTransport`,
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
  `isBinaryThinking`, `supportsXHighThinking`, `supportsAdaptiveThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw는 여전히 일반 에이전트 루프, failover, transcript 처리, tool 정책을 소유합니다.  
이 hook들은 전체 사용자 지정 추론 전송이 없어도 provider별 동작을 확장하기 위한 표면입니다.

provider가 런타임을 로드하지 않고도 일반 auth/status/model-picker 경로에서 보여야 하는 env 기반 자격 증명을 가진 경우에는 manifest `providerAuthEnvVars`를 사용하세요. 하나의 provider id가 다른 provider id의 env vars, auth profiles, config 기반 auth, API-key onboarding choice를 재사용해야 할 때는 manifest `providerAuthAliases`를 사용하세요. onboarding/auth-choice CLI 표면이 provider 런타임을 로드하지 않고도 provider의 choice id, 그룹 레이블, 단순한 단일 플래그 auth 연결을 알아야 할 때는 manifest `providerAuthChoices`를 사용하세요. 운영자 대상 힌트(예: onboarding 레이블 또는 OAuth client-id/client-secret setup vars)에는 provider 런타임 `envVars`를 유지하세요.

채널에 env 기반 auth 또는 setup이 있어서 일반 shell-env 대체 경로, config/status 검사, setup 프롬프트에서 채널 런타임을 로드하지 않고도 보여야 하는 경우에는 manifest `channelEnvVars`를 사용하세요.

### Hook 순서 및 사용법

모델/provider plugins의 경우, OpenClaw는 대략 다음 순서로 hook을 호출합니다.
"사용 시점" 열은 빠른 의사결정 가이드입니다.

| #   | Hook                              | 역할                                                                                                           | 사용 시점                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 생성 중 provider config를 `models.providers`에 게시                                             | provider가 카탈로그 또는 기본 base URL 값을 소유할 때                                                                                   |
| 2   | `applyConfigDefaults`             | config 구체화 중 provider 소유 전역 config 기본값 적용                                                        | 기본값이 auth 모드, env 또는 provider 모델 계열 의미론에 따라 달라질 때                                                                 |
| --  | _(내장 모델 lookup)_              | OpenClaw가 먼저 일반 레지스트리/카탈로그 경로를 시도함                                                        | _(plugin hook 아님)_                                                                                                                     |
| 3   | `normalizeModelId`                | lookup 전에 레거시 또는 미리보기 model-id 별칭 정규화                                                         | provider가 정규 모델 확인 전에 별칭 정리를 소유할 때                                                                                    |
| 4   | `normalizeTransport`              | 일반 모델 조립 전에 provider 계열 `api` / `baseUrl` 정규화                                                    | provider가 같은 전송 계열의 사용자 지정 provider id에 대한 전송 정리를 소유할 때                                                       |
| 5   | `normalizeConfig`                 | 런타임/provider 확인 전에 `models.providers.<id>` 정규화                                                      | provider가 plugin과 함께 살아야 하는 config 정리가 필요할 때. 번들된 Google 계열 helper도 지원되는 Google config 항목을 여기서 보완함 |
| 6   | `applyNativeStreamingUsageCompat` | config provider에 기본 스트리밍 사용량 compat 재작성 적용                                                     | provider가 엔드포인트 기반 기본 스트리밍 사용량 메타데이터 수정을 필요로 할 때                                                         |
| 7   | `resolveConfigApiKey`             | 런타임 auth 로드 전에 config provider용 env-marker auth 확인                                                  | provider가 provider 소유 env-marker API 키 확인을 가질 때. `amazon-bedrock`도 여기에 내장 AWS env-marker 확인기를 가짐                |
| 8   | `resolveSyntheticAuth`            | 평문을 저장하지 않고 local/self-hosted 또는 config 기반 auth를 노출                                           | provider가 synthetic/local 자격 증명 marker로 동작할 수 있을 때                                                                         |
| 9   | `resolveExternalAuthProfiles`     | provider 소유 외부 auth profile 오버레이. 기본 `persistence`는 CLI/app 소유 자격 증명에 대해 `runtime-only` | provider가 복사된 refresh token을 저장하지 않고 외부 auth 자격 증명을 재사용할 때                                                      |
| 10  | `shouldDeferSyntheticProfileAuth` | 저장된 synthetic profile 플레이스홀더를 env/config 기반 auth 뒤로 낮춤                                        | provider가 우선순위를 가져가면 안 되는 synthetic 플레이스홀더 profile을 저장할 때                                                      |
| 11  | `resolveDynamicModel`             | 아직 로컬 레지스트리에 없는 provider 소유 model id에 대한 동기 대체 경로                                      | provider가 임의의 상위 model id를 허용할 때                                                                                             |
| 12  | `prepareDynamicModel`             | 비동기 워밍업 후 `resolveDynamicModel`를 다시 실행                                                             | provider가 알 수 없는 id를 확인하기 전에 네트워크 메타데이터가 필요할 때                                                                |
| 13  | `normalizeResolvedModel`          | embedded runner가 확인된 모델을 사용하기 전 최종 재작성                                                       | provider가 전송 재작성이 필요하지만 여전히 core 전송을 사용할 때                                                                        |
| 14  | `contributeResolvedModelCompat`   | 다른 호환 전송 뒤에 있는 vendor 모델에 대한 compat 플래그 기여                                                | provider가 provider를 직접 소유하지 않고도 프록시 전송에서 자기 모델을 인식할 때                                                       |
| 15  | `capabilities`                    | 공유 core 로직에서 사용하는 provider 소유 transcript/tooling 메타데이터                                       | provider가 transcript/provider 계열 특이사항을 가질 때                                                                                  |
| 16  | `normalizeToolSchemas`            | embedded runner가 보기 전에 tool schema 정규화                                                                 | provider가 전송 계열 schema 정리를 필요로 할 때                                                                                         |
| 17  | `inspectToolSchemas`              | 정규화 후 provider 소유 schema 진단 노출                                                                      | provider가 core에 provider 전용 규칙을 가르치지 않고 keyword 경고를 제공하고 싶을 때                                                   |
| 18  | `resolveReasoningOutputMode`      | 기본 vs 태그 기반 추론 출력 계약 선택                                                                         | provider가 기본 필드 대신 태그 기반 추론/최종 출력을 필요로 할 때                                                                       |
| 19  | `prepareExtraParams`              | 일반 스트림 옵션 래퍼 전에 요청 파라미터 정규화                                                               | provider가 기본 요청 파라미터 또는 provider별 파라미터 정리가 필요할 때                                                                 |
| 20  | `createStreamFn`                  | 사용자 지정 전송으로 일반 스트림 경로를 완전히 대체                                                           | provider가 단순 래퍼가 아니라 사용자 지정 wire protocol이 필요할 때                                                                     |
| 21  | `wrapStreamFn`                    | 일반 래퍼가 적용된 후 스트림 래핑                                                                             | provider가 사용자 지정 전송 없이 요청 헤더/본문/모델 compat 래퍼를 필요로 할 때                                                        |
| 22  | `resolveTransportTurnState`       | 기본 턴별 전송 헤더 또는 메타데이터 부착                                                                      | provider가 일반 전송이 provider 기본 턴 identity를 보내도록 하길 원할 때                                                                |
| 23  | `resolveWebSocketSessionPolicy`   | 기본 WebSocket 헤더 또는 세션 쿨다운 정책 부착                                                                | provider가 일반 WS 전송에서 세션 헤더 또는 대체 정책 조정을 원할 때                                                                     |
| 24  | `formatApiKey`                    | auth-profile 포맷터: 저장된 profile을 런타임 `apiKey` 문자열로 변환                                           | provider가 추가 auth 메타데이터를 저장하고 사용자 지정 런타임 토큰 형태가 필요할 때                                                    |
| 25  | `refreshOAuth`                    | 사용자 지정 refresh 엔드포인트 또는 refresh 실패 정책을 위한 OAuth refresh 재정의                             | provider가 공유 `pi-ai` refresher에 맞지 않을 때                                                                                        |
| 26  | `buildAuthDoctorHint`             | OAuth refresh 실패 시 추가되는 복구 힌트                                                                      | provider가 refresh 실패 후 provider 소유 auth 복구 가이드를 필요로 할 때                                                                |
| 27  | `matchesContextOverflowError`     | provider 소유 컨텍스트 창 초과 매처                                                                           | provider가 일반 휴리스틱이 놓치는 원시 초과 오류를 가질 때                                                                              |
| 28  | `classifyFailoverReason`          | provider 소유 failover 사유 분류                                                                              | provider가 원시 API/전송 오류를 rate-limit/overload 등으로 매핑할 수 있을 때                                                            |
| 29  | `isCacheTtlEligible`              | 프록시/백홀 provider용 프롬프트 캐시 정책                                                                     | provider가 프록시 전용 캐시 TTL 게이팅을 필요로 할 때                                                                                   |
| 30  | `buildMissingAuthMessage`         | 일반 missing-auth 복구 메시지 대체                                                                            | provider가 provider 전용 missing-auth 복구 힌트를 필요로 할 때                                                                          |
| 31  | `suppressBuiltInModel`            | 오래된 상위 모델 억제 및 선택적 사용자 대상 오류 힌트                                                         | provider가 오래된 상위 행을 숨기거나 vendor 힌트로 대체해야 할 때                                                                       |
| 32  | `augmentModelCatalog`             | discovery 후 추가되는 synthetic/최종 카탈로그 행                                                              | provider가 `models list` 및 picker에서 synthetic forward-compat 행을 필요로 할 때                                                       |
| 33  | `isBinaryThinking`                | binary-thinking provider용 on/off 추론 토글                                                                   | provider가 이진 thinking on/off만 노출할 때                                                                                              |
| 34  | `supportsXHighThinking`           | 선택된 모델에 대한 `xhigh` 추론 지원                                                                          | provider가 일부 모델에서만 `xhigh`를 원할 때                                                                                            |
| 35  | `supportsAdaptiveThinking`        | 선택된 모델에 대한 `adaptive` thinking 지원                                                                   | provider가 provider 관리 adaptive thinking이 있는 모델에만 `adaptive`를 표시하고 싶을 때                                                |
| 36  | `resolveDefaultThinkingLevel`     | 특정 모델 계열의 기본 `/think` 수준 확인                                                                      | provider가 모델 계열의 기본 `/think` 정책을 소유할 때                                                                                   |
| 37  | `isModernModelRef`                | 라이브 profile 필터 및 smoke 선택용 modern-model 매처                                                         | provider가 live/smoke 선호 모델 매칭을 소유할 때                                                                                        |
| 38  | `prepareRuntimeAuth`              | 추론 직전에 구성된 자격 증명을 실제 런타임 토큰/키로 교환                                                    | provider가 토큰 교환 또는 수명이 짧은 요청 자격 증명을 필요로 할 때                                                                       |
| 39  | `resolveUsageAuth`                | `/usage` 및 관련 상태 표면에 대한 사용량/청구 자격 증명 확인                                                 | provider가 사용자 지정 사용량/할당량 토큰 파싱 또는 다른 사용량 자격 증명을 필요로 할 때                                                 |
| 40  | `fetchUsageSnapshot`              | auth가 확인된 후 provider별 사용량/할당량 스냅샷 가져오기 및 정규화                                           | provider가 provider별 사용량 엔드포인트 또는 페이로드 파서를 필요로 할 때                                                                 |
| 41  | `createEmbeddingProvider`         | memory/search용 provider 소유 임베딩 어댑터 빌드                                                              | memory 임베딩 동작이 provider plugin에 속할 때                                                                                            |
| 42  | `buildReplayPolicy`               | provider의 transcript 처리를 제어하는 replay 정책 반환                                                       | provider가 사용자 지정 transcript 정책(예: thinking 블록 제거)을 필요로 할 때                                                             |
| 43  | `sanitizeReplayHistory`           | 일반 transcript 정리 후 replay 기록 재작성                                                                    | provider가 공유 Compaction helper를 넘는 provider별 replay 재작성을 필요로 할 때                                                          |
| 44  | `validateReplayTurns`             | embedded runner 이전의 최종 replay 턴 검증 또는 재구성                                                        | provider 전송이 일반 정리 이후 더 엄격한 턴 검증을 필요로 할 때                                                                           |
| 45  | `onModelSelected`                 | provider 소유의 선택 후 부수 효과 실행                                                                        | 모델이 활성화될 때 provider가 telemetry 또는 provider 소유 상태를 필요로 할 때                                                            |

`normalizeModelId`, `normalizeTransport`, `normalizeConfig`는 먼저
일치하는 provider plugin을 확인한 다음, model id나 transport/config를 실제로 바꾸는 plugin이 나올 때까지 다른 hook 가능 provider plugins로 계속 넘어갑니다. 이렇게 하면 호출자가 어떤 번들 plugin이 재작성을 소유하는지 알 필요 없이
별칭/compat provider shim이 계속 동작합니다. 어떤 provider hook도 지원되는
Google 계열 config 항목을 재작성하지 않으면, 번들된 Google config normalizer가 여전히
그 호환성 정리를 적용합니다.

provider에 완전히 사용자 지정 wire protocol 또는 사용자 지정 요청 실행기가 필요하다면,
그것은 다른 종류의 확장입니다. 이 hook들은 OpenClaw의 일반 추론 루프에서
계속 실행되는 provider 동작을 위한 것입니다.

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
  `supportsAdaptiveThinking`, `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  `wrapStreamFn`을 사용합니다. 이는 Claude 4.6 forward-compat,
  provider 계열 힌트, auth 복구 가이드, 사용량 엔드포인트 통합,
  프롬프트 캐시 적격성, auth 인식 config 기본값, Claude
  기본/adaptive thinking 정책, 그리고 베타 헤더,
  `/fast` / `serviceTier`, `context1m`에 대한 Anthropic 전용 스트림 shaping을 소유하기 때문입니다.
- Anthropic의 Claude 전용 스트림 helper는 현재 번들 plugin 자체의
  공개 `api.ts` / `contract-api.ts` seam에 남아 있습니다. 이 패키지 표면은
  한 provider의 베타 헤더 규칙에 맞춰 일반 SDK를 넓히는 대신
  `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, 더 낮은 수준의
  Anthropic wrapper builder를 export합니다.
- OpenAI는 `resolveDynamicModel`, `normalizeResolvedModel`,
  `capabilities`와 함께 `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking`, `isModernModelRef`를 사용합니다.
  이는 GPT-5.4 forward-compat, 직접 OpenAI
  `openai-completions` -> `openai-responses` 정규화, Codex 인식 auth
  힌트, Spark 억제, synthetic OpenAI 목록 행, GPT-5 thinking /
  live-model 정책을 소유하기 때문입니다. `openai-responses-defaults` 스트림 계열은
  attribution 헤더,
  `/fast`/`serviceTier`, 텍스트 verbosity, 기본 Codex 웹 검색,
  reasoning-compat 페이로드 shaping, Responses 컨텍스트 관리를 위한
  공유 기본 OpenAI Responses wrapper를 소유합니다.
- OpenRouter는 `catalog`와 함께 `resolveDynamicModel`,
  `prepareDynamicModel`을 사용합니다. provider가 pass-through이고 OpenClaw의 정적 카탈로그가 업데이트되기 전에
  새 model id를 노출할 수 있기 때문입니다. 또한
  provider별 요청 헤더, 라우팅 메타데이터, reasoning 패치,
  프롬프트 캐시 정책을 core 밖에 두기 위해 `capabilities`, `wrapStreamFn`, `isCacheTtlEligible`도 사용합니다.
  replay 정책은
  `passthrough-gemini` 계열에서 오며, `openrouter-thinking` 스트림 계열은
  프록시 reasoning 주입과 미지원 모델 / `auto` 건너뛰기를 소유합니다.
- GitHub Copilot은 `catalog`, `auth`, `resolveDynamicModel`,
  `capabilities`와 함께 `prepareRuntimeAuth`, `fetchUsageSnapshot`을 사용합니다.
  이는 provider 소유 device login, 모델 대체 동작, Claude transcript
  특이사항, GitHub 토큰 -> Copilot 토큰 교환, provider 소유 사용량
  엔드포인트가 필요하기 때문입니다.
- OpenAI Codex는 `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth`, `augmentModelCatalog`와 함께
  `prepareExtraParams`, `resolveUsageAuth`, `fetchUsageSnapshot`을 사용합니다.
  이는 여전히 core OpenAI 전송에서 실행되지만 전송/base URL
  정규화, OAuth refresh 대체 정책, 기본 전송 선택,
  synthetic Codex 카탈로그 행, ChatGPT 사용량 엔드포인트 통합을 소유하기 때문입니다. direct OpenAI와
  같은 `openai-responses-defaults` 스트림 계열을 공유합니다.
- Google AI Studio와 Gemini CLI OAuth는 `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn`, `isModernModelRef`를 사용합니다. 이는
  `google-gemini` replay 계열이 Gemini 3.1 forward-compat 대체 경로,
  기본 Gemini replay 검증, bootstrap replay 정리, 태그 기반
  reasoning-output 모드, modern-model 매칭을 소유하고,
  `google-thinking` 스트림 계열이 Gemini thinking 페이로드 정규화를 소유하기 때문입니다.
  Gemini CLI OAuth는 토큰 포맷팅, 토큰 파싱, quota 엔드포인트
  연결을 위해 `formatApiKey`, `resolveUsageAuth`, `fetchUsageSnapshot`도 사용합니다.
- Anthropic Vertex는
  `anthropic-by-model` replay 계열을 통해 `buildReplayPolicy`를 사용하므로 Claude 전용 replay 정리가 모든 `anthropic-messages` 전송이 아니라
  Claude id에만 범위가 지정됩니다.
- Amazon Bedrock은 `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `resolveDefaultThinkingLevel`을 사용합니다. 이는
  Anthropic-on-Bedrock 트래픽에 대한 Bedrock 전용 throttle/not-ready/context-overflow 오류 분류를
  소유하기 때문입니다. replay 정책은 여전히 같은
  Claude 전용 `anthropic-by-model` 가드를 공유합니다.
- OpenRouter, Kilocode, Opencode, Opencode Go는 `buildReplayPolicy`를
  `passthrough-gemini` replay 계열을 통해 사용합니다. 이들은 Gemini
  모델을 OpenAI 호환 전송을 통해 프록시하며, 기본 Gemini replay 검증이나
  bootstrap 재작성 없이 Gemini thought-signature 정리가 필요하기 때문입니다.
- MiniMax는 `buildReplayPolicy`를
  `hybrid-anthropic-openai` replay 계열을 통해 사용합니다. 이는 하나의 provider가 Anthropic-message와 OpenAI 호환 의미론을
  둘 다 소유하기 때문입니다. Anthropic 쪽에서는 Claude 전용
  thinking 블록 제거를 유지하면서 reasoning 출력 모드는 다시 기본으로 재정의하고,
  `minimax-fast-mode` 스트림 계열은 공유 스트림 경로에서
  fast-mode 모델 재작성을 소유합니다.
- Moonshot은 `catalog`와 `wrapStreamFn`을 사용합니다. 여전히 공유
  OpenAI 전송을 사용하지만 provider 소유 thinking 페이로드 정규화가 필요하기 때문입니다.
  `moonshot-thinking` 스트림 계열은 config와 `/think` 상태를
  기본 이진 thinking 페이로드에 매핑합니다.
- Kilocode는 `catalog`, `capabilities`, `wrapStreamFn`,
  `isCacheTtlEligible`를 사용합니다. provider 소유 요청 헤더,
  reasoning 페이로드 정규화, Gemini transcript 힌트, Anthropic
  캐시 TTL 게이팅이 필요하기 때문입니다. `kilocode-thinking` 스트림 계열은
  명시적 reasoning 페이로드를 지원하지 않는 `kilo/auto`와
  다른 프록시 model id를 건너뛰면서 공유 프록시 스트림 경로에 Kilo thinking
  주입을 유지합니다.
- Z.AI는 `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth`, `fetchUsageSnapshot`을 사용합니다. 이는 GLM-5 대체 경로,
  `tool_stream` 기본값, 이진 thinking UX, modern-model 매칭,
  사용량 auth + quota 가져오기를 모두 소유하기 때문입니다. `tool-stream-default-on` 스트림 계열은
  기본 활성 `tool_stream` wrapper를 provider별 수기 glue 밖에 둡니다.
- xAI는 `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel`, `isModernModelRef`를 사용합니다.
  이는 기본 xAI Responses 전송 정규화, Grok fast-mode
  별칭 재작성, 기본 `tool_stream`, 엄격한 tool / reasoning 페이로드
  정리, plugin 소유 tool을 위한 대체 auth 재사용, forward-compat Grok
  모델 확인, xAI tool-schema
  profile, 미지원 schema keyword, 기본 `web_search`, HTML 엔터티
  tool-call 인수 디코딩 같은 provider 소유 compat 패치를 소유하기 때문입니다.
- Mistral, OpenCode Zen, OpenCode Go는
  transcript/tooling 특이사항을 core 밖에 두기 위해 `capabilities`만 사용합니다.
- `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway`, `volcengine` 같은
  카탈로그 전용 번들 providers는 `catalog`만 사용합니다.
- Qwen은 텍스트 provider용 `catalog`와
  멀티모달 표면을 위한 공유 media-understanding 및
  video-generation 등록을 사용합니다.
- MiniMax와 Xiaomi는 추론은 여전히 공유
  전송을 통해 실행되더라도 `/usage` 동작이 plugin 소유이므로 `catalog`와 사용량 hook을 함께 사용합니다.

## 런타임 helper

plugins는 `api.runtime`를 통해 선택된 core helper에 접근할 수 있습니다. TTS의 경우:

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

- `textToSpeech`는 파일/음성 노트 표면을 위한 일반 core TTS 출력 페이로드를 반환합니다.
- core `messages.tts` config와 provider 선택을 사용합니다.
- PCM 오디오 버퍼 + 샘플 레이트를 반환합니다. plugins는 provider에 맞게 리샘플링/인코딩해야 합니다.
- `listVoices`는 provider별로 선택 사항입니다. vendor 소유 음성 picker 또는 setup 흐름에 사용하세요.
- 음성 목록에는 provider 인식 picker를 위한 locale, gender, personality 태그 같은 더 풍부한 메타데이터가 포함될 수 있습니다.
- 현재 전화 기능은 OpenAI와 ElevenLabs를 지원합니다. Microsoft는 지원하지 않습니다.

plugins는 `api.registerSpeechProvider(...)`를 통해 음성 provider를 등록할 수도 있습니다.

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

- TTS 정책, 대체 경로, 응답 전달은 core에 유지하세요.
- vendor 소유 합성 동작에는 음성 provider를 사용하세요.
- 레거시 Microsoft `edge` 입력은 `microsoft` provider id로 정규화됩니다.
- 선호되는 소유권 모델은 회사 중심입니다. 하나의 vendor plugin이
  OpenClaw가 기능 계약을 추가함에 따라 텍스트, 음성, 이미지, 미래의 미디어 provider를 모두 소유할 수 있습니다.

이미지/오디오/비디오 이해의 경우, plugins는 일반 key/value bag 대신
하나의 타입이 있는 media-understanding provider를 등록합니다:

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

- 오케스트레이션, 대체 경로, config, 채널 연결은 core에 유지하세요.
- vendor 동작은 provider plugin에 유지하세요.
- 점진적 확장은 타입을 유지해야 합니다: 새로운 선택적 메서드, 새로운 선택적
  결과 필드, 새로운 선택적 기능.
- 비디오 생성도 이미 같은 패턴을 따릅니다:
  - core가 기능 계약과 런타임 helper를 소유합니다
  - vendor plugins가 `api.registerVideoGenerationProvider(...)`를 등록합니다
  - 기능/채널 plugins는 `api.runtime.videoGeneration.*`를 소비합니다

media-understanding 런타임 helper의 경우, plugins는 다음을 호출할 수 있습니다:

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

오디오 전사의 경우, plugins는 media-understanding 런타임 또는
기존 STT 별칭을 사용할 수 있습니다:

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
- core media-understanding 오디오 config(`tools.media.audio`)와 provider 대체 순서를 사용합니다.
- 전사 출력이 생성되지 않으면(예: 건너뜀/미지원 입력) `{ text: undefined }`를 반환합니다.
- `api.runtime.stt.transcribeAudioFile(...)`는 호환성 별칭으로 남아 있습니다.

plugins는 `api.runtime.subagent`를 통해 백그라운드 subagent 실행도 시작할 수 있습니다:

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
- OpenClaw는 신뢰된 호출자에 대해서만 이러한 재정의 필드를 적용합니다.
- plugin 소유 대체 실행의 경우 운영자는 `plugins.entries.<id>.subagent.allowModelOverride: true`로 명시적으로 활성화해야 합니다.
- 신뢰된 plugins를 특정 정규 `provider/model` 대상으로 제한하려면 `plugins.entries.<id>.subagent.allowedModels`를 사용하고, 아무 대상이나 명시적으로 허용하려면 `"*"`를 사용하세요.
- 신뢰되지 않은 plugin의 subagent 실행도 동작은 하지만, 재정의 요청은 조용히 대체되지 않고 거부됩니다.

웹 검색의 경우, plugins는 에이전트 tool 연결을 직접 건드리는 대신
공유 런타임 helper를 소비할 수 있습니다:

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

plugins는
`api.registerWebSearchProvider(...)`를 통해 웹 검색 provider를 등록할 수도 있습니다.

참고:

- provider 선택, 자격 증명 확인, 공유 요청 의미론은 core에 유지하세요.
- vendor별 검색 전송에는 웹 검색 provider를 사용하세요.
- `api.runtime.webSearch.*`는 검색 동작이 필요하지만 에이전트 tool wrapper에는 의존하지 않아야 하는 기능/채널 plugins를 위한 선호되는 공유 표면입니다.

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
- `listProviders(...)`: 사용 가능한 이미지 생성 providers와 그 기능을 나열합니다.

## Gateway HTTP routes

plugins는 `api.registerHttpRoute(...)`로 HTTP 엔드포인트를 노출할 수 있습니다.

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

- `path`: Gateway HTTP 서버 아래의 route 경로.
- `auth`: 필수. 일반 Gateway auth가 필요하면 `"gateway"`를, plugin 관리 auth/Webhook 검증이면 `"plugin"`을 사용하세요.
- `match`: 선택 사항. `"exact"`(기본값) 또는 `"prefix"`.
- `replaceExisting`: 선택 사항. 같은 plugin이 자기 기존 route 등록을 교체할 수 있게 합니다.
- `handler`: route가 요청을 처리했으면 `true`를 반환합니다.

참고:

- `api.registerHttpHandler(...)`는 제거되었으며 plugin 로드 오류를 발생시킵니다. 대신 `api.registerHttpRoute(...)`를 사용하세요.
- plugin route는 `auth`를 명시적으로 선언해야 합니다.
- 정확히 같은 `path + match` 충돌은 `replaceExisting: true`가 아니면 거부되며, 한 plugin이 다른 plugin의 route를 교체할 수는 없습니다.
- `auth` 수준이 다른 겹치는 route는 거부됩니다. `exact`/`prefix` 폴스루 체인은 같은 auth 수준에서만 유지하세요.
- `auth: "plugin"` route는 자동으로 operator 런타임 scope를 받지 **않습니다**. 이는 권한 있는 Gateway helper 호출이 아니라 plugin 관리 Webhook/서명 검증용입니다.
- `auth: "gateway"` route는 Gateway 요청 런타임 scope 안에서 실행되지만, 그 scope는 의도적으로 보수적입니다:
  - 공유 시크릿 bearer auth(`gateway.auth.mode = "token"` / `"password"`)는 호출자가 `x-openclaw-scopes`를 보내더라도 plugin-route 런타임 scope를 `operator.write`로 고정합니다
  - 신뢰된 identity 포함 HTTP 모드(예: `trusted-proxy` 또는 private ingress의 `gateway.auth.mode = "none"`)는 헤더가 명시적으로 존재할 때만 `x-openclaw-scopes`를 적용합니다
  - 그런 identity 포함 plugin-route 요청에서 `x-openclaw-scopes`가 없으면 런타임 scope는 `operator.write`로 대체됩니다
- 실용 규칙: Gateway auth plugin route를 암묵적 admin 표면으로 가정하지 마세요. route에 admin 전용 동작이 필요하다면 identity 포함 auth 모드를 요구하고 명시적인 `x-openclaw-scopes` 헤더 계약을 문서화하세요.

## Plugin SDK import 경로

plugin을 작성할 때는 단일 `openclaw/plugin-sdk` import 대신
SDK 하위 경로를 사용하세요:

- plugin 등록 기본 요소는 `openclaw/plugin-sdk/plugin-entry`.
- 일반적인 공유 plugin 대상 계약은 `openclaw/plugin-sdk/core`.
- 루트 `openclaw.json` Zod schema
  export(`OpenClawSchema`)는 `openclaw/plugin-sdk/config-schema`.
- `openclaw/plugin-sdk/channel-setup`,
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
  `openclaw/plugin-sdk/secret-input`,
  `openclaw/plugin-sdk/webhook-ingress` 같은 안정적인 채널 기본 요소는
  공유 setup/auth/reply/Webhook
  연결에 사용하세요. `channel-inbound`는 debounce, 멘션 매칭,
  인바운드 멘션 정책 helper, envelope 포맷팅, 인바운드 envelope
  컨텍스트 helper를 위한 공유 위치입니다.
  `channel-setup`은 좁은 선택적 설치 setup seam입니다.
  `setup-runtime`은 `setupEntry` /
  지연 시작에서 사용하는 런타임 안전 setup 표면이며 import 안전 setup patch adapter를 포함합니다.
  `setup-adapter-runtime`은 env 인식 account-setup adapter seam입니다.
  `setup-tools`는 작은 CLI/archive/docs helper seam입니다(`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- `openclaw/plugin-sdk/channel-config-helpers`,
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
  `openclaw/plugin-sdk/runtime-store`,
  `openclaw/plugin-sdk/directory-runtime` 같은 도메인 하위 경로는
  공유 런타임/config helper에 사용하세요.
  `telegram-command-config`는 Telegram 사용자 지정
  명령 정규화/검증을 위한 좁은 공개 seam이며, 번들된
  Telegram 계약 표면을 일시적으로 사용할 수 없더라도 계속 제공됩니다.
  `text-runtime`은 assistant-visible-text 제거, markdown 렌더/청킹 helper, 마스킹
  helper, directive-tag helper, safe-text 유틸리티를 포함한 공유 텍스트/markdown/로깅 seam입니다.
- 승인 전용 채널 seam은 plugin에 하나의 `approvalCapability`
  계약을 두는 방식을 우선해야 합니다. 그러면 core는 승인 동작을 관련 없는 plugin 필드에 섞는 대신
  그 하나의 기능을 통해 승인 auth, 전달, 렌더,
  기본 라우팅, 지연 기본 핸들러 동작을 읽습니다.
- `openclaw/plugin-sdk/channel-runtime`은 더 이상 권장되지 않으며 오래된 plugins를 위한
  호환성 shim으로만 남아 있습니다. 새 코드는 대신 더 좁은
  일반 기본 요소를 import해야 하며, repo 코드도 shim에 대한 새 import를 추가하면 안 됩니다.
- 번들 extension 내부는 비공개로 유지됩니다. 외부 plugins는 `openclaw/plugin-sdk/*` 하위 경로만 사용해야 합니다. OpenClaw core/test 코드는
  `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js`, `login-qr-api.js` 같은
  plugin 패키지 루트 아래의 repo 공개 엔트리 지점과
  좁게 범위가 지정된 파일을 사용할 수 있습니다. core나 다른 extension에서 plugin 패키지의 `src/*`를 절대 import하지 마세요.
- Repo 엔트리 지점 분리:
  `<plugin-package-root>/api.js`는 helper/types barrel,
  `<plugin-package-root>/runtime-api.js`는 런타임 전용 barrel,
  `<plugin-package-root>/index.js`는 번들 plugin 엔트리,
  `<plugin-package-root>/setup-entry.js`는 setup plugin 엔트리입니다.
- 현재 번들 provider 예시:
  - Anthropic은 `wrapAnthropicProviderStream`, beta-header helper, `service_tier`
    파싱 같은 Claude 스트림 helper에 `api.js` / `contract-api.js`를 사용합니다.
  - OpenAI는 provider builder, 기본 모델 helper, 실시간 provider builder에
    `api.js`를 사용합니다.
  - OpenRouter는 provider builder와 onboarding/config
    helper에 `api.js`를 사용하며, `register.runtime.js`는 여전히 repo 로컬 사용을 위해
    일반 `plugin-sdk/provider-stream` helper를 다시 export할 수 있습니다.
- facade 로드 공개 엔트리 지점은 활성 런타임 config 스냅샷이 있으면 이를 우선하고,
  OpenClaw가 아직 런타임 스냅샷을 제공하지 않을 때는 디스크의 확인된 config 파일로 대체합니다.
- 일반 공유 기본 요소는 여전히 선호되는 공개 SDK 계약입니다. 일부 예약된 호환성용 번들 채널 브랜드 helper seam은 여전히 존재합니다. 이를
  새 서드파티 import 대상이 아니라 번들 유지보수/호환성 seam으로 취급하세요. 새 채널 간 계약은 여전히
  일반 `plugin-sdk/*` 하위 경로 또는 plugin 로컬 `api.js` /
  `runtime-api.js` barrel에 추가되어야 합니다.

호환성 참고:

- 새 코드에서는 루트 `openclaw/plugin-sdk` barrel을 피하세요.
- 먼저 더 좁고 안정적인 기본 요소를 우선하세요. 더 새로운 setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/Webhook/infra/
  allowlist/status/message-tool 하위 경로가 새
  번들 및 외부 plugin 작업을 위한 의도된 계약입니다.
  대상 파싱/매칭은 `openclaw/plugin-sdk/channel-targets`에 속합니다.
  메시지 액션 게이트와 반응 message-id helper는
  `openclaw/plugin-sdk/channel-actions`에 속합니다.
- 번들 extension 전용 helper barrel은 기본적으로 안정적이지 않습니다. helper가
  번들 extension에만 필요하다면, 이를
  `openclaw/plugin-sdk/<extension>`으로 승격하는 대신 extension의 로컬
  `api.js` 또는 `runtime-api.js` seam 뒤에 유지하세요.
- 새 공유 helper seam은 채널 브랜드가 아니라 일반적이어야 합니다. 공유 대상
  파싱은 `openclaw/plugin-sdk/channel-targets`에 속하며, 채널별
  내부는 소유 plugin의 로컬 `api.js` 또는 `runtime-api.js`
  seam 뒤에 남아야 합니다.
- `image-generation`,
  `media-understanding`, `speech` 같은 기능별 하위 경로는 오늘날 번들/기본 plugins가
  사용하기 때문에 존재합니다. 그 존재 자체가 모든 export된 helper가 장기적으로 고정된 외부 계약이라는 뜻은 아닙니다.

## 메시지 도구 schema

plugins는 채널별 `describeMessageTool(...)` schema
기여를 소유해야 합니다. provider별 필드는 공유 core가 아니라 plugin 안에 두세요.

공유 가능한 portable schema fragment에는
`openclaw/plugin-sdk/channel-actions`를 통해 export되는 일반 helper를 재사용하세요:

- 버튼 그리드 스타일 페이로드용 `createMessageToolButtonsSchema()`
- 구조화된 카드 페이로드용 `createMessageToolCardSchema()`

schema 형태가 하나의 provider에서만 의미가 있다면, 이를 공유 SDK로 올리지 말고
그 plugin의 자체 소스에 정의하세요.

## 채널 대상 확인

채널 plugins는 채널별 대상 의미론을 소유해야 합니다. 공유
아웃바운드 호스트는 일반적으로 유지하고, provider 규칙에는 메시징 adapter 표면을 사용하세요:

- `messaging.inferTargetChatType({ to })`는 정규화된 대상을
  디렉터리 lookup 전에 `direct`, `group`, `channel` 중 무엇으로 취급할지 결정합니다.
- `messaging.targetResolver.looksLikeId(raw, normalized)`는
  입력이 디렉터리 검색 대신 id 형태 확인으로 바로 넘어가야 하는지를 core에 알려줍니다.
- `messaging.targetResolver.resolveTarget(...)`는
  정규화 후 또는 디렉터리 miss 후 core가 최종 provider 소유 확인이 필요할 때 사용하는 plugin 대체 경로입니다.
- `messaging.resolveOutboundSessionRoute(...)`는 대상이 확인된 뒤
  provider별 세션 route 구성을 소유합니다.

권장 분리:

- peer/group 검색 전에 일어나야 하는 범주 결정에는 `inferTargetChatType`을 사용하세요.
- "이를 명시적/기본 대상 id로 취급" 확인에는 `looksLikeId`를 사용하세요.
- 폭넓은 디렉터리 검색이 아니라 provider별 정규화 대체 경로에는 `resolveTarget`을 사용하세요.
- chat id, thread id, JID, handle, room id 같은 provider 기본 id는
  일반 SDK 필드가 아니라 `target` 값 또는 provider별 파라미터 안에 유지하세요.

## config 기반 디렉터리

config에서 디렉터리 항목을 파생하는 plugins는 그 로직을 plugin 안에 유지하고,
`openclaw/plugin-sdk/directory-runtime`의
공유 helper를 재사용해야 합니다.

다음과 같은 config 기반 peer/group이 필요한 채널에서는 이를 사용하세요:

- allowlist 기반 DM peer
- 구성된 채널/그룹 맵
- 계정 범위 정적 디렉터리 대체 경로

`directory-runtime`의 공유 helper는 일반 작업만 처리합니다:

- 쿼리 필터링
- limit 적용
- deduping/정규화 helper
- `ChannelDirectoryEntry[]` 빌드

채널별 계정 검사와 id 정규화는 plugin 구현 안에 남아야 합니다.

## Provider 카탈로그

Provider plugins는
`registerProvider({ catalog: { run(...) { ... } } })`로 추론용 모델 카탈로그를 정의할 수 있습니다.

`catalog.run(...)`은 OpenClaw가
`models.providers`에 쓰는 것과 같은 형태를 반환합니다:

- 하나의 provider 항목인 경우 `{ provider }`
- 여러 provider 항목인 경우 `{ providers }`

plugin이 provider별 model id, 기본 base URL
값 또는 auth 게이트된 모델 메타데이터를 소유할 때는 `catalog`를 사용하세요.

`catalog.order`는 plugin의 카탈로그가 OpenClaw의
내장 암시적 provider에 비해 언제 병합될지를 제어합니다:

- `simple`: 일반 API 키 또는 env 기반 provider
- `profile`: auth profile이 존재할 때 나타나는 provider
- `paired`: 여러 관련 provider 항목을 합성하는 provider
- `late`: 다른 암시적 provider 뒤의 마지막 단계

나중 provider가 키 충돌에서 우선하므로, plugins는 같은 provider id를 가진
내장 provider 항목을 의도적으로 재정의할 수 있습니다.

호환성:

- `discovery`는 여전히 레거시 별칭으로 동작합니다
- `catalog`와 `discovery`가 둘 다 등록되면 OpenClaw는 `catalog`를 사용합니다

## 읽기 전용 채널 검사

plugin이 채널을 등록한다면,
`resolveAccount(...)`와 함께 `plugin.config.inspectAccount(cfg, accountId)`를 구현하는 방식을 우선하세요.

이유:

- `resolveAccount(...)`는 런타임 경로입니다. 자격 증명이
  완전히 구체화되었다고 가정할 수 있으며 필요한 secret이 없으면 빠르게 실패해도 됩니다.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, doctor/config
  복구 흐름 같은 읽기 전용 명령 경로는 구성 설명만을 위해 런타임 자격 증명을 구체화할 필요가 없어야 합니다.

권장 `inspectAccount(...)` 동작:

- 설명용 계정 상태만 반환합니다.
- `enabled`와 `configured`를 보존합니다.
- 관련이 있다면 자격 증명 source/status 필드를 포함합니다. 예:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 읽기 전용 가용성 보고를 위해 원시 토큰 값을 반환할 필요는 없습니다.
  상태 스타일 명령에는 `tokenStatus: "available"`(및 일치하는 source
  필드)만으로 충분합니다.
- 자격 증명이 SecretRef로 구성되었지만 현재 명령 경로에서 사용할 수 없는 경우
  `configured_unavailable`을 사용하세요.

이렇게 하면 읽기 전용 명령이 크래시하거나 계정을 미구성 상태로 잘못 보고하는 대신
"구성되었지만 이 명령 경로에서는 사용할 수 없음"을 보고할 수 있습니다.

## 패키지 팩

plugin 디렉터리에는 `openclaw.extensions`가 포함된 `package.json`이 있을 수 있습니다:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

각 항목은 하나의 plugin이 됩니다. 팩이 여러 extensions를 나열하면 plugin id는
`name/<fileBase>`가 됩니다.

plugin이 npm 의존성을 import한다면 해당 디렉터리에서 설치해
`node_modules`를 사용할 수 있게 하세요(`npm install` / `pnpm install`).

보안 가드레일: 모든 `openclaw.extensions` 항목은 심볼릭 링크 확인 후에도
plugin 디렉터리 내부에 있어야 합니다. 패키지 디렉터리를 벗어나는 항목은
거부됩니다.

보안 참고: `openclaw plugins install`은 plugin 의존성을
`npm install --omit=dev --ignore-scripts`로 설치합니다(라이프사이클 스크립트 없음, 런타임에 dev 의존성 없음). plugin 의존성
트리는 "순수 JS/TS"로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.

선택 사항: `openclaw.setupEntry`는 가벼운 setup 전용 모듈을 가리킬 수 있습니다.
OpenClaw가 비활성화된 채널 plugin에 대한 setup 표면이 필요하거나,
채널 plugin이 활성화되었지만 아직 구성되지 않은 경우,
전체 plugin 엔트리 대신 `setupEntry`를 로드합니다. 이렇게 하면
주 plugin 엔트리가 tools, hooks, 기타 런타임 전용
코드도 연결할 때 시작과 setup이 더 가벼워집니다.

선택 사항:
`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`은 채널 plugin이 이미 구성된 경우에도
Gateway의 pre-listen 시작 단계에서 같은 `setupEntry` 경로를 사용하도록 opt-in할 수 있습니다.

이 옵션은 `setupEntry`가 Gateway가 리슨을 시작하기 전에 존재해야 하는 시작 표면을
완전히 커버할 때만 사용하세요. 실제로는 setup entry가
시작이 의존하는 모든 채널 소유 기능을 등록해야 한다는 뜻입니다. 예를 들면:

- 채널 등록 자체
- Gateway가 리슨을 시작하기 전에 사용 가능해야 하는 모든 HTTP route
- 같은 창에서 존재해야 하는 모든 Gateway 메서드, tools, services

전체 엔트리가 여전히 필요한 시작 기능을 하나라도 소유한다면 이 플래그를 활성화하지 마세요.
기본 동작을 유지하고 OpenClaw가 시작 중 전체 엔트리를 로드하도록 하세요.

번들 채널은 전체 채널 런타임이 로드되기 전에 core가 참조할 수 있는
setup 전용 계약 표면 helper도 게시할 수 있습니다. 현재 setup
승격 표면은 다음과 같습니다:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

core는 레거시 단일 계정 채널
config를 전체 plugin 엔트리를 로드하지 않고 `channels.<id>.accounts.*`로 승격해야 할 때 이 표면을 사용합니다.
현재 번들 예시는 Matrix입니다. 명명된 계정이 이미 존재할 때 auth/bootstrap 키만
명명된 승격 계정으로 옮기며,
항상 `accounts.default`를 만드는 대신 구성된 비정규 기본 계정 키를 유지할 수 있습니다.

이러한 setup patch adapter는 번들 계약 표면 discovery를 지연 상태로 유지합니다.
import 시간은 가볍게 유지되고, 승격 표면은 모듈 import 시 번들 채널 시작에 다시 들어가는 대신
첫 사용 시에만 로드됩니다.

그 시작 표면에 Gateway RPC 메서드가 포함된다면,
plugin 전용 접두사에 유지하세요. core admin 네임스페이스(`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`)는 예약되어 있으며 항상
`operator.admin`으로 확인되므로, plugin이 더 좁은 scope를 요청하더라도 예외가 없습니다.

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

채널 plugins는 `openclaw.channel`을 통해 setup/discovery 메타데이터를,
`openclaw.install`을 통해 설치 힌트를 광고할 수 있습니다. 이렇게 하면 core 카탈로그가 데이터 없는 상태를 유지합니다.

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
      "blurb": "Webhook 봇을 통한 자체 호스팅 채팅.",
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

- `detailLabel`: 더 풍부한 카탈로그/상태 표면을 위한 보조 레이블
- `docsLabel`: 문서 링크의 링크 텍스트 재정의
- `preferOver`: 이 카탈로그 항목이 우선해야 하는 더 낮은 우선순위의 plugin/channel id
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: 선택 표면 복사 제어
- `markdownCapable`: 아웃바운드 서식 결정 시 채널을 markdown 가능으로 표시
- `exposure.configured`: `false`로 설정하면 구성된 채널 목록 표면에서 채널 숨김
- `exposure.setup`: `false`로 설정하면 대화형 setup/configure picker에서 채널 숨김
- `exposure.docs`: 문서 탐색 표면에서 채널을 내부/비공개로 표시
- `showConfigured` / `showInSetup`: 호환성을 위해 레거시 별칭도 여전히 허용되지만 `exposure`를 우선하세요
- `quickstartAllowFrom`: 채널을 표준 빠른 시작 `allowFrom` 흐름에 opt-in
- `forceAccountBinding`: 계정이 하나뿐이어도 명시적 계정 바인딩 요구
- `preferSessionLookupForAnnounceTarget`: 알림 대상 확인 시 세션 lookup 우선

OpenClaw는 **외부 채널 카탈로그**(예: MPM
레지스트리 export)도 병합할 수 있습니다. 다음 위치 중 하나에 JSON 파일을 두세요:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

또는 `OPENCLAW_PLUGIN_CATALOG_PATHS`(또는 `OPENCLAW_MPM_CATALOG_PATHS`)를
하나 이상의 JSON 파일로 지정하세요(쉼표/세미콜론/`PATH` 구분). 각 파일에는
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`가 들어 있어야 합니다. 파서는 `"entries"` 키의 레거시 별칭으로 `"packages"` 또는 `"plugins"`도 허용합니다.

## 컨텍스트 엔진 plugins

컨텍스트 엔진 plugins는 수집, 조립,
Compaction을 위한 세션 컨텍스트 오케스트레이션을 소유합니다. plugin에서
`api.registerContextEngine(id, factory)`로 등록한 다음, 활성 엔진은
`plugins.slots.contextEngine`으로 선택하세요.

기본 컨텍스트
파이프라인을 단순히 memory 검색이나 hook으로 추가하는 것이 아니라 교체하거나 확장해야 할 때 사용하세요.

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

엔진이 Compaction 알고리즘을 **소유하지 않는다면**, `compact()`는
구현 상태로 유지하고 이를 명시적으로 위임하세요:

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

## 새 기능 추가

plugin에 현재 API에 맞지 않는 동작이 필요하다면, 비공개 직접 접근으로
plugin 시스템을 우회하지 마세요. 누락된 기능을 추가하세요.

권장 순서:

1. core 계약 정의
   core가 어떤 공유 동작을 소유해야 하는지 결정하세요: 정책, 대체 경로, config 병합,
   생명주기, 채널 대상 의미론, 런타임 helper 형태.
2. 타입이 있는 plugin 등록/런타임 표면 추가
   가장 작지만 유용한
   타입 기반 기능 표면으로 `OpenClawPluginApi` 및/또는 `api.runtime`를 확장하세요.
3. core + 채널/기능 소비자 연결
   채널과 기능 plugins는 vendor 구현을 직접 import하지 말고
   core를 통해 새 기능을 소비해야 합니다.
4. vendor 구현 등록
   그런 다음 vendor plugins가 그 기능에 백엔드를 등록합니다.
5. 계약 커버리지 추가
   시간이 지나도 소유권과 등록 형태가 명시적으로 유지되도록 테스트를 추가하세요.

이것이 OpenClaw가 하나의
provider 세계관에 하드코딩되지 않으면서도 분명한 방향성을 유지하는 방법입니다.
구체적인 파일 체크리스트와 동작 예시는 [기능 요리책](/ko/plugins/architecture)을 참조하세요.

### 기능 체크리스트

새 기능을 추가할 때 구현은 일반적으로 이 표면들을 함께 건드려야 합니다:

- `src/<capability>/types.ts`의 core 계약 타입
- `src/<capability>/runtime.ts`의 core runner/런타임 helper
- `src/plugins/types.ts`의 plugin API 등록 표면
- `src/plugins/registry.ts`의 plugin 레지스트리 연결
- 기능/채널 plugins가 이를 소비해야 할 때 `src/plugins/runtime/*`의 plugin 런타임 노출
- `src/test-utils/plugin-registration.ts`의 캡처/테스트 helper
- `src/plugins/contracts/registry.ts`의 소유권/계약 검증
- `docs/`의 운영자/plugin 문서

이 표면 중 하나가 빠져 있다면, 보통 이는 해당 기능이
아직 완전히 통합되지 않았다는 신호입니다.

### 기능 템플릿

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

// feature/channel plugins를 위한 공유 런타임 helper
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

계약 테스트 패턴:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

이렇게 하면 규칙이 단순하게 유지됩니다:

- core가 기능 계약 + 오케스트레이션을 소유함
- vendor plugins가 vendor 구현을 소유함
- 기능/채널 plugins가 런타임 helper를 소비함
- 계약 테스트가 소유권을 명시적으로 유지함
