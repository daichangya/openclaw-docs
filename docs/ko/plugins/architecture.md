---
read_when:
    - 네이티브 OpenClaw plugin을 빌드하거나 디버깅할 때
    - plugin capability 모델 또는 소유권 경계를 이해할 때
    - plugin 로드 파이프라인 또는 레지스트리 작업을 할 때
    - provider 런타임 hook 또는 channel plugin을 구현할 때
sidebarTitle: Internals
summary: 'Plugin 내부 구조: capability 모델, 소유권, 계약, 로드 파이프라인, 런타임 도우미'
title: Plugin 내부 구조
x-i18n:
    generated_at: "2026-04-08T02:19:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: c40ecf14e2a0b2b8d332027aed939cd61fb4289a489f4cd4c076c96d707d1138
    source_path: plugins/architecture.md
    workflow: 15
---

# Plugin 내부 구조

<Info>
  이것은 **심층 아키텍처 참고 자료**입니다. 실용적인 가이드는 다음을 참조하세요.
  - [plugin 설치 및 사용](/ko/tools/plugin) — 사용자 가이드
  - [시작하기](/ko/plugins/building-plugins) — 첫 plugin 튜토리얼
  - [Channel Plugins](/ko/plugins/sdk-channel-plugins) — 메시징 채널 빌드
  - [Provider Plugins](/ko/plugins/sdk-provider-plugins) — 모델 provider 빌드
  - [SDK 개요](/ko/plugins/sdk-overview) — import 맵과 등록 API
</Info>

이 페이지는 OpenClaw plugin 시스템의 내부 아키텍처를 다룹니다.

## 공개 capability 모델

Capabilities는 OpenClaw 내부의 공개 **네이티브 plugin** 모델입니다. 모든
네이티브 OpenClaw plugin은 하나 이상의 capability 유형에 대해 등록됩니다.

| Capability             | 등록 방법                                        | 예시 plugin                         |
| ---------------------- | ------------------------------------------------ | ----------------------------------- |
| 텍스트 추론            | `api.registerProvider(...)`                      | `openai`, `anthropic`               |
| CLI 추론 백엔드        | `api.registerCliBackend(...)`                    | `openai`, `anthropic`               |
| 음성                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`           |
| 실시간 전사            | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                            |
| 실시간 음성            | `api.registerRealtimeVoiceProvider(...)`         | `openai`                            |
| 미디어 이해            | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                  |
| 이미지 생성            | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 음악 생성              | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                 |
| 비디오 생성            | `api.registerVideoGenerationProvider(...)`       | `qwen`                              |
| 웹 가져오기            | `api.registerWebFetchProvider(...)`              | `firecrawl`                         |
| 웹 검색                | `api.registerWebSearchProvider(...)`             | `google`                            |
| 채널 / 메시징          | `api.registerChannel(...)`                       | `msteams`, `matrix`                 |

capability를 하나도 등록하지 않지만 hook, tool 또는
service를 제공하는 plugin은 **레거시 hook-only** plugin입니다. 이 패턴도 여전히 완전히 지원됩니다.

### 외부 호환성 입장

capability 모델은 이미 core에 반영되어 오늘날 번들/네이티브 plugin에서
사용되고 있지만, 외부 plugin 호환성에는 여전히 "export되었으니 고정되었다"보다
더 엄격한 기준이 필요합니다.

현재 가이드는 다음과 같습니다.

- **기존 외부 plugin:** hook 기반 통합이 계속 동작하도록 유지하고,
  이를 호환성 기준선으로 취급
- **새 번들/네이티브 plugin:** 벤더별 직접 접근이나 새로운 hook-only 설계보다
  명시적 capability 등록을 우선
- **capability 등록을 채택하는 외부 plugin:** 허용되지만, 문서에서 계약이 안정적이라고
  명시하지 않는 한 capability별 helper 표면은 진화 중인 것으로 취급

실용적인 규칙:

- capability 등록 API가 의도된 방향입니다
- 전환 기간 동안 레거시 hook은 외부 plugin에 가장 안전한 무중단 경로로 남습니다
- export된 helper subpath가 모두 같은 것은 아닙니다. 우연히 노출된 helper export가 아니라
  문서화된 좁은 계약을 우선하세요

### Plugin 형태

OpenClaw는 로드된 모든 plugin을 정적 메타데이터가 아니라 실제
등록 동작에 따라 형태로 분류합니다.

- **plain-capability** -- 정확히 하나의 capability 유형만 등록함(예:
  `mistral` 같은 provider 전용 plugin)
- **hybrid-capability** -- 여러 capability 유형을 등록함(예:
  `openai`는 텍스트 추론, 음성, 미디어 이해, 이미지 생성을 소유)
- **hook-only** -- hook만 등록하며(정형 또는 커스텀), capability,
  tool, command, service는 등록하지 않음
- **non-capability** -- tool, command, service, route는 등록하지만
  capability는 등록하지 않음

plugin의 형태와 capability 분해 정보는 `openclaw plugins inspect <id>`로 확인하세요.
자세한 내용은 [CLI reference](/cli/plugins#inspect)를 참조하세요.

### 레거시 hook

`before_agent_start` hook은 여전히 hook-only plugin을 위한
호환성 경로로 지원됩니다. 실제 레거시 plugin이 여전히 이에 의존합니다.

방향은 다음과 같습니다.

- 계속 동작하도록 유지
- 레거시로 문서화
- 모델/provider override 작업에는 `before_model_resolve`를 우선
- 프롬프트 변경 작업에는 `before_prompt_build`를 우선
- 실제 사용이 줄고 fixture 커버리지가 마이그레이션 안전성을 입증한 뒤에만 제거

### 호환성 신호

`openclaw doctor` 또는 `openclaw plugins inspect <id>`를 실행하면
다음 레이블 중 하나를 볼 수 있습니다.

| 신호                       | 의미                                                          |
| -------------------------- | ------------------------------------------------------------- |
| **config valid**           | 구성이 잘 파싱되고 plugin이 해석됨                            |
| **compatibility advisory** | plugin이 지원되지만 오래된 패턴을 사용함(예: `hook-only`)     |
| **legacy warning**         | plugin이 더 이상 권장되지 않는 `before_agent_start`를 사용함  |
| **hard error**             | 구성이 잘못되었거나 plugin 로드에 실패함                      |

`hook-only`와 `before_agent_start`는 현재 plugin을 깨뜨리지 않습니다 --
`hook-only`는 권고 수준이고, `before_agent_start`는 경고만 발생시킵니다. 이러한
신호는 `openclaw status --all`과 `openclaw plugins doctor`에도 표시됩니다.

## 아키텍처 개요

OpenClaw의 plugin 시스템에는 네 개의 계층이 있습니다.

1. **매니페스트 + 발견**
   OpenClaw는 구성된 경로, workspace 루트,
   전역 확장 루트, 번들 확장에서 후보 plugin을 찾습니다. 발견 과정은 먼저 네이티브
   `openclaw.plugin.json` 매니페스트와 지원되는 번들 매니페스트를 읽습니다.
2. **활성화 + 검증**
   Core는 발견된 plugin이 활성화, 비활성화, 차단,
   또는 memory 같은 독점 슬롯에 선택되었는지 결정합니다.
3. **런타임 로딩**
   네이티브 OpenClaw plugin은 jiti를 통해 프로세스 내부에서 로드되어
   중앙 레지스트리에 capability를 등록합니다. 호환 번들은
   런타임 코드를 import하지 않고 레지스트리 레코드로 정규화됩니다.
4. **표면 소비**
   OpenClaw의 나머지 부분은 레지스트리를 읽어 tool, 채널, provider
   설정, hook, HTTP route, CLI command, service를 노출합니다.

특히 plugin CLI의 경우 루트 command 발견은 두 단계로 나뉩니다.

- 파싱 시점 메타데이터는 `registerCli(..., { descriptors: [...] })`에서 옴
- 실제 plugin CLI 모듈은 지연 로드된 상태를 유지하다가 첫 호출 시 등록될 수 있음

이렇게 하면 plugin 소유 CLI 코드를 plugin 내부에 두면서도 OpenClaw가
파싱 전에 루트 command 이름을 예약할 수 있습니다.

중요한 설계 경계:

- 발견 + 구성 검증은 plugin 코드를 실행하지 않고 **매니페스트/스키마 메타데이터**로
  동작해야 합니다
- 네이티브 런타임 동작은 plugin 모듈의 `register(api)` 경로에서 옵니다

이 분리를 통해 OpenClaw는 전체 런타임이 활성화되기 전에
구성을 검증하고, 누락/비활성화된 plugin을 설명하며, UI/스키마 힌트를
구성할 수 있습니다.

### Channel plugin과 공유 message tool

Channel plugin은 일반 채팅 작업을 위해 별도의 send/edit/react tool을
등록할 필요가 없습니다. OpenClaw는 core에 하나의 공유 `message` tool을 유지하고,
channel plugin은 그 뒤의 채널별 발견 및 실행을 소유합니다.

현재 경계는 다음과 같습니다.

- core는 공유 `message` tool 호스트, 프롬프트 연결, 세션/스레드
  기록 유지, 실행 디스패치를 소유
- channel plugin은 범위 지정된 작업 발견, capability 발견, 채널별 스키마 조각을 소유
- channel plugin은 대화 id가 스레드 id를 어떻게 인코딩하거나 부모 대화에서 상속하는지 같은
  provider별 세션 대화 문법을 소유
- channel plugin은 자신의 작업 adapter를 통해 최종 작업을 실행

channel plugin의 SDK 표면은
`ChannelMessageActionAdapter.describeMessageTool(...)`입니다. 이 통합 발견
호출을 통해 plugin은 표시 가능한 작업, capability, 스키마 기여를
함께 반환할 수 있으므로 이 조각들이 서로 어긋나지 않습니다.

Core는 그 발견 단계에 런타임 범위를 전달합니다. 중요한 필드는 다음과 같습니다.

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 신뢰된 인바운드 `requesterSenderId`

이것은 컨텍스트 민감 plugin에 중요합니다. 채널은 core `message` tool에
채널별 분기를 하드코딩하지 않고도 활성 계정, 현재 방/스레드/메시지,
또는 신뢰된 요청자 ID에 따라 메시지 작업을 숨기거나 노출할 수 있습니다.

이 때문에 내장 러너 라우팅 변경은 여전히 plugin 작업입니다. 러너는
현재 턴에 맞는 채널 소유 표면을 공유 `message` tool이 노출하도록
현재 채팅/세션 ID를 plugin 발견 경계로 전달할 책임이 있습니다.

채널 소유 실행 helper의 경우 번들 plugin은 실행
런타임을 자신의 확장 모듈 내부에 유지해야 합니다. Core는 더 이상 Discord,
Slack, Telegram, WhatsApp 메시지 작업 런타임을 `src/agents/tools`
아래에서 소유하지 않습니다. 별도의 `plugin-sdk/*-action-runtime` subpath는
게시하지 않으며, 번들 plugin은 자신의 로컬 런타임 코드를
확장 소유 모듈에서 직접 import해야 합니다.

같은 경계는 일반적인 provider 이름이 붙은 SDK seam에도 적용됩니다. Core는
Slack, Discord, Signal, WhatsApp 또는 유사한 확장의 채널별 편의 barrel을
import해서는 안 됩니다. Core에 어떤 동작이 필요하다면 번들 plugin 자체의
`api.ts` / `runtime-api.ts` barrel을 소비하거나, 그 필요를
공유 SDK의 좁은 일반 capability로 승격해야 합니다.

특히 poll에는 두 가지 실행 경로가 있습니다.

- `outbound.sendPoll`은 공통 poll 모델에 맞는 채널을 위한 공유 기준선
- `actions.handleAction("poll")`은 채널별 poll 의미론 또는 추가 poll 파라미터를 위한
  선호 경로

Core는 이제 plugin poll 디스패치가 작업을 거절한 뒤에야 공유 poll 파싱을
연기하므로, plugin 소유 poll 핸들러는 일반 poll 파서에 먼저 막히지 않고
채널별 poll 필드를 수용할 수 있습니다.

전체 시작 순서는 [로드 파이프라인](#load-pipeline)을 참조하세요.

## capability 소유권 모델

OpenClaw는 네이티브 plugin을 관련 없는 통합의 묶음이 아니라 **회사** 또는
**기능**의 소유권 경계로 취급합니다.

이는 다음을 의미합니다.

- 회사 plugin은 일반적으로 해당 회사의 OpenClaw 표면 전체를 소유해야 합니다
- 기능 plugin은 일반적으로 자신이 도입하는 전체 기능 표면을 소유해야 합니다
- 채널은 provider 동작을 임시방편으로 재구현하기보다 공유 core capability를 소비해야 합니다

예시:

- 번들 `openai` plugin은 OpenAI 모델 provider 동작과 OpenAI
  음성 + 실시간 음성 + 미디어 이해 + 이미지 생성 동작을 소유
- 번들 `elevenlabs` plugin은 ElevenLabs 음성 동작을 소유
- 번들 `microsoft` plugin은 Microsoft 음성 동작을 소유
- 번들 `google` plugin은 Google 모델 provider 동작과 함께 Google
  미디어 이해 + 이미지 생성 + 웹 검색 동작을 소유
- 번들 `firecrawl` plugin은 Firecrawl 웹 가져오기 동작을 소유
- 번들 `minimax`, `mistral`, `moonshot`, `zai` plugin은 자신의
  미디어 이해 백엔드를 소유
- 번들 `qwen` plugin은 Qwen 텍스트 provider 동작과 함께
  미디어 이해 및 비디오 생성 동작을 소유
- `voice-call` plugin은 기능 plugin입니다. 이 plugin은 통화 transport, tool,
  CLI, route, Twilio 미디어 스트림 브리징을 소유하지만, 벤더 plugin을 직접 import하는 대신
  공유 음성과 실시간 전사/실시간 음성 capability를 소비합니다

의도된 최종 상태는 다음과 같습니다.

- OpenAI는 텍스트 모델, 음성, 이미지, 향후 비디오를 아우르더라도 하나의 plugin에 존재
- 다른 벤더도 자신의 표면 영역에 대해 같은 방식을 취할 수 있음
- 채널은 어떤 벤더 plugin이 provider를 소유하는지 신경 쓰지 않고, core가 노출하는
  공유 capability 계약을 소비

이것이 핵심 구분입니다.

- **plugin** = 소유권 경계
- **capability** = 여러 plugin이 구현하거나 소비할 수 있는 core 계약

따라서 OpenClaw가 비디오 같은 새로운 도메인을 추가할 때 첫 질문은
"어떤 provider가 비디오 처리를 하드코딩해야 하는가?"가 아닙니다. 첫 질문은
"core 비디오 capability 계약이 무엇인가?"입니다. 그 계약이 존재하면 벤더 plugin은
그에 대해 등록할 수 있고, 채널/기능 plugin은 그것을 소비할 수 있습니다.

capability가 아직 존재하지 않는다면 일반적으로 올바른 조치는 다음과 같습니다.

1. core에서 누락된 capability를 정의
2. 그것을 plugin API/런타임을 통해 정형 방식으로 노출
3. 채널/기능을 그 capability에 맞게 연결
4. 벤더 plugin이 구현을 등록하게 함

이렇게 하면 소유권이 명시적으로 유지되면서도
단일 벤더 또는 일회성 plugin별 코드 경로에 의존하는 core 동작을 피할 수 있습니다.

### Capability 계층

코드가 어디에 속하는지 결정할 때 다음과 같이 생각하세요.

- **core capability 계층**: 공유 오케스트레이션, 정책, fallback, config
  병합 규칙, 전달 의미론, 정형 계약
- **벤더 plugin 계층**: 벤더별 API, 인증, 모델 카탈로그, 음성
  합성, 이미지 생성, 향후 비디오 백엔드, 사용량 엔드포인트
- **채널/기능 plugin 계층**: Slack/Discord/voice-call 등 통합으로
  core capability를 소비해 표면에 제시

예를 들어 TTS는 다음 형태를 따릅니다.

- core는 응답 시점 TTS 정책, fallback 순서, 환경설정, 채널 전달을 소유
- `openai`, `elevenlabs`, `microsoft`는 합성 구현을 소유
- `voice-call`은 전화용 TTS 런타임 helper를 소비

향후 capability에도 같은 패턴을 우선해야 합니다.

### 다중 capability 회사 plugin 예시

회사 plugin은 외부에서 볼 때 응집된 느낌이어야 합니다. OpenClaw에 모델, 음성,
실시간 전사, 실시간 음성, 미디어 이해, 이미지 생성, 비디오 생성, 웹 가져오기, 웹 검색을 위한
공유 계약이 있다면, 한 벤더는 모든 표면을 한 곳에서 소유할 수 있습니다.

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
      // vendor speech config — SpeechProviderPlugin 인터페이스를 직접 구현
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

중요한 것은 정확한 helper 이름이 아닙니다. 중요한 것은 형태입니다.

- 하나의 plugin이 벤더 표면을 소유
- core는 여전히 capability 계약을 소유
- 채널과 기능 plugin은 벤더 코드가 아니라 `api.runtime.*` helper를 소비
- 계약 테스트는 plugin이 자신이 소유한다고 주장하는 capability를 등록했는지 검증할 수 있음

### Capability 예시: 비디오 이해

OpenClaw는 이미 이미지/오디오/비디오 이해를 하나의 공유
capability로 취급합니다. 동일한 소유권 모델이 여기에 적용됩니다.

1. core가 media-understanding 계약을 정의
2. 벤더 plugin이 해당하는 경우 `describeImage`, `transcribeAudio`,
   `describeVideo`를 등록
3. 채널과 기능 plugin은 벤더 코드에 직접 연결하지 않고 공유 core 동작을 소비

이렇게 하면 특정 provider의 비디오 가정을 core에 고정하지 않게 됩니다. plugin이
벤더 표면을 소유하고, core는 capability 계약과 fallback 동작을 소유합니다.

비디오 생성도 이미 같은 순서를 따릅니다. core가 정형
capability 계약과 런타임 helper를 소유하고, 벤더 plugin이
`api.registerVideoGenerationProvider(...)` 구현을 등록합니다.

구체적인 출시 체크리스트가 필요하신가요? [Capability Cookbook](/ko/plugins/architecture)을
참조하세요.

## 계약과 강제

plugin API 표면은 의도적으로 `OpenClawPluginApi`에 정형화되어 중앙화되어 있습니다.
이 계약은 지원되는 등록 지점과 plugin이 의존할 수 있는 런타임 helper를 정의합니다.

이것이 중요한 이유:

- plugin 작성자는 하나의 안정적인 내부 표준을 얻음
- core는 두 plugin이 같은 provider id를 등록하는 것 같은 중복 소유권을 거부할 수 있음
- 시작 시 잘못된 등록에 대해 실행 가능한 진단을 표시할 수 있음
- 계약 테스트는 번들 plugin 소유권을 강제하고 조용한 드리프트를 방지할 수 있음

강제에는 두 계층이 있습니다.

1. **런타임 등록 강제**
   plugin 레지스트리는 plugin 로드 중 등록을 검증합니다. 예:
   중복 provider id, 중복 speech provider id, 잘못된
   등록은 정의되지 않은 동작 대신 plugin 진단을 생성합니다.
2. **계약 테스트**
   번들 plugin은 테스트 실행 중 계약 레지스트리에 캡처되므로
   OpenClaw는 소유권을 명시적으로 검증할 수 있습니다. 현재 이는 모델
   provider, speech provider, web search provider, 번들 등록
   소유권에 사용됩니다.

실질적인 효과는 OpenClaw가 어떤 plugin이 어떤 표면을 소유하는지
미리 안다는 점입니다. 이것은 소유권이 암묵적인 것이 아니라 선언되고,
정형화되며, 테스트 가능하므로 core와 채널이 매끄럽게 조합될 수 있게 합니다.

### 계약에 포함되어야 할 것

좋은 plugin 계약은 다음과 같습니다.

- 정형화됨
- 작음
- capability별
- core가 소유
- 여러 plugin이 재사용 가능
- 채널/기능이 벤더 지식 없이 소비 가능

나쁜 plugin 계약은 다음과 같습니다.

- core에 숨겨진 벤더별 정책
- 레지스트리를 우회하는 일회성 plugin 탈출구
- 채널 코드가 벤더 구현에 مباشرة로 접근
- `OpenClawPluginApi` 또는 `api.runtime`의 일부가 아닌 임시 런타임 객체

확실하지 않다면 추상화 수준을 올리세요. 먼저 capability를 정의하고,
그다음 plugin이 거기에 연결되게 하세요.

## 실행 모델

네이티브 OpenClaw plugin은 Gateway와 **같은 프로세스 내부**에서 실행됩니다. 샌드박스되지
않습니다. 로드된 네이티브 plugin은 core 코드와 동일한 프로세스 수준 신뢰 경계를 가집니다.

영향:

- 네이티브 plugin은 tool, 네트워크 핸들러, hook, service를 등록할 수 있음
- 네이티브 plugin 버그는 gateway를 크래시시키거나 불안정하게 만들 수 있음
- 악성 네이티브 plugin은 OpenClaw 프로세스 내부의 임의 코드 실행과 동일함

호환 번들은 현재 OpenClaw가 이를 메타데이터/콘텐츠 팩으로 취급하므로
기본적으로 더 안전합니다. 현재 릴리스에서 이는 주로 번들
Skills를 의미합니다.

비번들 plugin에는 allowlist와 명시적 설치/로드 경로를 사용하세요. Workspace plugin은
프로덕션 기본값이 아니라 개발 시점 코드로 취급하세요.

번들 workspace 패키지 이름의 경우 plugin id가 npm
이름에 고정되도록 유지하세요. 기본은 `@openclaw/<id>`이며, 또는
패키지가 의도적으로 더 좁은 plugin 역할을 노출할 때
`-provider`, `-plugin`, `-speech`, `-sandbox`, `-media-understanding` 같은
승인된 typed suffix를 사용합니다.

중요한 신뢰 참고 사항:

- `plugins.allow`는 소스 출처가 아니라 **plugin id**를 신뢰합니다.
- 번들 plugin과 같은 id를 가진 workspace plugin은, 그 workspace plugin이 활성화/허용 목록에 있으면,
  의도적으로 번들 복사본을 가립니다.
- 이는 로컬 개발, 패치 테스트, 핫픽스에 정상적이고 유용합니다.

## export 경계

OpenClaw는 구현 편의성이 아니라 capability를 export합니다.

capability 등록은 공개 상태로 유지하세요. 계약이 아닌 helper export는 줄이세요.

- 번들 plugin 전용 helper subpath
- 공개 API가 아닌 런타임 배관 subpath
- 벤더별 편의 helper
- 구현 세부 사항인 설정/온보딩 helper

일부 번들 plugin helper subpath는 호환성과 번들 plugin 유지보수를 위해
생성된 SDK export 맵에 여전히 남아 있습니다. 현재 예시로는
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, 여러 `plugin-sdk/matrix*` seam이 있습니다. 이들은
새로운 서드파티 plugin을 위한 권장 SDK 패턴이 아니라
예약된 구현 세부 export로 취급하세요.

## 로드 파이프라인

시작 시 OpenClaw는 대략 다음을 수행합니다.

1. 후보 plugin 루트를 발견
2. 네이티브 또는 호환 번들 매니페스트와 패키지 메타데이터를 읽음
3. 안전하지 않은 후보를 거부
4. plugin 구성(`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)을 정규화
5. 각 후보의 활성화 여부를 결정
6. 활성화된 네이티브 모듈을 jiti로 로드
7. 네이티브 `register(api)`(또는 레거시 별칭 `activate(api)`) hook을 호출하고 등록을 plugin 레지스트리에 수집
8. 레지스트리를 command/런타임 표면에 노출

<Note>
`activate`는 `register`의 레거시 별칭입니다 — 로더는 존재하는 쪽(`def.register ?? def.activate`)을 해석하고 같은 시점에 호출합니다. 모든 번들 plugin은 `register`를 사용합니다. 새 plugin에는 `register`를 우선하세요.
</Note>

안전 게이트는 런타임 실행 **이전**에 발생합니다. 엔트리가 plugin 루트 밖으로 벗어나거나,
경로가 world-writable이거나, 비번들 plugin에 대해 경로 소유권이
의심스러워 보이면 후보는 차단됩니다.

### 매니페스트 우선 동작

매니페스트는 컨트롤 플레인 소스 오브 트루스입니다. OpenClaw는 이를 사용해 다음을 수행합니다.

- plugin 식별
- 선언된 채널/Skills/config 스키마 또는 번들 capability 발견
- `plugins.entries.<id>.config` 검증
- Control UI 라벨/placeholder 보강
- 설치/카탈로그 메타데이터 표시

네이티브 plugin의 경우 런타임 모듈은 데이터 플레인 부분입니다. 이것이
hook, tool, command, provider 흐름 같은 실제 동작을 등록합니다.

### 로더가 캐시하는 것

OpenClaw는 짧은 수명의 프로세스 내 캐시를 유지합니다.

- 발견 결과
- 매니페스트 레지스트리 데이터
- 로드된 plugin 레지스트리

이 캐시는 시작 급증과 반복 command 오버헤드를 줄여 줍니다. 이것은
영속성이 아니라 짧은 수명의 성능 캐시로 생각하면 안전합니다.

성능 참고:

- 이 캐시를 비활성화하려면 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 또는
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`을 설정하세요.
- `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS`와
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`로 캐시 시간 창을 조정하세요.

## 레지스트리 모델

로드된 plugin은 임의의 core 전역 상태를 직접 변경하지 않습니다. 대신
중앙 plugin 레지스트리에 등록합니다.

레지스트리는 다음을 추적합니다.

- plugin 레코드(정체성, 소스, 출처, 상태, 진단)
- tools
- 레거시 hook과 정형 hook
- channels
- providers
- gateway RPC 핸들러
- HTTP routes
- CLI registrars
- 백그라운드 services
- plugin 소유 commands

그다음 core 기능은 plugin 모듈과 직접 대화하는 대신 그 레지스트리를 읽습니다.
이렇게 하면 로딩이 한 방향으로 유지됩니다.

- plugin 모듈 -> 레지스트리 등록
- core 런타임 -> 레지스트리 소비

이 분리는 유지보수성에 중요합니다. 대부분의 core 표면이
"모든 plugin 모듈을 특별 취급"이 아니라 "레지스트리를 읽기"라는
하나의 통합 지점만 필요하게 됩니다.

## 대화 바인딩 콜백

대화를 바인딩하는 plugin은 승인이 해결되었을 때 반응할 수 있습니다.

바인드 요청이 승인되거나 거부된 후 콜백을 받으려면
`api.onConversationBindingResolved(...)`를 사용하세요.

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // 이제 이 plugin + 대화에 대한 바인딩이 존재합니다.
        console.log(event.binding?.conversationId);
        return;
      }

      // 요청이 거부되었습니다. 로컬 pending 상태를 정리합니다.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

콜백 페이로드 필드:

- `status`: `"approved"` 또는 `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, 또는 `"deny"`
- `binding`: 승인된 요청에 대한 해석된 바인딩
- `request`: 원래 요청 요약, detach 힌트, sender id, 대화 메타데이터

이 콜백은 알림 전용입니다. 누가 대화를 바인딩할 수 있는지를 바꾸지 않으며,
core 승인 처리가 끝난 뒤 실행됩니다.

## Provider 런타임 hook

Provider plugin은 이제 두 계층을 가집니다.

- 매니페스트 메타데이터: 런타임 로드 전 저비용 provider env-auth 조회용 `providerAuthEnvVars`,
  런타임 로드 전 저비용 채널 env/setup 조회용 `channelEnvVars`,
  런타임 로드 전 저비용 온보딩/auth-choice
  라벨과 CLI 플래그 메타데이터용 `providerAuthChoices`
- 구성 시점 hook: `catalog` / 레거시 `discovery` 와 `applyConfigDefaults`
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
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw는 여전히 일반 agent 루프, failover, transcript 처리, tool 정책을
소유합니다. 이러한 hook은
전체 커스텀 추론 transport 없이 provider별 동작을 확장하기 위한 표면입니다.

provider가 env 기반 자격 증명을 가지고 있어 일반 auth/status/model-picker 경로가
plugin 런타임 로드 없이도 이를 볼 수 있어야 한다면 매니페스트 `providerAuthEnvVars`를 사용하세요.
온보딩/auth-choice CLI 표면이 provider의 choice id,
그룹 라벨, 단순한 단일 플래그 인증 배선을 런타임 로드 없이 알아야 한다면
매니페스트 `providerAuthChoices`를 사용하세요. 온보딩 라벨 또는 OAuth
client-id/client-secret 설정 변수 같은 운영자 대상 힌트에는 provider 런타임
`envVars`를 유지하세요.

채널에 env 기반 인증 또는 설정이 있어 일반 shell-env fallback,
config/status 검사, 설정 프롬프트가 채널 런타임 로드 없이도 이를 볼 수 있어야 한다면
매니페스트 `channelEnvVars`를 사용하세요.

### Hook 순서와 사용법

모델/provider plugin의 경우 OpenClaw는 대략 다음 순서로 hook을 호출합니다.
"언제 사용해야 하는가" 열은 빠른 결정 가이드입니다.

| #   | Hook                              | 수행 작업                                                                                                      | 사용 시점                                                                                                                                   |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 생성 중 provider 구성을 `models.providers`에 게시                                                | provider가 카탈로그 또는 base URL 기본값을 소유할 때                                                                                        |
| 2   | `applyConfigDefaults`             | 구성 구체화 중 provider 소유 전역 기본값 적용                                                                  | 기본값이 인증 모드, env 또는 provider 모델 계열 의미론에 따라 달라질 때                                                                    |
| --  | _(내장 모델 조회)_                | OpenClaw가 먼저 일반 레지스트리/카탈로그 경로를 시도                                                           | _(plugin hook 아님)_                                                                                                                        |
| 3   | `normalizeModelId`                | 조회 전 레거시 또는 preview 모델-id 별칭 정규화                                                                | provider가 정식 모델 해석 전 별칭 정리를 소유할 때                                                                                          |
| 4   | `normalizeTransport`              | 일반 모델 조립 전 provider 계열 `api` / `baseUrl` 정규화                                                      | provider가 같은 transport 계열의 custom provider id에 대한 transport 정리를 소유할 때                                                      |
| 5   | `normalizeConfig`                 | 런타임/provider 해석 전 `models.providers.<id>` 정규화                                                        | provider에 속해야 하는 config 정리가 필요할 때; 번들 Google 계열 helper도 지원되는 Google config 항목을 백스톱으로 정리함                |
| 6   | `applyNativeStreamingUsageCompat` | config provider에 네이티브 streaming-usage compat 재작성 적용                                                 | provider가 엔드포인트 기반 네이티브 streaming usage 메타데이터 수정이 필요할 때                                                            |
| 7   | `resolveConfigApiKey`             | 런타임 auth 로딩 전 config provider의 env-marker auth 해석                                                     | provider가 provider 소유 env-marker API-key 해석을 가질 때; `amazon-bedrock`도 여기에 내장 AWS env-marker 해석기를 가짐                  |
| 8   | `resolveSyntheticAuth`            | 평문 저장 없이 local/self-hosted 또는 config 기반 auth를 표면화                                               | provider가 synthetic/local 자격 증명 마커로 동작할 수 있을 때                                                                              |
| 9   | `resolveExternalAuthProfiles`     | provider 소유 외부 auth profile을 오버레이; 기본 `persistence`는 CLI/앱 소유 자격 증명에 대해 `runtime-only` | provider가 복사된 refresh token을 저장하지 않고 외부 auth 자격 증명을 재사용할 때                                                          |
| 10  | `shouldDeferSyntheticProfileAuth` | 저장된 synthetic profile placeholder의 우선순위를 env/config 기반 auth보다 낮춤                               | provider가 synthetic placeholder profile을 저장하며 이것이 우선 순위를 가져서는 안 될 때                                                   |
| 11  | `resolveDynamicModel`             | 아직 로컬 레지스트리에 없는 provider 소유 모델 id에 대한 동기 fallback                                        | provider가 임의 업스트림 모델 id를 허용할 때                                                                                                 |
| 12  | `prepareDynamicModel`             | 비동기 워밍업 후 `resolveDynamicModel`을 다시 실행                                                             | provider가 알 수 없는 id를 해석하기 전에 네트워크 메타데이터가 필요할 때                                                                    |
| 13  | `normalizeResolvedModel`          | 내장 러너가 해석된 모델을 사용하기 전 최종 재작성                                                              | provider가 transport를 재작성해야 하지만 여전히 core transport를 사용할 때                                                                  |
| 14  | `contributeResolvedModelCompat`   | 다른 호환 transport 뒤의 벤더 모델에 compat 플래그 기여                                                       | provider가 provider를 인수하지 않고 프록시 transport에서 자신의 모델을 인식할 때                                                           |
| 15  | `capabilities`                    | 공유 core 로직에서 사용하는 provider 소유 transcript/tooling 메타데이터                                       | provider가 transcript/provider-family 특이사항이 필요할 때                                                                                  |
| 16  | `normalizeToolSchemas`            | 내장 러너가 보기 전에 tool schema 정규화                                                                       | provider가 transport 계열 schema 정리가 필요할 때                                                                                           |
| 17  | `inspectToolSchemas`              | 정규화 후 provider 소유 schema 진단 노출                                                                       | provider가 core에 provider별 규칙을 가르치지 않고 키워드 경고를 원할 때                                                                    |
| 18  | `resolveReasoningOutputMode`      | 네이티브 대 태그 기반 reasoning-output 계약 선택                                                               | provider가 네이티브 필드 대신 태그 기반 reasoning/final output이 필요할 때                                                                 |
| 19  | `prepareExtraParams`              | 일반 stream 옵션 래퍼 전에 요청 파라미터 정규화                                                                | provider가 기본 요청 파라미터 또는 provider별 파라미터 정리가 필요할 때                                                                    |
| 20  | `createStreamFn`                  | 일반 stream 경로를 완전히 custom transport로 대체                                                              | provider가 래퍼만이 아니라 custom wire protocol이 필요할 때                                                                                 |
| 21  | `wrapStreamFn`                    | 일반 래퍼 적용 후 stream 래퍼                                                                                  | provider가 custom transport 없이 요청 헤더/본문/모델 compat 래퍼가 필요할 때                                                              |
| 22  | `resolveTransportTurnState`       | 네이티브 턴별 transport 헤더 또는 메타데이터 첨부                                                              | provider가 일반 transport가 provider 네이티브 turn identity를 보내길 원할 때                                                              |
| 23  | `resolveWebSocketSessionPolicy`   | 네이티브 WebSocket 헤더 또는 세션 쿨다운 정책 첨부                                                             | provider가 일반 WS transport의 세션 헤더 또는 fallback 정책을 조정하길 원할 때                                                             |
| 24  | `formatApiKey`                    | auth-profile formatter: 저장된 profile이 런타임 `apiKey` 문자열이 됨                                           | provider가 추가 auth 메타데이터를 저장하고 custom 런타임 토큰 형태가 필요할 때                                                            |
| 25  | `refreshOAuth`                    | custom refresh 엔드포인트 또는 refresh 실패 정책을 위한 OAuth refresh override                                | provider가 공유 `pi-ai` refresher에 맞지 않을 때                                                                                            |
| 26  | `buildAuthDoctorHint`             | OAuth refresh 실패 시 추가되는 복구 힌트                                                                       | provider가 refresh 실패 후 provider 소유 auth 복구 안내가 필요할 때                                                                        |
| 27  | `matchesContextOverflowError`     | provider 소유 context-window overflow 매처                                                                     | provider에 일반 휴리스틱이 놓치는 raw overflow 오류가 있을 때                                                                              |
| 28  | `classifyFailoverReason`          | provider 소유 failover 이유 분류                                                                               | provider가 raw API/transport 오류를 rate-limit/overload 등으로 매핑할 수 있을 때                                                           |
| 29  | `isCacheTtlEligible`              | 프록시/백홀 provider용 prompt-cache 정책                                                                       | provider에 프록시별 cache TTL 게이팅이 필요할 때                                                                                            |
| 30  | `buildMissingAuthMessage`         | 일반 missing-auth 복구 메시지 대체                                                                             | provider가 provider별 missing-auth 복구 힌트가 필요할 때                                                                                   |
| 31  | `suppressBuiltInModel`            | 오래된 업스트림 모델 숨김과 선택적 사용자 대상 오류 힌트                                                       | provider가 오래된 업스트림 행을 숨기거나 벤더 힌트로 대체해야 할 때                                                                        |
| 32  | `augmentModelCatalog`             | 발견 후 synthetic/final 카탈로그 행 추가                                                                      | provider가 `models list`와 picker에 synthetic 전방 호환 행이 필요할 때                                                                     |
| 33  | `isBinaryThinking`                | 이진 thinking provider용 on/off reasoning 토글                                                                 | provider가 이진 thinking on/off만 노출할 때                                                                                                |
| 34  | `supportsXHighThinking`           | 선택된 모델에 대한 `xhigh` reasoning 지원                                                                      | provider가 일부 모델에만 `xhigh`를 원할 때                                                                                                  |
| 35  | `resolveDefaultThinkingLevel`     | 특정 모델 계열에 대한 기본 `/think` 수준                                                                       | provider가 모델 계열의 기본 `/think` 정책을 소유할 때                                                                                      |
| 36  | `isModernModelRef`                | live profile 필터와 smoke 선택을 위한 최신 모델 매처                                                           | provider가 live/smoke 선호 모델 매칭을 소유할 때                                                                                           |
| 37  | `prepareRuntimeAuth`              | 추론 직전 구성된 자격 증명을 실제 런타임 토큰/키로 교환                                                       | provider가 토큰 교환 또는 짧은 수명의 요청 자격 증명이 필요할 때                                                                           |
| 38  | `resolveUsageAuth`                | `/usage` 및 관련 상태 표면을 위한 사용량/청구 자격 증명 해석                                                  | provider에 custom usage/quota 토큰 파싱 또는 다른 usage 자격 증명이 필요할 때                                                             |
| 39  | `fetchUsageSnapshot`              | auth 해석 후 provider별 사용량/할당량 snapshot을 가져오고 정규화                                              | provider에 provider별 사용량 엔드포인트 또는 페이로드 파서가 필요할 때                                                                     |
| 40  | `createEmbeddingProvider`         | memory/search용 provider 소유 임베딩 adapter 빌드                                                              | 메모리 임베딩 동작이 provider plugin에 속해야 할 때                                                                                        |
| 41  | `buildReplayPolicy`               | provider의 transcript 처리 제어 replay 정책 반환                                                               | provider가 custom transcript 정책(예: thinking-block 제거)이 필요할 때                                                                     |
| 42  | `sanitizeReplayHistory`           | 일반 transcript 정리 후 replay history 재작성                                                                  | provider에 공유 compaction helper를 넘어서는 provider별 replay 재작성이 필요할 때                                                         |
| 43  | `validateReplayTurns`             | 내장 러너 전 최종 replay-turn 검증 또는 재구성                                                                 | provider transport에 일반 정리 후 더 엄격한 turn 검증이 필요할 때                                                                          |
| 44  | `onModelSelected`                 | provider 소유 선택 후 부작용 실행                                                                              | provider가 모델 활성화 시 텔레메트리 또는 provider 소유 상태가 필요할 때                                                                   |

`normalizeModelId`, `normalizeTransport`, `normalizeConfig`는 먼저 일치한
provider plugin을 확인한 뒤, 모델 id 또는 transport/config를 실제로
변경하는 hook 가능 provider plugin이 나올 때까지 다른 plugin으로 넘어갑니다. 이는
호출자가 어떤 번들 plugin이 재작성을 소유하는지 알 필요 없이
별칭/compat provider shim이 계속 동작하도록 합니다. 어떤 provider hook도
지원되는 Google 계열 config 항목을 재작성하지 않으면 번들 Google config
normalizer가 계속 그 호환성 정리를 적용합니다.

provider에 완전히 custom wire protocol 또는 custom 요청 실행기가 필요하다면,
그것은 다른 종류의 확장입니다. 이 hook은 여전히
OpenClaw의 일반 추론 루프에서 실행되는 provider 동작을 위한 것입니다.

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
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  `wrapStreamFn`을 사용합니다. 이는 Claude 4.6 전방 호환,
  provider-family 힌트, auth 복구 안내, 사용량 엔드포인트 통합,
  prompt-cache 적격성, auth 인식 config 기본값, Claude
  기본/적응형 thinking 정책, beta 헤더, `/fast` / `serviceTier`,
  `context1m`에 대한 Anthropic별 stream shaping을 소유하기 때문입니다.
- Anthropic의 Claude 전용 stream helper는 지금은 번들 plugin 자체의
  공개 `api.ts` / `contract-api.ts` seam에 남아 있습니다. 이 패키지 표면은
  한 provider의 beta-header 규칙 때문에 일반 SDK를 넓히는 대신
  `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, 더 낮은 수준의
  Anthropic wrapper builder를 export합니다.
- OpenAI는 `resolveDynamicModel`, `normalizeResolvedModel`,
  `capabilities`와 함께 `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking`, `isModernModelRef`를 사용합니다.
  이는 GPT-5.4 전방 호환, 직접 OpenAI
  `openai-completions` -> `openai-responses` 정규화, Codex 인식 auth
  힌트, Spark 숨김, synthetic OpenAI 목록 행, GPT-5 thinking /
  live-model 정책을 소유하기 때문입니다. `openai-responses-defaults` stream 계열은
  attribution 헤더, `/fast`/`serviceTier`, 텍스트 장황도, 네이티브 Codex 웹 검색,
  reasoning-compat 페이로드 shaping,
  Responses 컨텍스트 관리를 위한 공유 네이티브 OpenAI Responses 래퍼를 소유합니다.
- OpenRouter는 provider가 패스스루이며
  OpenClaw의 정적 카탈로그가 갱신되기 전에 새 모델 id를 노출할 수 있으므로
  `catalog`와 `resolveDynamicModel`,
  `prepareDynamicModel`을 사용합니다. 또한 provider별 요청 헤더,
  라우팅 메타데이터, reasoning 패치, prompt-cache 정책을 core 밖에 두기 위해
  `capabilities`, `wrapStreamFn`, `isCacheTtlEligible`를 사용합니다.
  replay 정책은 `passthrough-gemini` 계열에서 오고,
  `openrouter-thinking` stream 계열은 프록시 reasoning 주입과
  미지원 모델 / `auto` 건너뛰기를 소유합니다.
- GitHub Copilot은 provider 소유 디바이스 로그인, 모델 fallback 동작, Claude transcript
  특이사항, GitHub token -> Copilot token 교환, provider 소유 사용량 엔드포인트가 필요하므로
  `catalog`, `auth`, `resolveDynamicModel`,
  `capabilities`와 함께 `prepareRuntimeAuth`, `fetchUsageSnapshot`을 사용합니다.
- OpenAI Codex는 여전히 core OpenAI transport에서 실행되지만 transport/base URL
  정규화, OAuth refresh fallback 정책, 기본 transport 선택,
  synthetic Codex 카탈로그 행, ChatGPT 사용량 엔드포인트 통합을 소유하므로
  `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth`, `augmentModelCatalog`와 함께
  `prepareExtraParams`, `resolveUsageAuth`, `fetchUsageSnapshot`을 사용합니다.
  직접 OpenAI와 동일한 `openai-responses-defaults` stream 계열을 공유합니다.
- Google AI Studio와 Gemini CLI OAuth는
  `google-gemini` replay 계열이 Gemini 3.1 전방 호환 fallback,
  네이티브 Gemini replay 검증, bootstrap replay 정리,
  태그 기반 reasoning-output 모드, 최신 모델 매칭을 소유하고,
  `google-thinking` stream 계열이 Gemini thinking 페이로드 정규화를 소유하므로
  `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn`, `isModernModelRef`를 사용합니다.
  Gemini CLI OAuth는 또한 토큰 포맷, 토큰 파싱, quota 엔드포인트
  연결을 위해 `formatApiKey`, `resolveUsageAuth`,
  `fetchUsageSnapshot`을 사용합니다.
- Anthropic Vertex는
  `anthropic-by-model` replay 계열을 통해 `buildReplayPolicy`를 사용하므로,
  Claude 전용 replay 정리가 모든 `anthropic-messages` transport가 아니라
  Claude id에만 적용됩니다.
- Amazon Bedrock은 Bedrock 전용 throttle/not-ready/context-overflow 오류 분류를
  Anthropic-on-Bedrock 트래픽에 대해 소유하므로
  `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `resolveDefaultThinkingLevel`을 사용합니다.
  replay 정책은 여전히 동일한 Claude 전용 `anthropic-by-model` 가드를 공유합니다.
- OpenRouter, Kilocode, Opencode, Opencode Go는 Gemini
  모델을 OpenAI 호환 transport를 통해 프록시하며
  네이티브 Gemini replay 검증이나 bootstrap 재작성 없이
  Gemini thought-signature 정리가 필요하므로 `passthrough-gemini` replay 계열을 통해
  `buildReplayPolicy`를 사용합니다.
- MiniMax는 한 provider가 Anthropic-message와 OpenAI 호환 의미론을 모두 소유하므로
  `hybrid-anthropic-openai` replay 계열을 통해 `buildReplayPolicy`를 사용합니다.
  Anthropic 쪽에서는 Claude 전용 thinking-block 제거를 유지하면서
  reasoning output 모드를 다시 네이티브로 override하고,
  `minimax-fast-mode` stream 계열은 공유 stream 경로에서
  fast-mode 모델 재작성을 소유합니다.
- Moonshot은 여전히 공유
  OpenAI transport를 사용하지만 provider 소유 thinking 페이로드 정규화가 필요하므로
  `catalog`와 `wrapStreamFn`을 사용합니다.
  `moonshot-thinking` stream 계열은 config와 `/think` 상태를
  네이티브 이진 thinking 페이로드에 매핑합니다.
- Kilocode는 provider 소유 요청 헤더,
  reasoning 페이로드 정규화, Gemini transcript 힌트, Anthropic
  cache-TTL 게이팅이 필요하므로 `catalog`, `capabilities`, `wrapStreamFn`,
  `isCacheTtlEligible`를 사용합니다. `kilocode-thinking` stream 계열은
  공유 프록시 stream 경로에서 Kilo thinking 주입을 유지하되,
  명시적 reasoning 페이로드를 지원하지 않는 `kilo/auto` 및
  기타 프록시 모델 id는 건너뜁니다.
- Z.AI는 GLM-5 fallback,
  `tool_stream` 기본값, 이진 thinking UX, 최신 모델 매칭, 사용량 auth + quota 가져오기를 모두 소유하므로
  `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth`, `fetchUsageSnapshot`을 사용합니다.
  `tool-stream-default-on` stream 계열은 기본 활성화 `tool_stream` 래퍼를
  provider별 수동 glue 밖에 둡니다.
- xAI는 네이티브 xAI Responses transport 정규화, Grok fast-mode
  별칭 재작성, 기본 `tool_stream`, 엄격한 tool / reasoning-payload
  정리, plugin 소유 tool용 fallback auth 재사용, 전방 호환 Grok
  모델 해석, xAI tool-schema
  프로필, 미지원 schema 키워드, 네이티브 `web_search`, HTML 엔티티
  tool-call 인자 디코딩 같은 provider 소유 compat 패치를 소유하므로
  `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel`, `isModernModelRef`
  를 사용합니다.
- Mistral, OpenCode Zen, OpenCode Go는
  transcript/tooling 특이사항을 core 밖에 두기 위해 `capabilities`만 사용합니다.
- `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway`, `volcengine` 같은
  카탈로그 전용 번들 provider는 `catalog`만 사용합니다.
- Qwen은 텍스트 provider용 `catalog`와 멀티모달 표면용
  공유 media-understanding 및 비디오 생성 등록을 사용합니다.
- MiniMax와 Xiaomi는 추론은 여전히 공유 transport를 통해 실행되지만
  `/usage` 동작이 plugin 소유이므로 `catalog`와 사용량 hook을 함께 사용합니다.

## 런타임 helper

plugin은 `api.runtime`를 통해 선택된 core helper에 접근할 수 있습니다. TTS의 경우:

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

- `textToSpeech`는 파일/음성 노트 표면용 일반 core TTS 출력 페이로드를 반환합니다.
- core `messages.tts` 구성과 provider 선택을 사용합니다.
- PCM 오디오 버퍼 + 샘플 레이트를 반환합니다. plugin은 provider에 맞게 리샘플링/인코딩해야 합니다.
- `listVoices`는 provider별로 선택 사항입니다. 벤더 소유 voice picker 또는 설정 흐름에 사용하세요.
- 음성 목록에는 provider 인식 picker를 위한 locale, gender, personality 태그 같은
  더 풍부한 메타데이터가 포함될 수 있습니다.
- 현재 telephony는 OpenAI와 ElevenLabs가 지원합니다. Microsoft는 지원하지 않습니다.

plugin은 `api.registerSpeechProvider(...)`를 통해 speech provider를 등록할 수도 있습니다.

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

- TTS 정책, fallback, 응답 전달은 core에 유지하세요.
- 벤더 소유 합성 동작에는 speech provider를 사용하세요.
- 레거시 Microsoft `edge` 입력은 `microsoft` provider id로 정규화됩니다.
- 선호되는 소유권 모델은 회사 지향입니다. 하나의 벤더 plugin이
  OpenClaw가 capability 계약을 추가함에 따라 텍스트, 음성, 이미지, 향후 미디어 provider를
  소유할 수 있습니다.

이미지/오디오/비디오 이해의 경우 plugin은 일반 key/value bag 대신
하나의 정형 media-understanding provider를 등록합니다.

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

- 오케스트레이션, fallback, config, 채널 연결은 core에 유지하세요.
- 벤더 동작은 provider plugin에 유지하세요.
- 추가 확장은 정형 상태를 유지해야 합니다. 즉, 새로운 선택적 메서드,
  새로운 선택적 결과 필드, 새로운 선택적 capability여야 합니다.
- 비디오 생성은 이미 같은 패턴을 따릅니다.
  - core가 capability 계약과 런타임 helper를 소유
  - 벤더 plugin이 `api.registerVideoGenerationProvider(...)`를 등록
  - 기능/channel plugin이 `api.runtime.videoGeneration.*`를 소비

media-understanding 런타임 helper의 경우 plugin은 다음을 호출할 수 있습니다.

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

오디오 전사의 경우 plugin은 media-understanding 런타임 또는
이전 STT 별칭 중 하나를 사용할 수 있습니다.

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // MIME을 신뢰성 있게 추론할 수 없을 때 선택 사항:
  mime: "audio/ogg",
});
```

참고:

- `api.runtime.mediaUnderstanding.*`는
  이미지/오디오/비디오 이해를 위한 선호 공유 표면입니다.
- core media-understanding 오디오 구성(`tools.media.audio`)과 provider fallback 순서를 사용합니다.
- 전사 출력이 생성되지 않을 때(예: 건너뜀/미지원 입력) `{ text: undefined }`를 반환합니다.
- `api.runtime.stt.transcribeAudioFile(...)`는 호환성 별칭으로 남아 있습니다.

plugin은 `api.runtime.subagent`를 통해 백그라운드 subagent 실행을 시작할 수도 있습니다.

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

- `provider`와 `model`은 지속적인 세션 변경이 아니라 실행별 override 선택 사항입니다.
- OpenClaw는 신뢰된 호출자에 대해서만 이러한 override 필드를 허용합니다.
- plugin 소유 fallback 실행의 경우 운영자는 `plugins.entries.<id>.subagent.allowModelOverride: true`로 opt-in해야 합니다.
- 신뢰된 plugin을 특정 정식 `provider/model` 대상으로 제한하려면 `plugins.entries.<id>.subagent.allowedModels`를 사용하거나,
  어떤 대상이든 명시적으로 허용하려면 `"*"`를 사용하세요.
- 신뢰되지 않은 plugin subagent 실행도 동작하지만,
  override 요청은 조용히 fallback되지 않고 거부됩니다.

웹 검색의 경우 plugin은 agent tool 배선에 직접 접근하는 대신
공유 런타임 helper를 소비할 수 있습니다.

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

plugin은
`api.registerWebSearchProvider(...)`를 통해 web-search provider를 등록할 수도 있습니다.

참고:

- provider 선택, 자격 증명 해석, 공유 요청 의미론은 core에 유지하세요.
- 벤더별 검색 transport에는 web-search provider를 사용하세요.
- `api.runtime.webSearch.*`는 agent tool 래퍼에 의존하지 않고
  검색 동작이 필요한 기능/channel plugin을 위한 선호 공유 표면입니다.

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
- `listProviders(...)`: 사용 가능한 이미지 생성 provider와 capability를 나열합니다.

## Gateway HTTP route

plugin은 `api.registerHttpRoute(...)`로 HTTP 엔드포인트를 노출할 수 있습니다.

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

- `path`: gateway HTTP 서버 아래의 route 경로
- `auth`: 필수. 일반 gateway auth를 요구하려면 `"gateway"`, plugin 관리 auth/webhook 검증에는 `"plugin"` 사용
- `match`: 선택 사항. `"exact"`(기본값) 또는 `"prefix"`
- `replaceExisting`: 선택 사항. 같은 plugin이 자신의 기존 route 등록을 교체하도록 허용
- `handler`: route가 요청을 처리했을 때 `true`를 반환

참고:

- `api.registerHttpHandler(...)`는 제거되었으며 plugin 로드 오류를 발생시킵니다. 대신 `api.registerHttpRoute(...)`를 사용하세요.
- Plugin route는 `auth`를 명시적으로 선언해야 합니다.
- 정확한 `path + match` 충돌은 `replaceExisting: true`가 없는 한 거부되며, 한 plugin이 다른 plugin의 route를 교체할 수는 없습니다.
- `auth` 수준이 다른 중첩 route는 거부됩니다. `exact`/`prefix` fallthrough 체인은 같은 auth 수준에서만 유지하세요.
- `auth: "plugin"` route는 운영자 런타임 범위를 자동으로 받지 **않습니다**. 권한 있는 Gateway helper 호출이 아니라 plugin 관리 webhook/서명 검증용입니다.
- `auth: "gateway"` route는 Gateway 요청 런타임 범위 안에서 실행되지만, 그 범위는 의도적으로 보수적입니다.
  - 공유 시크릿 bearer auth(`gateway.auth.mode = "token"` / `"password"`)는 호출자가 `x-openclaw-scopes`를 보내더라도 plugin-route 런타임 범위를 `operator.write`에 고정합니다
  - 신뢰된 ID 전달 HTTP 모드(예: `trusted-proxy` 또는 private ingress에서의 `gateway.auth.mode = "none"`)는 헤더가 명시적으로 있을 때만 `x-openclaw-scopes`를 존중합니다
  - 이러한 ID 전달 plugin-route 요청에서 `x-openclaw-scopes`가 없으면 런타임 범위는 `operator.write`로 fallback합니다
- 실용적인 규칙: gateway-auth plugin route가 암묵적인 관리자 표면이라고 가정하지 마세요. route에 관리자 전용 동작이 필요하면 ID 전달 auth 모드를 요구하고 명시적 `x-openclaw-scopes` 헤더 계약을 문서화하세요.

## Plugin SDK import 경로

plugin 작성 시 모놀리식 `openclaw/plugin-sdk` import 대신
SDK subpath를 사용하세요.

- plugin 등록 기본 요소에는 `openclaw/plugin-sdk/plugin-entry`
- 일반 공유 plugin 표면 계약에는 `openclaw/plugin-sdk/core`
- 루트 `openclaw.json` Zod 스키마 export(`OpenClawSchema`)에는 `openclaw/plugin-sdk/config-schema`
- 공유 설정/auth/응답/webhook
  배선에는 `openclaw/plugin-sdk/channel-setup`,
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
  `openclaw/plugin-sdk/webhook-ingress` 같은 안정적인 channel 기본 요소를 사용하세요.
  `channel-inbound`는 debounce, mention 매칭,
  인바운드 mention-policy helper, envelope 포맷, 인바운드 envelope
  context helper의 공유 홈입니다.
  `channel-setup`은 좁은 선택적 설치 setup seam입니다.
  `setup-runtime`은 `setupEntry` /
  지연 시작에서 사용하는 런타임 안전 setup 표면이며,
  import 안전 setup patch adapter를 포함합니다.
  `setup-adapter-runtime`은 env 인식 account-setup adapter seam입니다.
  `setup-tools`는 작은 CLI/archive/docs helper seam입니다(`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- 공유 런타임/config helper용 도메인 subpath로는
  `openclaw/plugin-sdk/channel-config-helpers`,
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
  `openclaw/plugin-sdk/directory-runtime`를 사용하세요.
  `telegram-command-config`는 Telegram custom
  command 정규화/검증을 위한 좁은 공개 seam이며, 번들
  Telegram 계약 표면이 일시적으로 불가능하더라도 계속 사용할 수 있습니다.
  `text-runtime`은
  assistant-visible-text 제거, markdown 렌더/청크 helper, redaction
  helper, directive-tag helper, safe-text 유틸리티를 포함한 공유 text/markdown/logging seam입니다.
- 승인 전용 channel seam은 plugin의 하나의 `approvalCapability`
  계약을 우선해야 합니다. 그러면 core는 관련 없는 plugin 필드에 승인 동작을 섞는 대신
  그 하나의 capability를 통해 승인 auth, 전달, 렌더,
  네이티브 라우팅, 지연 네이티브 핸들러 동작을 읽습니다.
- `openclaw/plugin-sdk/channel-runtime`은 더 이상 권장되지 않으며,
  오래된 plugin용 호환성 shim으로만 남아 있습니다. 새 코드는 대신 더 좁은
  일반 기본 요소를 import해야 하며, 리포지토리 코드도 shim에 새 import를 추가해서는 안 됩니다.
- 번들 확장 내부 구조는 비공개로 유지됩니다. 외부 plugin은 `openclaw/plugin-sdk/*` subpath만 사용해야 합니다.
  OpenClaw core/test 코드는 `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js`, `login-qr-api.js` 같은 좁게 범위가 지정된 파일 등
  plugin 패키지 루트 아래의 리포지토리 공개 엔트리 포인트를 사용할 수 있습니다.
  core나 다른 확장에서는 plugin 패키지의 `src/*`를 절대 import하지 마세요.
- 리포지토리 엔트리 포인트 분리:
  `<plugin-package-root>/api.js`는 helper/types barrel,
  `<plugin-package-root>/runtime-api.js`는 런타임 전용 barrel,
  `<plugin-package-root>/index.js`는 번들 plugin 엔트리,
  `<plugin-package-root>/setup-entry.js`는 setup plugin 엔트리입니다.
- 현재 번들 provider 예시:
  - Anthropic은 `api.js` / `contract-api.js`를 Claude stream helper
    (`wrapAnthropicProviderStream`, beta-header helper, `service_tier`
    파싱 등)에 사용합니다.
  - OpenAI는 `api.js`를 provider builder, 기본 모델 helper,
    실시간 provider builder에 사용합니다.
  - OpenRouter는 `api.js`를 provider builder와 온보딩/config
    helper에 사용하고, `register.runtime.js`는 여전히 리포지토리 로컬 용도로
    일반 `plugin-sdk/provider-stream` helper를 재export할 수 있습니다.
- facade 로드 공개 엔트리 포인트는
  활성 런타임 config snapshot이 있으면 그것을 우선하고, OpenClaw가 아직 런타임 snapshot을 제공하지 않을 때는
  디스크의 해석된 config 파일로 fallback합니다.
- 일반 공유 기본 요소는 여전히 선호되는 공개 SDK 계약입니다.
  번들 채널 브랜드 helper seam의 작은 예약 호환성 집합은 여전히 존재합니다.
  이것은 새 서드파티 import 대상이 아니라
  번들 유지보수/호환성 seam으로 취급하세요. 새로운 교차 채널 계약은 여전히
  일반 `plugin-sdk/*` subpath 또는 plugin 로컬 `api.js` /
  `runtime-api.js` barrel에 반영되어야 합니다.

호환성 참고:

- 새 코드에는 루트 `openclaw/plugin-sdk` barrel을 피하세요.
- 먼저 더 좁고 안정적인 기본 요소를 우선하세요. 새로운
  setup/pairing/reply/feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool subpath는 새
  번들 및 외부 plugin 작업을 위한 의도된 계약입니다.
  대상 파싱/매칭은 `openclaw/plugin-sdk/channel-targets`에 속합니다.
  메시지 action gate와 reaction message-id helper는
  `openclaw/plugin-sdk/channel-actions`에 속합니다.
- 번들 확장 전용 helper barrel은 기본적으로 안정적이지 않습니다. helper가
  번들 확장에만 필요하다면 `openclaw/plugin-sdk/<extension>`로 승격하는 대신
  확장 로컬 `api.js` 또는 `runtime-api.js` seam 뒤에 두세요.
- 새로운 공유 helper seam은 채널 브랜드가 아니라 일반적이어야 합니다. 공유 대상
  파싱은 `openclaw/plugin-sdk/channel-targets`에 속하고, 채널별
  내부 구조는 소유 plugin의 로컬 `api.js` 또는 `runtime-api.js`
  seam 뒤에 유지됩니다.
- `image-generation`,
  `media-understanding`, `speech` 같은 capability별 subpath는
  번들/네이티브 plugin이 오늘 그것을 사용하기 때문에 존재합니다. 그것이 존재한다고 해서
  export된 모든 helper가 장기적으로 고정된 외부 계약이라는 뜻은 아닙니다.

## Message tool 스키마

plugin은 채널별 `describeMessageTool(...)` 스키마 기여를
소유해야 합니다. provider별 필드는 공유 core가 아니라 plugin에 두세요.

공유 가능한 이식형 스키마 조각에는
`openclaw/plugin-sdk/channel-actions`를 통해 export되는 일반 helper를 재사용하세요.

- 버튼 그리드 스타일 페이로드에는 `createMessageToolButtonsSchema()`
- 구조화된 카드 페이로드에는 `createMessageToolCardSchema()`

스키마 형태가 하나의 provider에만 의미가 있다면
공유 SDK로 승격하지 말고 해당 plugin 자체 소스에 정의하세요.

## Channel 대상 해석

Channel plugin은 채널별 대상 의미론을 소유해야 합니다. 공유
아웃바운드 호스트는 일반 상태로 유지하고, provider 규칙에는 메시징 adapter 표면을 사용하세요.

- `messaging.inferTargetChatType({ to })`는 정규화된 대상을
  디렉터리 조회 전에 `direct`, `group`, `channel` 중 무엇으로 취급할지 결정합니다.
- `messaging.targetResolver.looksLikeId(raw, normalized)`는
  입력이 디렉터리 검색 대신 ID 형태 해석으로 바로 넘어가야 하는지 core에 알려줍니다.
- `messaging.targetResolver.resolveTarget(...)`은
  정규화 후 또는 디렉터리 미스 후 최종 provider 소유 해석이 필요할 때의 plugin fallback입니다.
- `messaging.resolveOutboundSessionRoute(...)`는
  대상이 해석된 후 provider별 세션 route 구성을 소유합니다.

권장 분리:

- peer/group 검색 전에 일어나야 하는 범주 결정에는 `inferTargetChatType` 사용
- "이것을 명시적/네이티브 대상 ID로 취급" 검사에는 `looksLikeId` 사용
- provider별 정규화 fallback에는 `resolveTarget`을 사용하고,
  광범위한 디렉터리 검색에는 사용하지 않음
- chat id, thread id, JID, handle, room id 같은 provider 네이티브 ID는
  일반 SDK 필드가 아니라 `target` 값 또는 provider별 파라미터 안에 유지

## Config 기반 디렉터리

config에서 디렉터리 항목을 파생하는 plugin은 그 로직을 plugin 안에 두고
`openclaw/plugin-sdk/directory-runtime`의 공유 helper를
재사용해야 합니다.

다음과 같은 config 기반 peer/group가 필요한 채널에 사용하세요.

- allowlist 기반 DM peer
- 구성된 channel/group 맵
- account 범위 정적 디렉터리 fallback

`directory-runtime`의 공유 helper는 일반 작업만 처리합니다.

- 쿼리 필터링
- limit 적용
- 중복 제거/정규화 helper
- `ChannelDirectoryEntry[]` 빌드

채널별 account 검사와 id 정규화는 plugin 구현 안에 남겨야 합니다.

## Provider 카탈로그

Provider plugin은
`registerProvider({ catalog: { run(...) { ... } } })`로 추론용 모델 카탈로그를 정의할 수 있습니다.

`catalog.run(...)`은 OpenClaw가 `models.providers`에 기록하는 것과 동일한 형태를 반환합니다.

- 하나의 provider 항목에는 `{ provider }`
- 여러 provider 항목에는 `{ providers }`

provider가 provider별 모델 id, base URL
기본값 또는 auth 게이트 모델 메타데이터를 소유할 때 `catalog`를 사용하세요.

`catalog.order`는 plugin의 카탈로그가 OpenClaw의 내장 암시적 provider에 대해
언제 병합되는지 제어합니다.

- `simple`: 일반 API-key 또는 env 기반 provider
- `profile`: auth profile이 있을 때 나타나는 provider
- `paired`: 여러 관련 provider 항목을 synthetic 생성하는 provider
- `late`: 다른 암시적 provider 이후 마지막 단계

나중 provider가 키 충돌 시 이기므로, plugin은 의도적으로 같은 provider id를 가진
내장 provider 항목을 override할 수 있습니다.

호환성:

- `discovery`는 여전히 레거시 별칭으로 동작합니다
- `catalog`와 `discovery`가 둘 다 등록되면 OpenClaw는 `catalog`를 사용합니다

## 읽기 전용 channel 검사

plugin이 채널을 등록한다면
`resolveAccount(...)`와 함께 `plugin.config.inspectAccount(cfg, accountId)`를 구현하는 것을 우선하세요.

이유:

- `resolveAccount(...)`는 런타임 경로입니다. 자격 증명이
  완전히 구체화되었다고 가정할 수 있으며 필수 secret이 없으면 빠르게 실패해도 됩니다.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, doctor/config
  복구 흐름 같은 읽기 전용 command 경로는
  구성을 설명하기 위해 런타임 자격 증명을 구체화할 필요가 없어야 합니다.

권장 `inspectAccount(...)` 동작:

- 설명적인 account 상태만 반환
- `enabled`와 `configured` 보존
- 관련될 때 자격 증명 source/status 필드 포함, 예:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 읽기 전용 가용성을 보고하기 위해 raw token 값을 반환할 필요는 없습니다.
  상태 스타일 command에는 `tokenStatus: "available"`(및 일치하는 source 필드)면 충분합니다.
- SecretRef를 통해 자격 증명이 구성되었지만 현재 command 경로에서는 사용할 수 없을 때
  `configured_unavailable`을 사용하세요.

이렇게 하면 읽기 전용 command가 crash하거나 account를 미구성으로 잘못 보고하는 대신
"구성되었지만 현재 command 경로에서는 사용할 수 없음"을 보고할 수 있습니다.

## Package pack

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

각 항목은 하나의 plugin이 됩니다. pack이 여러 확장을 나열하면 plugin id는
`name/<fileBase>`가 됩니다.

plugin이 npm 의존성을 import한다면 해당 디렉터리에 설치하여
`node_modules`를 사용할 수 있게 하세요(`npm install` / `pnpm install`).

보안 가드레일: 모든 `openclaw.extensions` 항목은 symlink 해석 후에도 plugin
디렉터리 내부에 있어야 합니다. 패키지 디렉터리 밖으로 벗어나는 항목은
거부됩니다.

보안 참고: `openclaw plugins install`은 plugin 의존성을
`npm install --omit=dev --ignore-scripts`로 설치합니다(라이프사이클 스크립트 없음, 런타임에 dev dependency 없음). plugin 의존성
트리는 "순수 JS/TS"로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.

선택 사항: `openclaw.setupEntry`는 가벼운 setup 전용 모듈을 가리킬 수 있습니다.
OpenClaw가 비활성화된 channel plugin의 setup 표면이 필요하거나,
channel plugin이 활성화되었지만 아직 구성되지 않은 경우, 전체 plugin 엔트리 대신
`setupEntry`를 로드합니다. 이렇게 하면 메인 plugin 엔트리가 tool, hook,
기타 런타임 전용 코드를 함께 연결하는 경우 시작과 setup이 더 가벼워집니다.

선택 사항: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
은 channel plugin이 이미 구성된 경우에도 gateway의
pre-listen 시작 단계에서 동일한 `setupEntry` 경로를 사용하도록 opt-in할 수 있습니다.

이것은 `setupEntry`가 gateway가 수신을 시작하기 전에 존재해야 하는 시작 표면을
완전히 덮을 때만 사용하세요. 실제로는 setup 엔트리가
다음과 같이 시작이 의존하는 모든 채널 소유 capability를 등록해야 함을 의미합니다.

- 채널 등록 자체
- gateway가 수신을 시작하기 전에 사용 가능해야 하는 모든 HTTP route
- 같은 시간 창에 존재해야 하는 모든 gateway 메서드, tool, service

전체 엔트리가 여전히 필수 시작 capability를 소유하고 있다면
이 플래그를 활성화하지 마세요. 기본 동작을 유지하고 OpenClaw가
시작 중 전체 엔트리를 로드하게 하세요.

번들 채널은 전체 채널 런타임이 로드되기 전에 core가 참조할 수 있는
setup 전용 계약 표면 helper를 게시할 수도 있습니다. 현재 setup 승격 표면은 다음과 같습니다.

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core는 레거시 단일 account 채널 config를
전체 plugin 엔트리를 로드하지 않고 `channels.<id>.accounts.*`로 승격해야 할 때 이 표면을 사용합니다.
현재 번들 예시는 Matrix입니다. Matrix는 명명된 account가 이미 존재할 때
auth/bootstrap 키만 명명된 승격 account로 옮기고,
항상 `accounts.default`를 생성하는 대신 구성된 비정형 기본 account 키를 보존할 수 있습니다.

이러한 setup patch adapter는 번들 계약 표면 발견을 지연 상태로 유지합니다.
import 시점은 가볍게 유지되고, 승격 표면은 모듈 import 중에 번들 채널 시작에 재진입하는 대신
첫 사용 시에만 로드됩니다.

이러한 시작 표면에 gateway RPC 메서드가 포함될 때는
plugin별 prefix를 유지하세요. Core 관리자 네임스페이스(`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`)는 예약되어 있으며,
plugin이 더 좁은 범위를 요청해도 항상 `operator.admin`으로 해석됩니다.

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

### Channel 카탈로그 메타데이터

Channel plugin은 `openclaw.channel`을 통해 setup/discovery 메타데이터를,
`openclaw.install`을 통해 설치 힌트를 광고할 수 있습니다. 이렇게 하면 core 카탈로그에 데이터가 없어도 됩니다.

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

- `detailLabel`: 더 풍부한 카탈로그/상태 표면용 보조 라벨
- `docsLabel`: docs 링크 텍스트 override
- `preferOver`: 이 카탈로그 항목이 우선해야 하는 더 낮은 우선순위 plugin/channel id
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: 선택 표면용 복사본 제어
- `markdownCapable`: 아웃바운드 포맷 결정에서 채널이 markdown 가능함을 표시
- `exposure.configured`: `false`로 설정하면 구성된 채널 목록 표면에서 채널 숨김
- `exposure.setup`: `false`로 설정하면 대화형 setup/configure picker에서 채널 숨김
- `exposure.docs`: docs 탐색 표면에서 채널을 내부/비공개로 표시
- `showConfigured` / `showInSetup`: 호환성을 위해 여전히 허용되는 레거시 별칭. `exposure`를 우선하세요
- `quickstartAllowFrom`: 채널을 표준 quickstart `allowFrom` 흐름에 opt-in
- `forceAccountBinding`: 하나의 account만 있어도 명시적 account 바인딩을 요구
- `preferSessionLookupForAnnounceTarget`: announce 대상 해석 시 session lookup을 우선

OpenClaw는 **외부 channel 카탈로그**도 병합할 수 있습니다(예:
MPM 레지스트리 export). 다음 위치 중 하나에 JSON 파일을 두세요.

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

또는 `OPENCLAW_PLUGIN_CATALOG_PATHS`(또는 `OPENCLAW_MPM_CATALOG_PATHS`)를
하나 이상의 JSON 파일로 가리키게 하세요(쉼표/세미콜론/`PATH` 구분). 각 파일에는
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`가 들어 있어야 합니다.
파서는 `"entries"` 키의 레거시 별칭으로 `"packages"` 또는 `"plugins"`도 허용합니다.

## Context engine plugin

Context engine plugin은 ingest, assemble,
compaction을 위한 세션 컨텍스트 오케스트레이션을 소유합니다.
plugin에서 `api.registerContextEngine(id, factory)`로 등록한 다음,
`plugins.slots.contextEngine`으로 활성 엔진을 선택하세요.

기본 context
파이프라인을 단순히 memory search나 hook으로 확장하는 것이 아니라 교체 또는 확장해야 할 때 사용하세요.

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

엔진이 compaction 알고리즘을 **소유하지 않는다면** `compact()`는 계속
구현하되 명시적으로 위임하세요.

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

plugin에 현재 API에 맞지 않는 동작이 필요하다면,
비공개 직접 접근으로 plugin 시스템을 우회하지 마세요. 누락된 capability를 추가하세요.

권장 순서:

1. core 계약 정의
   core가 소유해야 할 공유 동작을 결정합니다. 정책, fallback, config 병합,
   lifecycle, 채널 표면 의미론, 런타임 helper 형태를 정하세요.
2. 정형 plugin 등록/런타임 표면 추가
   가장 작은 유용한
   정형 capability 표면으로 `OpenClawPluginApi` 및/또는 `api.runtime`를 확장합니다.
3. core + channel/feature 소비자 연결
   채널과 기능 plugin은 벤더 구현을 직접 import하지 말고,
   core를 통해 새 capability를 소비해야 합니다.
4. 벤더 구현 등록
   그런 다음 벤더 plugin이 그 capability에 대해 자신의 백엔드를 등록합니다.
5. 계약 커버리지 추가
   시간이 지나도 소유권과 등록 형태가 명시적으로 유지되도록 테스트를 추가합니다.

이것이 OpenClaw가 한 provider의 세계관에 하드코딩되지 않으면서도
의견 있는 구조를 유지하는 방식입니다. 구체적인 파일 체크리스트와 예시는
[Capability Cookbook](/ko/plugins/architecture)을 참조하세요.

### Capability 체크리스트

새 capability를 추가할 때 구현은 보통 다음 표면을 함께 수정해야 합니다.

- `src/<capability>/types.ts`의 core 계약 타입
- `src/<capability>/runtime.ts`의 core 러너/런타임 helper
- `src/plugins/types.ts`의 plugin API 등록 표면
- `src/plugins/registry.ts`의 plugin 레지스트리 배선
- 기능/channel plugin이 이를 소비해야 할 때 `src/plugins/runtime/*`의
  plugin 런타임 노출
- `src/test-utils/plugin-registration.ts`의 캡처/테스트 helper
- `src/plugins/contracts/registry.ts`의 소유권/계약 검증
- `docs/`의 운영자/plugin 문서

이 표면 중 하나가 누락되었다면 보통 그 capability가 아직
완전히 통합되지 않았다는 신호입니다.

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

// 기능/channel plugin용 공유 런타임 helper
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

계약 테스트 패턴:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

이렇게 하면 규칙이 단순해집니다.

- core가 capability 계약 + 오케스트레이션을 소유
- 벤더 plugin이 벤더 구현을 소유
- 기능/channel plugin이 런타임 helper를 소비
- 계약 테스트가 소유권을 명시적으로 유지
