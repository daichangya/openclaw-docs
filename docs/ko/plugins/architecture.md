---
read_when:
    - 기본 OpenClaw 플러그인 빌드 또는 디버깅
    - 플러그인 기능 모델 또는 소유권 경계 이해하기
    - 플러그인 로드 파이프라인 또는 레지스트리 작업하기
    - 프로바이더 런타임 훅 또는 채널 플러그인 구현하기
sidebarTitle: Internals
summary: '플러그인 내부: 기능 모델, 소유권, 계약, 로드 파이프라인 및 런타임 헬퍼'
title: 플러그인 내부
x-i18n:
    generated_at: "2026-04-12T05:58:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6165a9da8b40de3bb7334fcb16023da5515deb83c4897ca1df1726f4a97db9e0
    source_path: plugins/architecture.md
    workflow: 15
---

# 플러그인 내부

<Info>
  이 문서는 **심층 아키텍처 참조**입니다. 실용적인 가이드는 다음을 참고하세요:
  - [플러그인 설치 및 사용](/ko/tools/plugin) — 사용자 가이드
  - [시작하기](/ko/plugins/building-plugins) — 첫 번째 플러그인 튜토리얼
  - [채널 플러그인](/ko/plugins/sdk-channel-plugins) — 메시징 채널 빌드
  - [프로바이더 플러그인](/ko/plugins/sdk-provider-plugins) — 모델 프로바이더 빌드
  - [SDK 개요](/ko/plugins/sdk-overview) — import map 및 등록 API
</Info>

이 페이지에서는 OpenClaw 플러그인 시스템의 내부 아키텍처를 다룹니다.

## 공개 기능 모델

기능은 OpenClaw 내부의 공개 **기본 플러그인** 모델입니다. 모든
기본 OpenClaw 플러그인은 하나 이상의 기능 유형에 대해 등록됩니다.

| 기능                  | 등록 메서드                                    | 예시 플러그인                         |
| --------------------- | ---------------------------------------------- | ------------------------------------- |
| 텍스트 추론           | `api.registerProvider(...)`                    | `openai`, `anthropic`                 |
| CLI 추론 백엔드       | `api.registerCliBackend(...)`                  | `openai`, `anthropic`                 |
| 음성                  | `api.registerSpeechProvider(...)`              | `elevenlabs`, `microsoft`             |
| 실시간 전사           | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                            |
| 실시간 음성           | `api.registerRealtimeVoiceProvider(...)`       | `openai`                              |
| 미디어 이해           | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                    |
| 이미지 생성           | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax`  |
| 음악 생성             | `api.registerMusicGenerationProvider(...)`     | `google`, `minimax`                   |
| 비디오 생성           | `api.registerVideoGenerationProvider(...)`     | `qwen`                                |
| 웹 가져오기           | `api.registerWebFetchProvider(...)`            | `firecrawl`                           |
| 웹 검색               | `api.registerWebSearchProvider(...)`           | `google`                              |
| 채널 / 메시징         | `api.registerChannel(...)`                     | `msteams`, `matrix`                   |

기능을 하나도 등록하지 않지만 훅, 도구 또는
서비스를 제공하는 플러그인은 **레거시 hook-only** 플러그인입니다. 이 패턴은
여전히 완전히 지원됩니다.

### 외부 호환성 방침

기능 모델은 이미 core에 도입되어 있으며 오늘날 번들/기본 플러그인에서
사용되고 있지만, 외부 플러그인 호환성에는 여전히
"내보내졌으니 고정되었다"보다 더 엄격한 기준이 필요합니다.

현재 지침:

- **기존 외부 플러그인:** hook 기반 통합이 계속 작동하도록 유지하고,
  이를 호환성 기준선으로 간주합니다
- **새 번들/기본 플러그인:** 벤더별 직접 접근이나 새로운 hook-only 설계보다
  명시적인 기능 등록을 우선합니다
- **기능 등록을 도입하는 외부 플러그인:** 허용되지만, 문서에서 특정 계약을
  안정적이라고 명시하지 않는 한 기능별 헬퍼 표면은 발전 중인 것으로 간주합니다

실질적인 규칙:

- 기능 등록 API가 의도된 방향입니다
- 전환 기간 동안에는 레거시 hooks가 외부 플러그인에 가장 안전한
  비호환성 없는 경로로 남아 있습니다
- 내보낸 헬퍼 subpath가 모두 같은 수준은 아닙니다. 우연히 노출된 헬퍼 export가 아니라
  문서화된 좁은 계약을 우선하세요

### 플러그인 형태

OpenClaw는 로드된 모든 플러그인을 정적 메타데이터만이 아니라
실제 등록 동작에 따라 하나의 형태로 분류합니다.

- **plain-capability** -- 정확히 하나의 기능 유형만 등록합니다
  (예: `mistral` 같은 provider 전용 플러그인)
- **hybrid-capability** -- 여러 기능 유형을 등록합니다
  (예: `openai`는 텍스트 추론, 음성, 미디어 이해, 이미지 생성을 담당합니다)
- **hook-only** -- hooks만 등록하고, 기능, 도구, 명령, 서비스는 등록하지 않습니다
- **non-capability** -- 도구, 명령, 서비스 또는 라우트를 등록하지만 기능은 등록하지 않습니다

플러그인의 형태와 기능 세부 구성을 보려면
`openclaw plugins inspect <id>`를 사용하세요. 자세한 내용은
[CLI reference](/cli/plugins#inspect)를 참고하세요.

### 레거시 hooks

`before_agent_start` hook은 hook-only 플러그인을 위한 호환성 경로로
계속 지원됩니다. 실제 레거시 플러그인들이 여전히 이에 의존합니다.

방향성:

- 계속 작동하게 유지합니다
- 레거시로 문서화합니다
- 모델/프로바이더 재정의 작업에는 `before_model_resolve`를 우선합니다
- 프롬프트 변경 작업에는 `before_prompt_build`를 우선합니다
- 실제 사용량이 감소하고 fixture 커버리지가 마이그레이션 안전성을 입증할 때만 제거합니다

### 호환성 신호

`openclaw doctor` 또는 `openclaw plugins inspect <id>`를 실행하면
다음 레이블 중 하나가 표시될 수 있습니다.

| 신호                       | 의미                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | 구성이 정상적으로 파싱되고 플러그인이 해결됨                 |
| **compatibility advisory** | 플러그인이 지원되지만 더 오래된 패턴(예: `hook-only`)을 사용함 |
| **legacy warning**         | 플러그인이 `before_agent_start`를 사용하며, 이는 더 이상 권장되지 않음 |
| **hard error**             | 구성이 잘못되었거나 플러그인 로드에 실패함                   |

`hook-only`와 `before_agent_start`는 현재 플러그인을 깨뜨리지 않습니다 --
`hook-only`는 권고 수준이고, `before_agent_start`는 경고만 발생시킵니다. 이러한
신호는 `openclaw status --all`과 `openclaw plugins doctor`에도 표시됩니다.

## 아키텍처 개요

OpenClaw의 플러그인 시스템은 네 개의 계층으로 구성됩니다.

1. **매니페스트 + 탐색**
   OpenClaw는 구성된 경로, workspace 루트,
   전역 extension 루트, 번들 extension에서 후보 플러그인을 찾습니다.
   탐색은 먼저 기본 `openclaw.plugin.json` 매니페스트와 지원되는 번들 매니페스트를 읽습니다.
2. **활성화 + 검증**
   Core는 탐색된 플러그인이 활성화, 비활성화, 차단되었는지 또는 memory 같은
   독점 슬롯에 선택되었는지를 결정합니다.
3. **런타임 로드**
   기본 OpenClaw 플러그인은 jiti를 통해 프로세스 내에서 로드되고
   중앙 레지스트리에 기능을 등록합니다. 호환 가능한 번들은 런타임 코드를 import하지 않고도
   레지스트리 레코드로 정규화됩니다.
4. **표면 소비**
   OpenClaw의 나머지 부분은 레지스트리를 읽어 도구, 채널, 프로바이더 설정,
   hooks, HTTP 라우트, CLI 명령 및 서비스를 노출합니다.

특히 플러그인 CLI의 경우, 루트 명령 탐색은 두 단계로 나뉩니다.

- 파싱 시점 메타데이터는 `registerCli(..., { descriptors: [...] })`에서 가져옵니다
- 실제 플러그인 CLI 모듈은 지연 로드 상태를 유지하다가 첫 호출 시 등록될 수 있습니다

이렇게 하면 플러그인 소유의 CLI 코드를 플러그인 내부에 유지하면서도,
OpenClaw가 파싱 전에 루트 명령 이름을 예약할 수 있습니다.

중요한 설계 경계:

- 탐색 + 구성 검증은 플러그인 코드를 실행하지 않고도
  **매니페스트/스키마 메타데이터**만으로 작동해야 합니다
- 기본 런타임 동작은 플러그인 모듈의 `register(api)` 경로에서 옵니다

이 분리를 통해 OpenClaw는 전체 런타임이 활성화되기 전에
구성을 검증하고, 누락되거나 비활성화된 플러그인을 설명하며,
UI/스키마 힌트를 구성할 수 있습니다.

### 채널 플러그인과 공유 message tool

채널 플러그인은 일반적인 채팅 작업을 위해 별도의 send/edit/react tool을
등록할 필요가 없습니다. OpenClaw는 core에 하나의 공유 `message` tool을 유지하고,
채널 플러그인은 그 뒤의 채널별 탐색과 실행을 담당합니다.

현재 경계는 다음과 같습니다.

- core는 공유 `message` tool 호스트, 프롬프트 연결, 세션/스레드
  bookkeeping, 실행 디스패치를 담당합니다
- 채널 플러그인은 범위가 지정된 작업 탐색, 기능 탐색,
  채널별 스키마 조각을 담당합니다
- 채널 플러그인은 대화 ID가 스레드 ID를 어떻게 인코딩하거나
  상위 대화에서 상속하는지 같은 프로바이더별 세션 대화 문법을 담당합니다
- 채널 플러그인은 자신의 action adapter를 통해 최종 작업을 실행합니다

채널 플러그인의 SDK 표면은
`ChannelMessageActionAdapter.describeMessageTool(...)`입니다. 이 통합된 탐색 호출은
플러그인이 보이는 작업, 기능, 스키마 기여를 함께 반환할 수 있게 하여
이 요소들이 서로 어긋나지 않도록 합니다.

Core는 런타임 범위를 이 탐색 단계에 전달합니다. 중요한 필드는 다음과 같습니다.

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 신뢰된 인바운드 `requesterSenderId`

이는 컨텍스트 민감형 플러그인에 중요합니다. 채널은 활성 계정,
현재 방/스레드/메시지, 또는 신뢰된 요청자 ID에 따라 메시지 작업을 숨기거나
노출할 수 있으며, 이를 위해 core `message` tool에
채널별 분기를 하드코딩할 필요가 없습니다.

이 때문에 embedded-runner 라우팅 변경은 여전히 플러그인 작업입니다. runner는
현재 채팅/세션 ID를 플러그인 탐색 경계로 전달하여, 공유 `message` tool이
현재 턴에 맞는 채널 소유 표면을 노출하도록 해야 합니다.

채널 소유 실행 헬퍼의 경우, 번들 플러그인은 실행
런타임을 자체 extension 모듈 내부에 유지해야 합니다. Core는 더 이상
`src/agents/tools` 아래에서 Discord, Slack, Telegram 또는 WhatsApp 메시지 작업 런타임을
소유하지 않습니다. 별도의 `plugin-sdk/*-action-runtime` subpath는
게시하지 않으며, 번들 플러그인은 자체 extension 소유 모듈에서
직접 로컬 런타임 코드를 import해야 합니다.

일반적으로 프로바이더 이름이 붙은 SDK 경계에도 동일한 원칙이 적용됩니다.
core는 Slack, Discord, Signal, WhatsApp 또는 유사한 extension을 위한
채널별 편의성 barrel을 import해서는 안 됩니다. core에 어떤 동작이 필요하면,
번들 플러그인의 자체 `api.ts` / `runtime-api.ts` barrel을 사용하거나,
그 요구를 공유 SDK의 좁고 일반적인 기능으로 승격해야 합니다.

특히 poll의 경우 두 가지 실행 경로가 있습니다.

- `outbound.sendPoll`은 공통 poll 모델에 맞는 채널을 위한
  공유 기준선입니다
- `actions.handleAction("poll")`은 채널별 poll 의미 체계나
  추가 poll 매개변수에 권장되는 경로입니다

이제 core는 플러그인 poll 디스패치가 작업을 거부한 뒤에야 공유 poll 파싱을
수행하므로, 플러그인 소유 poll 핸들러는
일반 poll 파서에 먼저 막히지 않고 채널별 poll 필드를 허용할 수 있습니다.

전체 시작 시퀀스는 [Load pipeline](#load-pipeline)을 참고하세요.

## 기능 소유권 모델

OpenClaw는 기본 플러그인을 관련 없는 통합의 모음이 아니라
**회사** 또는 **기능**의 소유권 경계로 취급합니다.

이는 다음을 의미합니다.

- 회사 플러그인은 일반적으로 그 회사의 모든 OpenClaw 표면을 소유해야 합니다
- 기능 플러그인은 일반적으로 자신이 도입하는 전체 기능 표면을 소유해야 합니다
- 채널은 provider 동작을 임시방편으로 재구현하는 대신
  공유 core 기능을 소비해야 합니다

예시:

- 번들 `openai` 플러그인은 OpenAI 모델 프로바이더 동작과 OpenAI
  음성 + 실시간 음성 + 미디어 이해 + 이미지 생성 동작을 소유합니다
- 번들 `elevenlabs` 플러그인은 ElevenLabs 음성 동작을 소유합니다
- 번들 `microsoft` 플러그인은 Microsoft 음성 동작을 소유합니다
- 번들 `google` 플러그인은 Google 모델 프로바이더 동작과 Google
  미디어 이해 + 이미지 생성 + 웹 검색 동작을 소유합니다
- 번들 `firecrawl` 플러그인은 Firecrawl 웹 가져오기 동작을 소유합니다
- 번들 `minimax`, `mistral`, `moonshot`, `zai` 플러그인은
  미디어 이해 백엔드를 소유합니다
- 번들 `qwen` 플러그인은 Qwen 텍스트 프로바이더 동작과
  미디어 이해 및 비디오 생성 동작을 소유합니다
- `voice-call` 플러그인은 기능 플러그인입니다. 이 플러그인은 통화 전송, 도구,
  CLI, 라우트, Twilio 미디어 스트림 브리징을 소유하지만, 벤더 플러그인을 직접 import하는 대신
  공유 음성 + 실시간 전사 + 실시간 음성 기능을 소비합니다

의도된 최종 상태는:

- OpenAI는 텍스트 모델, 음성, 이미지, 그리고
  향후 비디오까지 아우르더라도 하나의 플러그인에 존재합니다
- 다른 벤더도 자체 표면 영역에 대해 동일하게 구성할 수 있습니다
- 채널은 어떤 벤더 플러그인이 프로바이더를 소유하는지 신경 쓰지 않으며, 대신
  core가 노출하는 공유 기능 계약을 소비합니다

이것이 핵심적인 구분입니다.

- **plugin** = 소유권 경계
- **capability** = 여러 플러그인이 구현하거나 소비할 수 있는 core 계약

따라서 OpenClaw가 비디오와 같은 새로운 도메인을 추가할 때, 첫 번째 질문은
"어떤 프로바이더가 비디오 처리를 하드코딩해야 하는가?"가 아닙니다. 첫 번째 질문은
"core 비디오 기능 계약은 무엇인가?"입니다. 그 계약이 존재하면
벤더 플러그인은 여기에 등록할 수 있고, 채널/기능 플러그인은 이를 소비할 수 있습니다.

기능이 아직 존재하지 않는다면, 일반적으로 올바른 접근은 다음과 같습니다.

1. core에 누락된 기능을 정의합니다
2. 이를 플러그인 API/런타임을 통해 타입이 지정된 방식으로 노출합니다
3. 채널/기능을 해당 기능에 연결합니다
4. 벤더 플러그인이 구현을 등록하도록 합니다

이렇게 하면 소유권을 명시적으로 유지하면서도, 단일 벤더나
일회성 플러그인별 코드 경로에 의존하는 core 동작을 피할 수 있습니다.

### 기능 계층 구조

코드가 어디에 속해야 하는지 결정할 때 다음 사고 모델을 사용하세요.

- **core capability layer**: 공유 오케스트레이션, 정책, 대체 경로, config
  병합 규칙, 전달 의미 체계, 타입이 지정된 계약
- **vendor plugin layer**: 벤더별 API, 인증, 모델 카탈로그, 음성
  합성, 이미지 생성, 향후 비디오 백엔드, 사용량 엔드포인트
- **channel/feature plugin layer**: core 기능을 소비하고
  이를 표면에 제시하는 Slack/Discord/voice-call 등의 통합

예를 들어 TTS는 다음과 같은 구조를 따릅니다.

- core는 응답 시점 TTS 정책, 대체 순서, 환경설정, 채널 전달을 소유합니다
- `openai`, `elevenlabs`, `microsoft`는 합성 구현을 소유합니다
- `voice-call`은 텔레포니 TTS 런타임 헬퍼를 소비합니다

미래의 기능에도 동일한 패턴을 우선 적용해야 합니다.

### 다중 기능 회사 플러그인 예시

회사 플러그인은 외부에서 보았을 때 일관된 하나의 구성처럼 느껴져야 합니다. OpenClaw에
모델, 음성, 실시간 전사, 실시간 음성, 미디어
이해, 이미지 생성, 비디오 생성, 웹 가져오기, 웹 검색을 위한 공유 계약이 있다면,
벤더는 모든 표면을 한 곳에서 소유할 수 있습니다.

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

중요한 것은 정확한 헬퍼 이름이 아닙니다. 중요한 것은 구조입니다.

- 하나의 플러그인이 벤더 표면을 소유합니다
- core는 여전히 기능 계약을 소유합니다
- 채널과 기능 플러그인은 벤더 코드가 아니라 `api.runtime.*` 헬퍼를 소비합니다
- 계약 테스트는 플러그인이 자신이 소유한다고 주장하는 기능을
  실제로 등록했는지 검증할 수 있습니다

### 기능 예시: 비디오 이해

OpenClaw는 이미 이미지/오디오/비디오 이해를 하나의 공유
기능으로 취급합니다. 동일한 소유권 모델이 여기에 적용됩니다.

1. core가 media-understanding 계약을 정의합니다
2. 벤더 플러그인이 상황에 따라 `describeImage`, `transcribeAudio`,
   `describeVideo`를 등록합니다
3. 채널과 기능 플러그인은 벤더 코드에 직접 연결하는 대신
   공유 core 동작을 소비합니다

이렇게 하면 특정 프로바이더의 비디오 가정을 core에 고정하지 않게 됩니다. 플러그인은
벤더 표면을 소유하고, core는 기능 계약과 대체 동작을 소유합니다.

비디오 생성도 이미 같은 순서를 사용합니다. core가 타입이 지정된
기능 계약과 런타임 헬퍼를 소유하고, 벤더 플러그인이 여기에 대해
`api.registerVideoGenerationProvider(...)` 구현을 등록합니다.

구체적인 출시 체크리스트가 필요하신가요? [Capability Cookbook](/ko/plugins/architecture)을
참고하세요.

## 계약 및 적용

플러그인 API 표면은 의도적으로 타입이 지정되어 있으며
`OpenClawPluginApi`에 중앙 집중화되어 있습니다. 이 계약은
지원되는 등록 지점과 플러그인이 의존할 수 있는 런타임 헬퍼를 정의합니다.

이것이 중요한 이유:

- 플러그인 작성자는 하나의 안정적인 내부 표준을 얻습니다
- core는 두 개의 플러그인이 동일한 provider id를 등록하는 것과 같은
  중복 소유권을 거부할 수 있습니다
- 시작 시 잘못된 등록에 대해 실행 가능한 진단을 표시할 수 있습니다
- 계약 테스트는 번들 플러그인 소유권을 적용하고 조용한 드리프트를 방지할 수 있습니다

적용에는 두 계층이 있습니다.

1. **런타임 등록 적용**
   플러그인 레지스트리는 플러그인이 로드될 때 등록을 검증합니다. 예:
   중복 provider id, 중복 speech provider id, 잘못된
   등록은 정의되지 않은 동작 대신 플러그인 진단을 생성합니다.
2. **계약 테스트**
   번들 플러그인은 테스트 실행 중 계약 레지스트리에 캡처되므로
   OpenClaw가 소유권을 명시적으로 검증할 수 있습니다. 현재 이는 모델
   프로바이더, 음성 프로바이더, 웹 검색 프로바이더, 번들 등록 소유권에 사용됩니다.

실질적인 효과는 OpenClaw가 어떤 플러그인이 어떤 표면을 소유하는지
사전에 알고 있다는 것입니다. 덕분에 소유권이 암묵적이지 않고
선언되고, 타입이 지정되며, 테스트 가능하기 때문에 core와 채널이 매끄럽게 조합될 수 있습니다.

### 계약에 포함되어야 하는 것

좋은 플러그인 계약은 다음과 같습니다.

- 타입이 지정되어 있음
- 작음
- 기능별로 구체적임
- core가 소유함
- 여러 플러그인에서 재사용 가능함
- 벤더 지식 없이 채널/기능에서 소비 가능함

좋지 않은 플러그인 계약은 다음과 같습니다.

- core 안에 숨겨진 벤더별 정책
- 레지스트리를 우회하는 일회성 플러그인 탈출구
- 벤더 구현에 바로 접근하는 채널 코드
- `OpenClawPluginApi` 또는
  `api.runtime`의 일부가 아닌 임시 런타임 객체

확신이 서지 않으면 추상화 수준을 높이세요. 먼저 기능을 정의한 다음,
플러그인이 여기에 연결되도록 하세요.

## 실행 모델

기본 OpenClaw 플러그인은 Gateway와 **같은 프로세스 내에서**
실행됩니다. 샌드박스 처리되지 않습니다. 로드된 기본 플러그인은
core 코드와 동일한 프로세스 수준 신뢰 경계를 가집니다.

의미하는 바:

- 기본 플러그인은 도구, 네트워크 핸들러, hooks, 서비스를 등록할 수 있습니다
- 기본 플러그인 버그는 gateway를 크래시시키거나 불안정하게 만들 수 있습니다
- 악성 기본 플러그인은 OpenClaw 프로세스 내부의 임의 코드 실행과 동일합니다

호환 가능한 번들은 OpenClaw가 현재 이를
메타데이터/콘텐츠 팩으로 취급하기 때문에 기본적으로 더 안전합니다. 현재 릴리스에서는
이는 주로 번들 skills를 의미합니다.

번들이 아닌 플러그인에는 allowlist와 명시적인 install/load 경로를 사용하세요. workspace 플러그인은
프로덕션 기본값이 아니라 개발 시점 코드로 취급하세요.

번들 workspace package 이름의 경우, 플러그인 id가 npm
이름에 고정되도록 유지하세요. 기본값은 `@openclaw/<id>`이며, 또는
패키지가 더 좁은 플러그인 역할을 의도적으로 노출하는 경우
`-provider`, `-plugin`, `-speech`, `-sandbox`, `-media-understanding` 같은 승인된 타입 접미사를 사용할 수 있습니다.

중요한 신뢰 참고 사항:

- `plugins.allow`는 소스 출처가 아니라 **plugin id**를 신뢰합니다.
- 번들 플러그인과 동일한 id를 가진 workspace 플러그인은, 해당 workspace 플러그인이 활성화되거나 allowlist에 있으면
  의도적으로 번들 사본을 가립니다.
- 이는 정상적이며 로컬 개발, 패치 테스트, 핫픽스에 유용합니다.

## export 경계

OpenClaw는 구현 편의성이 아니라 기능을 export합니다.

기능 등록은 공개 상태로 유지하세요. 계약이 아닌 헬퍼 export는 정리하세요.

- 번들 플러그인 전용 헬퍼 subpath
- 공개 API로 의도되지 않은 런타임 플러밍 subpath
- 벤더별 편의 헬퍼
- 구현 세부 사항인 setup/onboarding 헬퍼

일부 번들 플러그인 헬퍼 subpath는 호환성과 번들 플러그인 유지보수를 위해
생성된 SDK export map에 여전히 남아 있습니다. 현재 예로는
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, 그리고 여러 `plugin-sdk/matrix*` 경계가 있습니다. 이들은
새로운 서드파티 플러그인에 권장되는 SDK 패턴이 아니라,
예약된 구현 세부 사항 export로 취급하세요.

## 로드 파이프라인

시작 시 OpenClaw는 대략 다음을 수행합니다.

1. 후보 플러그인 루트를 탐색합니다
2. 기본 또는 호환 번들 매니페스트와 package 메타데이터를 읽습니다
3. 안전하지 않은 후보를 거부합니다
4. 플러그인 config를 정규화합니다 (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. 각 후보의 활성화 여부를 결정합니다
6. 활성화된 기본 모듈을 jiti를 통해 로드합니다
7. 기본 `register(api)`(또는 레거시 별칭인 `activate(api)`) hook을 호출하고 등록 항목을 플러그인 레지스트리에 수집합니다
8. 레지스트리를 명령/런타임 표면에 노출합니다

<Note>
`activate`는 `register`의 레거시 별칭입니다 — 로더는 존재하는 항목(`def.register ?? def.activate`)을 해결해 같은 시점에 호출합니다. 모든 번들 플러그인은 `register`를 사용합니다. 새 플러그인에는 `register`를 사용하세요.
</Note>

안전 게이트는 런타임 실행 **이전**에 발생합니다. 후보는
엔트리가 플러그인 루트를 벗어나거나, 경로가 world-writable이거나,
번들이 아닌 플러그인에 대해 경로 소유권이 의심스러워 보이면 차단됩니다.

### Manifest-first 동작

매니페스트는 제어 평면의 단일 진실 공급원입니다. OpenClaw는 이를 사용해 다음을 수행합니다.

- 플러그인을 식별합니다
- 선언된 채널/skills/config 스키마 또는 번들 기능을 탐색합니다
- `plugins.entries.<id>.config`를 검증합니다
- Control UI 레이블/placeholder를 보강합니다
- install/catalog 메타데이터를 표시합니다
- 플러그인 런타임을 로드하지 않고도 가벼운 활성화 및 setup descriptor를 유지합니다

기본 플러그인의 경우 런타임 모듈은 데이터 평면 부분입니다. 이 모듈은
hooks, tools, commands 또는 provider 흐름과 같은
실제 동작을 등록합니다.

선택적 매니페스트 `activation` 및 `setup` 블록은 제어 평면에 그대로 남습니다.
이들은 활성화 계획 및 setup 탐색을 위한 메타데이터 전용 descriptor이며,
런타임 등록, `register(...)`, 또는 `setupEntry`를 대체하지 않습니다.

이제 setup 탐색은 setup 시점 런타임 hooks가 여전히 필요한 플러그인에 대해
`setup-api`로 폴백하기 전에, `setup.providers` 및
`setup.cliBackends` 같은 descriptor 소유 id를 우선 사용하여 후보 플러그인을 좁힙니다. 둘 이상의
탐색된 플러그인이 동일하게 정규화된 setup provider 또는 CLI backend
id를 주장하면, setup 조회는 탐색 순서에 의존하지 않고
모호한 소유자를 거부합니다.

### 로더가 캐시하는 항목

OpenClaw는 다음에 대해 짧은 프로세스 내 캐시를 유지합니다.

- 탐색 결과
- 매니페스트 레지스트리 데이터
- 로드된 플러그인 레지스트리

이 캐시는 급격한 시작 부하와 반복 명령 오버헤드를 줄여 줍니다. 이는
영속 저장소가 아니라 수명이 짧은 성능 캐시로 이해하는 것이 안전합니다.

성능 참고:

- 이 캐시를 비활성화하려면 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 또는
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`을 설정하세요.
- 캐시 기간은 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 및
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`로 조정할 수 있습니다.

## 레지스트리 모델

로드된 플러그인은 임의의 core 전역 상태를 직접 변경하지 않습니다. 대신
중앙 플러그인 레지스트리에 등록합니다.

레지스트리는 다음을 추적합니다.

- 플러그인 레코드(식별자, 소스, 원본, 상태, 진단)
- 도구
- 레거시 hooks 및 타입이 지정된 hooks
- 채널
- 프로바이더
- gateway RPC 핸들러
- HTTP 라우트
- CLI registrar
- 백그라운드 서비스
- 플러그인 소유 명령

그런 다음 core 기능은 플러그인 모듈과 직접 통신하는 대신
이 레지스트리를 읽습니다. 이를 통해 로딩은 단방향으로 유지됩니다.

- 플러그인 모듈 -> 레지스트리 등록
- core 런타임 -> 레지스트리 소비

이 분리는 유지보수성 측면에서 중요합니다. 이는 대부분의 core 표면이
"모든 플러그인 모듈을 특별 취급"이 아니라
"레지스트리를 읽기"라는 하나의 통합 지점만 필요하다는 뜻입니다.

## 대화 바인딩 콜백

대화를 바인딩하는 플러그인은 승인 결정이 완료되었을 때 반응할 수 있습니다.

바인드 요청이 승인되거나 거부된 뒤 콜백을 받으려면
`api.onConversationBindingResolved(...)`를 사용하세요.

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

콜백 페이로드 필드:

- `status`: `"approved"` 또는 `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, 또는 `"deny"`
- `binding`: 승인된 요청에 대해 해결된 바인딩
- `request`: 원래 요청 요약, 분리 힌트, 발신자 ID, 그리고
  대화 메타데이터

이 콜백은 알림 전용입니다. 누가 대화를 바인딩할 수 있는지를 바꾸지 않으며,
core의 승인 처리가 끝난 뒤에 실행됩니다.

## 프로바이더 런타임 hooks

이제 프로바이더 플러그인에는 두 개의 계층이 있습니다.

- 매니페스트 메타데이터: 런타임 로드 전에 가벼운 프로바이더 env 인증 조회를 위한 `providerAuthEnvVars`,
  인증을 공유하는 프로바이더 변형을 위한 `providerAuthAliases`,
  런타임 로드 전에 가벼운 채널 env/setup 조회를 위한 `channelEnvVars`,
  그리고 런타임 로드 전에 가벼운 온보딩/인증 선택 레이블과
  CLI 플래그 메타데이터를 위한 `providerAuthChoices`
- config 시점 hooks: `catalog` / 레거시 `discovery` 및 `applyConfigDefaults`
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
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw는 여전히 일반적인 에이전트 루프, 페일오버, transcript 처리, 그리고
도구 정책을 소유합니다. 이러한 hooks는 전체 사용자 정의 추론 전송 계층 없이도
프로바이더별 동작을 확장할 수 있는 표면입니다.

프로바이더에 env 기반 자격 증명이 있고, 일반 인증/상태/모델 선택기 경로가
플러그인 런타임을 로드하지 않고도 이를 확인해야 한다면 매니페스트 `providerAuthEnvVars`를 사용하세요.
하나의 provider id가 다른 provider id의 env var, auth profile,
config 기반 인증, API-key 온보딩 선택을 재사용해야 한다면
매니페스트 `providerAuthAliases`를 사용하세요. 온보딩/인증 선택
CLI 표면이 프로바이더의 choice id, 그룹 레이블,
단일 플래그 인증 연결을 프로바이더 런타임 로드 없이 알아야 한다면
매니페스트 `providerAuthChoices`를 사용하세요. 프로바이더 런타임
`envVars`는 온보딩 레이블이나 OAuth
client-id/client-secret setup var 같은 운영자 대상 힌트를 위해 유지하세요.

채널에 env 기반 인증 또는 setup이 있고, 일반 shell-env 대체 경로,
config/status 검사, setup 프롬프트가 채널 런타임 로드 없이 이를 확인해야 한다면
매니페스트 `channelEnvVars`를 사용하세요.

### Hook 순서 및 사용법

모델/프로바이더 플러그인의 경우, OpenClaw는 대략 다음 순서로 hooks를 호출합니다.
"언제 사용할지" 열은 빠른 판단 가이드입니다.

| #   | Hook                              | 수행하는 작업                                                                                                  | 사용 시점                                                                                                                                    |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 생성 중 `models.providers`에 프로바이더 config를 게시                                           | 프로바이더가 카탈로그 또는 기본 base URL을 소유하는 경우                                                                                     |
| 2   | `applyConfigDefaults`             | config 구체화 중 프로바이더 소유 전역 config 기본값을 적용                                                   | 기본값이 auth 모드, env 또는 프로바이더 모델 패밀리 의미 체계에 따라 달라지는 경우                                                          |
| --  | _(built-in model lookup)_         | OpenClaw가 먼저 일반 레지스트리/카탈로그 경로를 시도함                                                        | _(플러그인 hook 아님)_                                                                                                                       |
| 3   | `normalizeModelId`                | 조회 전에 레거시 또는 preview model-id 별칭을 정규화                                                          | 프로바이더가 정식 모델 해결 전에 별칭 정리를 소유하는 경우                                                                                   |
| 4   | `normalizeTransport`              | 일반 모델 조립 전에 프로바이더 패밀리 `api` / `baseUrl`을 정규화                                              | 동일한 전송 패밀리 내 커스텀 프로바이더 ID에 대한 전송 정리를 프로바이더가 소유하는 경우                                                     |
| 5   | `normalizeConfig`                 | 런타임/프로바이더 해결 전에 `models.providers.<id>`를 정규화                                                  | 플러그인에 속해야 하는 config 정리가 필요한 경우; 번들 Google 계열 헬퍼는 지원되는 Google config 항목의 백스톱도 제공함                  |
| 6   | `applyNativeStreamingUsageCompat` | config 프로바이더에 기본 스트리밍 사용량 호환성 재작성을 적용                                                 | 프로바이더가 엔드포인트 기반 기본 스트리밍 사용량 메타데이터 수정을 필요로 하는 경우                                                         |
| 7   | `resolveConfigApiKey`             | 런타임 auth 로드 전에 config 프로바이더에 대한 env-marker auth를 해결                                         | 프로바이더가 자체 env-marker API 키 해결 로직을 가진 경우; `amazon-bedrock`도 여기서 내장 AWS env-marker 해결기를 가짐                    |
| 8   | `resolveSyntheticAuth`            | 일반 텍스트를 영구 저장하지 않고 local/self-hosted 또는 config 기반 auth를 노출                               | 프로바이더가 synthetic/local 자격 증명 marker로 동작할 수 있는 경우                                                                          |
| 9   | `resolveExternalAuthProfiles`     | 프로바이더 소유 외부 auth profile을 오버레이함; 기본 `persistence`는 CLI/app 소유 자격 증명에 대해 `runtime-only` | 프로바이더가 복사된 refresh token을 영구 저장하지 않고 외부 auth 자격 증명을 재사용하는 경우                                                |
| 10  | `shouldDeferSyntheticProfileAuth` | 저장된 synthetic profile placeholder의 우선순위를 env/config 기반 auth보다 낮춤                               | 프로바이더가 우선순위를 가져서는 안 되는 synthetic placeholder profile을 저장하는 경우                                                       |
| 11  | `resolveDynamicModel`             | 아직 로컬 레지스트리에 없는 프로바이더 소유 model id에 대한 동기 폴백                                         | 프로바이더가 임의의 업스트림 model id를 허용하는 경우                                                                                        |
| 12  | `prepareDynamicModel`             | 비동기 준비를 수행한 뒤 `resolveDynamicModel`을 다시 실행                                                     | 프로바이더가 알 수 없는 ID를 해결하기 전에 네트워크 메타데이터를 필요로 하는 경우                                                            |
| 13  | `normalizeResolvedModel`          | embedded runner가 해결된 모델을 사용하기 전 최종 재작성                                                       | 프로바이더가 전송 재작성을 필요로 하지만 여전히 core 전송을 사용하는 경우                                                                    |
| 14  | `contributeResolvedModelCompat`   | 다른 호환 전송 뒤에 있는 벤더 모델에 대한 호환성 플래그를 기여                                                | 프로바이더가 프로바이더를 직접 인수하지 않고도 프록시 전송에서 자체 모델을 인식하는 경우                                                     |
| 15  | `capabilities`                    | 공유 core 로직에서 사용하는 프로바이더 소유 transcript/tooling 메타데이터                                     | 프로바이더가 transcript/프로바이더 패밀리 특이사항을 필요로 하는 경우                                                                        |
| 16  | `normalizeToolSchemas`            | embedded runner가 보기 전에 tool 스키마를 정규화                                                              | 프로바이더가 전송 패밀리 스키마 정리를 필요로 하는 경우                                                                                      |
| 17  | `inspectToolSchemas`              | 정규화 후 프로바이더 소유 스키마 진단을 노출                                                                  | core에 프로바이더별 규칙을 가르치지 않고 keyword 경고를 표시하려는 경우                                                                      |
| 18  | `resolveReasoningOutputMode`      | 기본 방식 또는 태그 기반 reasoning-output 계약을 선택                                                         | 프로바이더가 기본 필드 대신 태그 기반 reasoning/final output을 필요로 하는 경우                                                              |
| 19  | `prepareExtraParams`              | 일반 스트림 옵션 래퍼 전에 요청 매개변수 정규화 수행                                                          | 프로바이더가 기본 요청 매개변수 또는 프로바이더별 매개변수 정리를 필요로 하는 경우                                                            |
| 20  | `createStreamFn`                  | 일반 스트림 경로를 완전히 대체하여 커스텀 전송을 사용                                                         | 프로바이더가 단순 래퍼가 아닌 커스텀 wire protocol을 필요로 하는 경우                                                                        |
| 21  | `wrapStreamFn`                    | 일반 래퍼가 적용된 뒤 스트림 래퍼를 적용                                                                      | 프로바이더가 커스텀 전송 없이 요청 헤더/본문/모델 호환성 래퍼를 필요로 하는 경우                                                             |
| 22  | `resolveTransportTurnState`       | 기본 turn 단위 전송 헤더 또는 메타데이터를 첨부                                                              | 프로바이더가 일반 전송이 프로바이더 기본 turn ID를 보내기를 원하는 경우                                                                       |
| 23  | `resolveWebSocketSessionPolicy`   | 기본 WebSocket 헤더 또는 세션 cool-down 정책을 첨부                                                           | 프로바이더가 일반 WS 전송에서 세션 헤더 또는 폴백 정책 조정을 원할 경우                                                                      |
| 24  | `formatApiKey`                    | auth-profile formatter: 저장된 profile을 런타임 `apiKey` 문자열로 변환                                        | 프로바이더가 추가 auth 메타데이터를 저장하고 커스텀 런타임 토큰 형태를 필요로 하는 경우                                                      |
| 25  | `refreshOAuth`                    | 커스텀 refresh 엔드포인트 또는 refresh 실패 정책을 위한 OAuth refresh 재정의                                  | 프로바이더가 공유 `pi-ai` refresher에 맞지 않는 경우                                                                                         |
| 26  | `buildAuthDoctorHint`             | OAuth refresh 실패 시 추가되는 복구 힌트 생성                                                                 | 프로바이더가 refresh 실패 후 프로바이더 소유 auth 복구 안내를 필요로 하는 경우                                                               |
| 27  | `matchesContextOverflowError`     | 프로바이더 소유 컨텍스트 윈도우 초과 오류 매처                                                                | 프로바이더에 일반 휴리스틱이 놓치는 원시 overflow 오류가 있는 경우                                                                           |
| 28  | `classifyFailoverReason`          | 프로바이더 소유 failover 이유 분류                                                                            | 프로바이더가 원시 API/전송 오류를 rate-limit/overload 등으로 매핑할 수 있는 경우                                                             |
| 29  | `isCacheTtlEligible`              | 프록시/백홀 프로바이더에 대한 프롬프트 캐시 정책                                                              | 프로바이더가 프록시 전용 캐시 TTL 게이팅을 필요로 하는 경우                                                                                  |
| 30  | `buildMissingAuthMessage`         | 일반 missing-auth 복구 메시지를 대체                                                                          | 프로바이더가 프로바이더별 missing-auth 복구 힌트를 필요로 하는 경우                                                                          |
| 31  | `suppressBuiltInModel`            | 오래된 업스트림 모델 숨김 및 선택적 사용자 대상 오류 힌트                                                     | 프로바이더가 오래된 업스트림 항목을 숨기거나 벤더 힌트로 대체해야 하는 경우                                                                   |
| 32  | `augmentModelCatalog`             | 탐색 후 synthetic/final 카탈로그 행을 추가                                                                    | 프로바이더가 `models list` 및 picker에서 synthetic forward-compat 항목을 필요로 하는 경우                                                   |
| 33  | `isBinaryThinking`                | binary-thinking 프로바이더에 대한 on/off reasoning 토글                                                       | 프로바이더가 이진형 thinking on/off만 제공하는 경우                                                                                          |
| 34  | `supportsXHighThinking`           | 선택된 모델에 대한 `xhigh` reasoning 지원                                                                     | 프로바이더가 일부 모델에만 `xhigh`를 적용하려는 경우                                                                                         |
| 35  | `resolveDefaultThinkingLevel`     | 특정 모델 패밀리에 대한 기본 `/think` 수준                                                                    | 프로바이더가 모델 패밀리의 기본 `/think` 정책을 소유하는 경우                                                                                |
| 36  | `isModernModelRef`                | live profile 필터 및 smoke 선택을 위한 현대식 모델 매처                                                      | 프로바이더가 live/smoke 선호 모델 매칭을 소유하는 경우                                                                                       |
| 37  | `prepareRuntimeAuth`              | 추론 직전에 구성된 자격 증명을 실제 런타임 토큰/키로 교환                                                    | 프로바이더가 토큰 교환 또는 수명이 짧은 요청 자격 증명을 필요로 하는 경우                                                                    |
| 38  | `resolveUsageAuth`                | `/usage` 및 관련 상태 표면에 대한 사용량/청구 자격 증명을 해결                                               | 프로바이더가 커스텀 사용량/할당량 토큰 파싱 또는 다른 사용량 자격 증명을 필요로 하는 경우                                                   |
| 39  | `fetchUsageSnapshot`              | auth가 해결된 후 프로바이더별 사용량/할당량 스냅샷을 가져오고 정규화                                          | 프로바이더가 프로바이더별 사용량 엔드포인트 또는 페이로드 파서를 필요로 하는 경우                                                           |
| 40  | `createEmbeddingProvider`         | memory/search를 위한 프로바이더 소유 embedding 어댑터를 빌드                                                 | memory embedding 동작이 프로바이더 플러그인에 속하는 경우                                                                                   |
| 41  | `buildReplayPolicy`               | 프로바이더의 transcript 처리를 제어하는 replay 정책을 반환                                                   | 프로바이더가 커스텀 transcript 정책(예: thinking block 제거)을 필요로 하는 경우                                                             |
| 42  | `sanitizeReplayHistory`           | 일반 transcript 정리 후 replay 기록을 재작성                                                                 | 프로바이더가 공유 compaction 헬퍼를 넘어서는 프로바이더별 replay 재작성을 필요로 하는 경우                                                  |
| 43  | `validateReplayTurns`             | embedded runner 이전의 최종 replay turn 검증 또는 재구성                                                     | 프로바이더 전송이 일반 정리 이후 더 엄격한 turn 검증을 필요로 하는 경우                                                                     |
| 44  | `onModelSelected`                 | 모델이 활성화될 때 프로바이더 소유 후속 선택 부작용을 실행                                                   | 모델이 활성화될 때 프로바이더가 텔레메트리 또는 프로바이더 소유 상태를 필요로 하는 경우                                                     |

`normalizeModelId`, `normalizeTransport`, `normalizeConfig`는 먼저
일치하는 프로바이더 플러그인을 확인한 다음, 실제로 model id 또는
transport/config를 변경하는 플러그인이 나올 때까지 다른 hook 지원 프로바이더 플러그인으로
순차적으로 넘어갑니다. 이렇게 하면 호출자가 어떤 번들 플러그인이
재작성을 소유하는지 알 필요 없이 alias/호환 프로바이더 shim이 계속 작동합니다.
어떤 프로바이더 hook도 지원되는 Google 계열 config 항목을 재작성하지 않으면,
번들 Google config normalizer가 여전히 해당 호환성 정리를 적용합니다.

프로바이더에 완전히 사용자 정의된 wire protocol 또는 사용자 정의 요청 실행기가 필요하다면,
그것은 다른 종류의 extension입니다. 이러한 hooks는
여전히 OpenClaw의 일반 추론 루프에서 실행되는 프로바이더 동작을 위한 것입니다.

### 프로바이더 예시

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
  `wrapStreamFn`을 사용합니다. 이는 Claude 4.6 forward-compat,
  프로바이더 패밀리 힌트, auth 복구 안내, usage 엔드포인트 통합,
  프롬프트 캐시 적격성, auth 인지형 config 기본값, Claude
  기본/적응형 thinking 정책, 베타 헤더를 위한 Anthropic 전용 스트림 형태 조정,
  `/fast` / `serviceTier`, `context1m`을 소유하기 때문입니다.
- Anthropic의 Claude 전용 스트림 헬퍼는 현재 번들 플러그인의 자체
  공개 `api.ts` / `contract-api.ts` 경계에 남아 있습니다. 이 패키지 표면은
  하나의 프로바이더의 beta-header 규칙 때문에 일반 SDK를 넓히는 대신
  `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, 그리고 더 하위 수준의
  Anthropic 래퍼 빌더를 export합니다.
- OpenAI는 `resolveDynamicModel`, `normalizeResolvedModel`,
  `capabilities`와 함께 `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking`, `isModernModelRef`를 사용합니다.
  이는 GPT-5.4 forward-compat, 직접 OpenAI의
  `openai-completions` -> `openai-responses` 정규화, Codex 인지형 auth
  힌트, Spark 억제, synthetic OpenAI 목록 행, GPT-5 thinking /
  live-model 정책을 소유하기 때문입니다. `openai-responses-defaults` 스트림 패밀리는
  attribution 헤더, `/fast`/`serviceTier`, 텍스트 verbosity, 기본 Codex 웹 검색,
  reasoning-compat 페이로드 형태 조정, Responses 컨텍스트 관리를 위한
  공유 기본 OpenAI Responses 래퍼를 소유합니다.
- OpenRouter는 `catalog`와 함께 `resolveDynamicModel`,
  `prepareDynamicModel`을 사용합니다. 이 프로바이더는 패스스루 방식이며,
  OpenClaw의 정적 카탈로그가 업데이트되기 전에 새로운
  model id를 노출할 수 있기 때문입니다. 또한
  `capabilities`, `wrapStreamFn`, `isCacheTtlEligible`를 사용하여
  프로바이더별 요청 헤더, 라우팅 메타데이터, reasoning 패치,
  프롬프트 캐시 정책을 core 밖에 유지합니다. replay 정책은
  `passthrough-gemini` 패밀리에서 오며, `openrouter-thinking` 스트림 패밀리는
  프록시 reasoning 주입과 지원되지 않는 모델 / `auto` 건너뛰기를 소유합니다.
- GitHub Copilot은 `catalog`, `auth`, `resolveDynamicModel`,
  `capabilities`와 함께 `prepareRuntimeAuth`, `fetchUsageSnapshot`을 사용합니다.
  이는 프로바이더 소유 디바이스 로그인, 모델 폴백 동작, Claude transcript
  특이사항, GitHub token -> Copilot token 교환,
  프로바이더 소유 usage 엔드포인트가 필요하기 때문입니다.
- OpenAI Codex는 `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth`, `augmentModelCatalog`와 함께
  `prepareExtraParams`, `resolveUsageAuth`, `fetchUsageSnapshot`을 사용합니다. 이는
  여전히 core OpenAI transport에서 실행되지만, transport/base URL
  정규화, OAuth refresh 폴백 정책, 기본 transport 선택,
  synthetic Codex 카탈로그 행, ChatGPT usage 엔드포인트 통합을 소유하기 때문입니다.
  direct OpenAI와 동일한 `openai-responses-defaults` 스트림 패밀리를 공유합니다.
- Google AI Studio와 Gemini CLI OAuth는 `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn`, `isModernModelRef`를 사용합니다. 이는
  `google-gemini` replay 패밀리가 Gemini 3.1 forward-compat 폴백,
  기본 Gemini replay 검증, bootstrap replay 정리, 태그 기반
  reasoning-output 모드, 현대식 모델 매칭을 소유하고,
  `google-thinking` 스트림 패밀리가 Gemini thinking 페이로드 정규화를
  소유하기 때문입니다. Gemini CLI OAuth는 또한 토큰 형식화, 토큰 파싱,
  quota 엔드포인트 연결을 위해 `formatApiKey`, `resolveUsageAuth`,
  `fetchUsageSnapshot`도 사용합니다.
- Anthropic Vertex는
  `anthropic-by-model` replay 패밀리를 통해 `buildReplayPolicy`를 사용합니다.
  이렇게 하면 Claude 전용 replay 정리가 모든 `anthropic-messages` transport가 아니라
  Claude id에만 한정됩니다.
- Amazon Bedrock은 `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `resolveDefaultThinkingLevel`을 사용합니다. 이는
  Bedrock이 Anthropic-on-Bedrock 트래픽에 대한 Bedrock 전용
  throttle/not-ready/context-overflow 오류 분류를 소유하기 때문입니다.
  replay 정책은 여전히 동일한 Claude 전용 `anthropic-by-model` 가드를 공유합니다.
- OpenRouter, Kilocode, Opencode, Opencode Go는
  `passthrough-gemini` replay 패밀리를 통해 `buildReplayPolicy`를 사용합니다.
  이는 OpenAI 호환 transport를 통해 Gemini
  모델을 프록시하며, 기본 Gemini replay 검증이나
  bootstrap 재작성 없이 Gemini thought-signature 정리가 필요하기 때문입니다.
- MiniMax는
  `hybrid-anthropic-openai` replay 패밀리를 통해 `buildReplayPolicy`를 사용합니다.
  이는 하나의 프로바이더가 Anthropic-message와 OpenAI 호환 의미 체계를 모두 소유하기 때문입니다.
  Anthropic 쪽에서는 Claude 전용 thinking block 제거를 유지하면서
  reasoning output mode를 다시 기본 방식으로 재정의하고,
  `minimax-fast-mode` 스트림 패밀리는 공유 스트림 경로에서
  fast-mode 모델 재작성을 소유합니다.
- Moonshot은 `catalog`와 함께 `wrapStreamFn`을 사용합니다. 여전히 공유
  OpenAI transport를 사용하지만 프로바이더 소유 thinking 페이로드 정규화가 필요하기 때문입니다.
  `moonshot-thinking` 스트림 패밀리는 config와 `/think` 상태를
  자체 기본 이진 thinking 페이로드에 매핑합니다.
- Kilocode는 `catalog`, `capabilities`, `wrapStreamFn`,
  `isCacheTtlEligible`를 사용합니다. 이는 프로바이더 소유 요청 헤더,
  reasoning 페이로드 정규화, Gemini transcript 힌트,
  Anthropic cache-TTL 게이팅이 필요하기 때문입니다.
  `kilocode-thinking` 스트림 패밀리는 공유 프록시 스트림 경로에서 Kilo thinking 주입을 유지하면서,
  명시적 reasoning 페이로드를 지원하지 않는 `kilo/auto` 및
  기타 프록시 model id는 건너뜁니다.
- Z.AI는 `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth`, `fetchUsageSnapshot`을 사용합니다. 이는 GLM-5 폴백,
  `tool_stream` 기본값, 이진 thinking UX, 현대식 모델 매칭,
  그리고 usage auth + quota 가져오기를 모두 소유하기 때문입니다.
  `tool-stream-default-on` 스트림 패밀리는 기본 활성화된 `tool_stream` 래퍼를
  프로바이더별 수기 연결 코드 밖에 유지합니다.
- xAI는 `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel`, `isModernModelRef`를 사용합니다.
  이는 기본 xAI Responses transport 정규화, Grok fast-mode
  alias 재작성, 기본 `tool_stream`, strict-tool / reasoning-payload
  정리, 플러그인 소유 도구를 위한 폴백 auth 재사용, forward-compat Grok
  모델 해결, xAI tool-schema 프로필,
  지원되지 않는 스키마 keyword, 기본 `web_search`, HTML 엔티티
  tool-call 인수 디코딩과 같은 프로바이더 소유 호환성 패치를 소유하기 때문입니다.
- Mistral, OpenCode Zen, OpenCode Go는 core 밖에 transcript/tooling
  특이사항을 유지하기 위해 `capabilities`만 사용합니다.
- `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway`, `volcengine` 같은
  카탈로그 전용 번들 프로바이더는 `catalog`만 사용합니다.
- Qwen은 텍스트 프로바이더를 위해 `catalog`를 사용하고, 멀티모달 표면을 위해
  공유 media-understanding 및 video-generation 등록도 함께 사용합니다.
- MiniMax와 Xiaomi는 `catalog`와 usage hooks를 함께 사용합니다. 추론은
  여전히 공유 transport를 통해 실행되지만 `/usage`
  동작은 플러그인이 소유하기 때문입니다.

## 런타임 헬퍼

플러그인은 `api.runtime`를 통해 선택된 core 헬퍼에 접근할 수 있습니다. TTS의 경우:

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

- `textToSpeech`는 파일/voice-note 표면에 대한 일반 core TTS 출력 페이로드를 반환합니다.
- core `messages.tts` 구성과 프로바이더 선택을 사용합니다.
- PCM 오디오 버퍼 + 샘플링 레이트를 반환합니다. 플러그인은 프로바이더에 맞게 재샘플링/인코딩해야 합니다.
- `listVoices`는 프로바이더별로 선택 사항입니다. 벤더 소유 voice picker 또는 setup 흐름에 사용하세요.
- 음성 목록에는 프로바이더 인지형 picker를 위한 locale, gender, personality 태그 같은
  더 풍부한 메타데이터가 포함될 수 있습니다.
- 현재 telephony는 OpenAI와 ElevenLabs가 지원합니다. Microsoft는 지원하지 않습니다.

플러그인은 `api.registerSpeechProvider(...)`를 통해 speech provider를 등록할 수도 있습니다.

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

- TTS 정책, 폴백, 응답 전달은 core에 유지하세요.
- 벤더 소유 합성 동작에는 speech provider를 사용하세요.
- 레거시 Microsoft `edge` 입력은 `microsoft` provider id로 정규화됩니다.
- 권장되는 소유권 모델은 회사 중심입니다. 하나의 벤더 플러그인은
  OpenClaw가 그러한 기능 계약을 추가함에 따라 텍스트, 음성, 이미지, 미래의 미디어 프로바이더까지
  소유할 수 있습니다.

이미지/오디오/비디오 이해의 경우, 플러그인은 일반적인 key/value bag 대신
타입이 지정된 하나의 media-understanding provider를 등록합니다.

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

- 오케스트레이션, 폴백, config, 채널 연결은 core에 유지하세요.
- 벤더 동작은 프로바이더 플러그인에 유지하세요.
- 확장은 타입이 유지되는 방식으로 점진적으로 이루어져야 합니다. 즉, 새로운 선택적 메서드,
  새로운 선택적 결과 필드, 새로운 선택적 기능 방식이어야 합니다.
- 비디오 생성도 이미 동일한 패턴을 따릅니다.
  - core가 기능 계약과 런타임 헬퍼를 소유합니다
  - 벤더 플러그인이 `api.registerVideoGenerationProvider(...)`를 등록합니다
  - 기능/채널 플러그인이 `api.runtime.videoGeneration.*`을 소비합니다

media-understanding 런타임 헬퍼의 경우 플러그인은 다음을 호출할 수 있습니다.

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

오디오 전사의 경우 플러그인은 media-understanding 런타임이나
이전 STT 별칭 중 하나를 사용할 수 있습니다.

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

참고:

- `api.runtime.mediaUnderstanding.*`은
  이미지/오디오/비디오 이해를 위한 권장 공유 표면입니다.
- core media-understanding 오디오 구성(`tools.media.audio`)과 프로바이더 폴백 순서를 사용합니다.
- 전사 출력이 생성되지 않으면(예: 건너뜀/지원되지 않는 입력) `{ text: undefined }`를 반환합니다.
- `api.runtime.stt.transcribeAudioFile(...)`는 호환성 별칭으로 계속 유지됩니다.

플러그인은 `api.runtime.subagent`를 통해 백그라운드 subagent 실행을 시작할 수도 있습니다.

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

- `provider`와 `model`은 영구적인 세션 변경이 아니라 실행 단위의 선택적 재정의입니다.
- OpenClaw는 신뢰된 호출자에 대해서만 이러한 재정의 필드를 허용합니다.
- 플러그인 소유 폴백 실행의 경우 운영자는 `plugins.entries.<id>.subagent.allowModelOverride: true`로 명시적으로 동의해야 합니다.
- 신뢰된 플러그인을 특정 정식 `provider/model` 대상만 사용하도록 제한하려면 `plugins.entries.<id>.subagent.allowedModels`를 사용하세요. 어떤 대상이든 명시적으로 허용하려면 `"*"`를 사용하세요.
- 신뢰되지 않은 플러그인의 subagent 실행도 여전히 작동하지만, 재정의 요청은 조용히 폴백되지 않고 거부됩니다.

웹 검색의 경우, 플러그인은 에이전트 tool 연결에 직접 접근하는 대신
공유 런타임 헬퍼를 사용할 수 있습니다.

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

플러그인은 또한
`api.registerWebSearchProvider(...)`를 통해 웹 검색 프로바이더를 등록할 수 있습니다.

참고:

- 프로바이더 선택, 자격 증명 해결, 공유 요청 의미 체계는 core에 유지하세요.
- 벤더별 검색 전송에는 웹 검색 프로바이더를 사용하세요.
- `api.runtime.webSearch.*`는 에이전트 tool 래퍼에 의존하지 않고 검색 동작이 필요한 기능/채널 플러그인을 위한 권장 공유 표면입니다.

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

- `generate(...)`: 구성된 이미지 생성 프로바이더 체인을 사용해 이미지를 생성합니다.
- `listProviders(...)`: 사용 가능한 이미지 생성 프로바이더와 그 기능을 나열합니다.

## Gateway HTTP 라우트

플러그인은 `api.registerHttpRoute(...)`를 사용해 HTTP 엔드포인트를 노출할 수 있습니다.

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

라우트 필드:

- `path`: gateway HTTP 서버 아래의 라우트 경로
- `auth`: 필수. 일반 gateway auth를 요구하려면 `"gateway"`를, 플러그인 관리 auth/webhook 검증에는 `"plugin"`을 사용합니다.
- `match`: 선택 사항. `"exact"`(기본값) 또는 `"prefix"`.
- `replaceExisting`: 선택 사항. 같은 플러그인이 자신의 기존 라우트 등록을 교체할 수 있게 합니다.
- `handler`: 라우트가 요청을 처리했으면 `true`를 반환합니다.

참고:

- `api.registerHttpHandler(...)`는 제거되었으며 플러그인 로드 오류를 발생시킵니다. 대신 `api.registerHttpRoute(...)`를 사용하세요.
- 플러그인 라우트는 `auth`를 명시적으로 선언해야 합니다.
- 정확히 같은 `path + match` 충돌은 `replaceExisting: true`가 아닌 한 거부되며, 한 플러그인은 다른 플러그인의 라우트를 교체할 수 없습니다.
- `auth` 수준이 다른 겹치는 라우트는 거부됩니다. `exact`/`prefix` 폴스루 체인은 동일한 auth 수준 내에서만 유지하세요.
- `auth: "plugin"` 라우트는 운영자 런타임 scope를 자동으로 받지 **않습니다**. 이는 권한 있는 Gateway 헬퍼 호출이 아니라 플러그인 관리 webhook/서명 검증을 위한 것입니다.
- `auth: "gateway"` 라우트는 Gateway 요청 런타임 scope 내부에서 실행되지만, 그 scope는 의도적으로 보수적입니다.
  - 공유 비밀 bearer auth(`gateway.auth.mode = "token"` / `"password"`)는 호출자가 `x-openclaw-scopes`를 보내더라도 플러그인 라우트 런타임 scope를 `operator.write`에 고정합니다
  - 신뢰된 ID 포함 HTTP 모드(예: `trusted-proxy` 또는 private ingress에서의 `gateway.auth.mode = "none"`)는 헤더가 명시적으로 존재할 때만 `x-openclaw-scopes`를 존중합니다
  - 그러한 ID 포함 플러그인 라우트 요청에서 `x-openclaw-scopes`가 없으면 런타임 scope는 `operator.write`로 폴백됩니다
- 실용적인 규칙: gateway auth 플러그인 라우트가 암묵적인 관리자 표면이라고 가정하지 마세요. 라우트에 관리자 전용 동작이 필요하면, ID 포함 auth 모드를 요구하고 명시적 `x-openclaw-scopes` 헤더 계약을 문서화하세요.

## 플러그인 SDK import 경로

플러그인을 작성할 때는 단일한 `openclaw/plugin-sdk` import 대신
SDK subpath를 사용하세요.

- 플러그인 등록 기본 요소에는 `openclaw/plugin-sdk/plugin-entry`
- 일반 공유 플러그인 대상 계약에는 `openclaw/plugin-sdk/core`
- 루트 `openclaw.json` Zod 스키마 export(`OpenClawSchema`)에는 `openclaw/plugin-sdk/config-schema`
- 안정적인 채널 기본 요소에는 `openclaw/plugin-sdk/channel-setup`,
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
  `openclaw/plugin-sdk/webhook-ingress`를 사용하여 공유 setup/auth/reply/webhook
  연결을 처리합니다. `channel-inbound`는 디바운스, 멘션 매칭,
  인바운드 mention-policy 헬퍼, envelope 포맷팅, 인바운드 envelope
  컨텍스트 헬퍼를 위한 공유 홈입니다.
  `channel-setup`은 좁은 optional-install setup 경계입니다.
  `setup-runtime`은 `setupEntry` /
  지연 시작에서 사용하는 런타임 안전 setup 표면이며, import-safe setup 패치 어댑터를 포함합니다.
  `setup-adapter-runtime`은 env 인지형 account-setup 어댑터 경계입니다.
  `setup-tools`는 작은 CLI/archive/docs 헬퍼 경계(`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`)입니다.
- 도메인 subpath에는 `openclaw/plugin-sdk/channel-config-helpers`,
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
  `openclaw/plugin-sdk/directory-runtime`를 사용하여 공유 런타임/config 헬퍼를 처리합니다.
  `telegram-command-config`는 Telegram 사용자 정의
  명령 정규화/검증을 위한 좁은 공개 경계이며, 번들
  Telegram 계약 표면을 일시적으로 사용할 수 없더라도 계속 제공됩니다.
  `text-runtime`은 어시스턴트 가시 텍스트 제거, markdown 렌더링/청킹 헬퍼, redaction
  헬퍼, directive-tag 헬퍼, safe-text 유틸리티를 포함한
  공유 텍스트/markdown/logging 경계입니다.
- 승인 전용 채널 경계는 플러그인의 하나의 `approvalCapability`
  계약을 우선 사용해야 합니다. 그러면 core는 관련 없는 플러그인 필드에
  승인 동작을 섞는 대신, 그 하나의 기능을 통해 승인 auth, 전달, 렌더링,
  기본 라우팅, 지연 기본 핸들러 동작을 읽습니다.
- `openclaw/plugin-sdk/channel-runtime`은 더 이상 권장되지 않으며
  이전 플러그인을 위한 호환성 shim으로만 남아 있습니다. 새 코드는 대신 더 좁은
  일반 기본 요소를 import해야 하며, repo 코드도 shim에 대한 새 import를 추가해서는 안 됩니다.
- 번들 extension 내부는 비공개로 유지됩니다. 외부 플러그인은
  `openclaw/plugin-sdk/*` subpath만 사용해야 합니다. OpenClaw core/test 코드는
  `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js`, `login-qr-api.js` 같은 좁은 범위의 파일 등
  플러그인 패키지 루트 아래의 repo 공개 엔트리 포인트를 사용할 수 있습니다.
  core 또는 다른 extension에서는 플러그인 패키지의 `src/*`를 절대 import하지 마세요.
- repo 엔트리 포인트 분리:
  `<plugin-package-root>/api.js`는 헬퍼/타입 barrel,
  `<plugin-package-root>/runtime-api.js`는 런타임 전용 barrel,
  `<plugin-package-root>/index.js`는 번들 플러그인 엔트리,
  `<plugin-package-root>/setup-entry.js`는 setup 플러그인 엔트리입니다.
- 현재 번들 프로바이더 예시:
  - Anthropic은 `wrapAnthropicProviderStream`, beta-header 헬퍼,
    `service_tier` 파싱과 같은 Claude 스트림 헬퍼를 위해 `api.js` / `contract-api.js`를 사용합니다.
  - OpenAI는 프로바이더 빌더, 기본 모델 헬퍼,
    실시간 프로바이더 빌더를 위해 `api.js`를 사용합니다.
  - OpenRouter는 프로바이더 빌더와 온보딩/config
    헬퍼를 위해 `api.js`를 사용하며, `register.runtime.js`는 여전히 repo 로컬 사용을 위해
    일반 `plugin-sdk/provider-stream` 헬퍼를 다시 export할 수 있습니다.
- facade로 로드되는 공개 엔트리 포인트는 활성 런타임 config 스냅샷이 존재하면 이를 우선 사용하고,
  OpenClaw가 아직 런타임 스냅샷을 제공하지 않는 경우에는 디스크에서 해결된 config 파일로 폴백합니다.
- 일반 공유 기본 요소는 여전히 선호되는 공개 SDK 계약입니다. 번들 채널 브랜드가 붙은
  소수의 예약된 호환성 헬퍼 경계가 여전히 존재합니다. 이를
  새로운 서드파티 import 대상이 아니라 번들 유지보수/호환성 경계로 취급하세요.
  새로운 교차 채널 계약은 여전히 일반 `plugin-sdk/*` subpath 또는
  플러그인 로컬 `api.js` / `runtime-api.js` barrel에 도입되어야 합니다.

호환성 참고:

- 새 코드에서는 루트 `openclaw/plugin-sdk` barrel을 피하세요.
- 먼저 좁고 안정적인 기본 요소를 우선하세요. 더 새로운 setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool subpath가 새로운
  번들 및 외부 플러그인 작업을 위한 의도된 계약입니다.
  대상 파싱/매칭은 `openclaw/plugin-sdk/channel-targets`에 속합니다.
  메시지 작업 게이트와 반응 message-id 헬퍼는
  `openclaw/plugin-sdk/channel-actions`에 속합니다.
- 번들 extension 전용 헬퍼 barrel은 기본적으로 안정적이지 않습니다. 어떤
  헬퍼가 번들 extension에만 필요하다면, 이를
  `openclaw/plugin-sdk/<extension>`으로 승격하는 대신 해당 extension의 로컬
  `api.js` 또는 `runtime-api.js` 경계 뒤에 유지하세요.
- 새로운 공유 헬퍼 경계는 채널 브랜드가 붙은 것이 아니라 일반적이어야 합니다. 공유 대상
  파싱은 `openclaw/plugin-sdk/channel-targets`에 속하고, 채널별
  내부 구현은 소유 플러그인의 로컬 `api.js` 또는 `runtime-api.js`
  경계 뒤에 유지됩니다.
- `image-generation`,
  `media-understanding`, `speech` 같은 기능별 subpath는 번들/기본 플러그인이
  오늘날 이를 사용하고 있기 때문에 존재합니다. 이것이 존재한다고 해서
  export된 모든 헬퍼가 장기적으로 고정된 외부 계약이라는 뜻은 아닙니다.

## 메시지 tool 스키마

플러그인은 채널별 `describeMessageTool(...)` 스키마
기여를 소유해야 합니다. 프로바이더별 필드는 공유 core가 아니라 플러그인에 두세요.

공유 가능한 이식형 스키마 조각에는
`openclaw/plugin-sdk/channel-actions`를 통해 export되는 일반 헬퍼를 재사용하세요.

- 버튼 그리드 스타일 페이로드에는 `createMessageToolButtonsSchema()`
- 구조화된 카드 페이로드에는 `createMessageToolCardSchema()`

어떤 스키마 형태가 하나의 프로바이더에서만 의미가 있다면, 이를 공유 SDK로 승격하지 말고
해당 플러그인의 자체 소스에 정의하세요.

## 채널 대상 해결

채널 플러그인은 채널별 대상 의미 체계를 소유해야 합니다. 공유
아웃바운드 호스트는 일반적으로 유지하고, 프로바이더 규칙에는 메시징 어댑터 표면을 사용하세요.

- `messaging.inferTargetChatType({ to })`는 정규화된 대상이
  디렉터리 조회 전에 `direct`, `group`, `channel` 중 무엇으로 처리되어야 하는지 결정합니다.
- `messaging.targetResolver.looksLikeId(raw, normalized)`는
  어떤 입력이 디렉터리 검색 대신 ID 유사 해결로 바로 건너뛰어야 하는지 core에 알려줍니다.
- `messaging.targetResolver.resolveTarget(...)`는 정규화 후 또는
  디렉터리 조회 실패 후 core에 최종 프로바이더 소유 해결이 필요할 때 플러그인 폴백이 됩니다.
- `messaging.resolveOutboundSessionRoute(...)`는 대상이 해결된 뒤
  프로바이더별 세션 라우트 구성을 소유합니다.

권장 분리 방식:

- 피어/그룹 검색 전에 이루어져야 하는 범주 결정에는 `inferTargetChatType`을 사용하세요.
- "이를 명시적/기본 대상 ID로 처리" 검사에는 `looksLikeId`를 사용하세요.
- 광범위한 디렉터리 검색이 아니라 프로바이더별 정규화 폴백에는 `resolveTarget`을 사용하세요.
- 채팅 ID, 스레드 ID, JID, 핸들, 방 ID 같은 프로바이더 기본 ID는
  일반 SDK 필드가 아니라 `target` 값 또는 프로바이더별 매개변수 안에 유지하세요.

## config 기반 디렉터리

config에서 디렉터리 항목을 도출하는 플러그인은 해당 로직을 플러그인 내부에 두고
`openclaw/plugin-sdk/directory-runtime`의 공유 헬퍼를 재사용해야 합니다.

이는 채널에 다음과 같은 config 기반 peer/group이 필요할 때 사용합니다.

- allowlist 기반 DM peer
- 구성된 채널/그룹 맵
- 계정 범위의 정적 디렉터리 폴백

`directory-runtime`의 공유 헬퍼는 일반 작업만 처리합니다.

- 쿼리 필터링
- limit 적용
- 중복 제거/정규화 헬퍼
- `ChannelDirectoryEntry[]` 빌드

채널별 계정 검사와 ID 정규화는 플러그인 구현에 남겨 두어야 합니다.

## 프로바이더 카탈로그

프로바이더 플러그인은
`registerProvider({ catalog: { run(...) { ... } } })`를 사용해 추론용 모델 카탈로그를 정의할 수 있습니다.

`catalog.run(...)`은 OpenClaw가 `models.providers`에 기록하는 것과 동일한 형태를 반환합니다.

- 하나의 프로바이더 항목에는 `{ provider }`
- 여러 프로바이더 항목에는 `{ providers }`

플러그인이 프로바이더별 model id, 기본 base URL, 또는 auth 게이트 모델 메타데이터를
소유할 때는 `catalog`를 사용하세요.

`catalog.order`는 플러그인의 카탈로그가 OpenClaw의
내장 암시적 프로바이더와 비교해 언제 병합되는지를 제어합니다.

- `simple`: 일반 API 키 또는 env 기반 프로바이더
- `profile`: auth profile이 존재할 때 나타나는 프로바이더
- `paired`: 여러 관련 프로바이더 항목을 합성하는 프로바이더
- `late`: 다른 암시적 프로바이더 이후의 마지막 단계

나중 단계의 프로바이더가 키 충돌 시 우선하므로, 플러그인은 동일한 provider id를 가진
내장 프로바이더 항목을 의도적으로 재정의할 수 있습니다.

호환성:

- `discovery`는 여전히 레거시 별칭으로 작동합니다
- `catalog`와 `discovery`가 모두 등록되어 있으면 OpenClaw는 `catalog`를 사용합니다

## 읽기 전용 채널 검사

플러그인이 채널을 등록하는 경우,
`resolveAccount(...)`와 함께 `plugin.config.inspectAccount(cfg, accountId)` 구현을 우선하세요.

이유:

- `resolveAccount(...)`는 런타임 경로입니다. 자격 증명이
  완전히 구체화되었다고 가정할 수 있으며, 필요한 secret이 없으면 빠르게 실패해도 됩니다.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, doctor/config
  복구 흐름 같은 읽기 전용 명령 경로는 단순히 구성을 설명하기 위해
  런타임 자격 증명을 구체화할 필요가 없어야 합니다.

권장 `inspectAccount(...)` 동작:

- 설명용 계정 상태만 반환하세요.
- `enabled`와 `configured`를 유지하세요.
- 관련이 있다면 다음과 같은 자격 증명 소스/상태 필드를 포함하세요.
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 읽기 전용 가용성을 보고하기 위해 원시 토큰 값을 반환할 필요는 없습니다.
  상태 스타일 명령에는 `tokenStatus: "available"`(및 일치하는 소스 필드)만 반환해도 충분합니다.
- 자격 증명이 SecretRef를 통해 구성되었지만 현재 명령 경로에서 사용할 수 없다면
  `configured_unavailable`을 사용하세요.

이렇게 하면 읽기 전용 명령이 크래시하거나 계정이 구성되지 않은 것으로 잘못 보고하는 대신,
"구성되어 있지만 이 명령 경로에서는 사용할 수 없음"을 보고할 수 있습니다.

## 패키지 팩

플러그인 디렉터리는 `openclaw.extensions`가 포함된 `package.json`을 가질 수 있습니다.

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

각 항목은 하나의 플러그인이 됩니다. 팩에 여러 extension이 나열되면, 플러그인 id는
`name/<fileBase>`가 됩니다.

플러그인이 npm 의존성을 import한다면, 해당 디렉터리에
`node_modules`를 사용할 수 있도록 설치하세요(`npm install` / `pnpm install`).

보안 가드레일: 모든 `openclaw.extensions` 항목은 심볼릭 링크 해결 후에도
플러그인 디렉터리 내부에 있어야 합니다. 패키지 디렉터리를 벗어나는 항목은
거부됩니다.

보안 참고: `openclaw plugins install`은 플러그인 의존성을
`npm install --omit=dev --ignore-scripts`로 설치합니다(라이프사이클 스크립트 없음, 런타임에 dev 의존성 없음). 플러그인 의존성
트리는 "순수 JS/TS"로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.

선택 사항: `openclaw.setupEntry`는 가벼운 setup 전용 모듈을 가리킬 수 있습니다.
OpenClaw가 비활성화된 채널 플러그인에 대한 setup 표면이 필요하거나,
채널 플러그인이 활성화되었지만 아직 구성되지 않은 경우,
전체 플러그인 엔트리 대신 `setupEntry`를 로드합니다. 이렇게 하면
주 플러그인 엔트리가 도구, hooks, 기타 런타임 전용
코드도 연결하는 경우 시작과 setup를 더 가볍게 유지할 수 있습니다.

선택 사항: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`은
채널이 이미 구성된 경우에도 게이트웨이의
pre-listen 시작 단계 동안 채널 플러그인을 같은 `setupEntry` 경로로 선택할 수 있게 합니다.

이 옵션은 `setupEntry`가 게이트웨이가 수신을 시작하기 전에
존재해야 하는 시작 표면을 완전히 포함할 때만 사용하세요. 실제로 이는 setup 엔트리가
다음과 같이 시작 시 의존하는 모든 채널 소유 기능을 등록해야 함을 의미합니다.

- 채널 등록 자체
- 게이트웨이가 수신을 시작하기 전에 사용 가능해야 하는 모든 HTTP 라우트
- 같은 시점에 존재해야 하는 모든 gateway 메서드, 도구, 서비스

전체 엔트리가 여전히 필수 시작 기능을 하나라도 소유하고 있다면,
이 플래그를 활성화하지 마세요. 기본 동작을 유지하고 OpenClaw가
시작 중 전체 엔트리를 로드하도록 하세요.

번들 채널은 전체 채널 런타임이 로드되기 전에 core가 참조할 수 있는
setup 전용 계약 표면 헬퍼도 게시할 수 있습니다. 현재 setup
승격 표면은 다음과 같습니다.

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core는 전체 플러그인 엔트리를 로드하지 않고도 레거시 단일 계정 채널
config를 `channels.<id>.accounts.*`로 승격해야 할 때 이 표면을 사용합니다.
현재 번들 예시는 Matrix입니다. Matrix는 named account가 이미 존재할 때
인증/부트스트랩 키만 이름이 있는 승격 계정으로 이동하며,
항상 `accounts.default`를 만드는 대신 구성된 비정규 default-account 키를
보존할 수 있습니다.

이러한 setup 패치 어댑터는 번들 계약 표면 탐색을 지연 상태로 유지합니다.
import 시점은 가볍게 유지되고, 승격 표면은 모듈 import 중에 번들 채널 시작을
다시 진입하는 대신 처음 사용할 때만 로드됩니다.

이러한 시작 표면에 gateway RPC 메서드가 포함된다면,
플러그인별 prefix를 유지하세요. core 관리자 네임스페이스(`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`)는 예약되어 있으며, 플러그인이
더 좁은 scope를 요청하더라도 항상 `operator.admin`으로 해결됩니다.

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

채널 플러그인은 `openclaw.channel`을 통해 setup/탐색 메타데이터를,
`openclaw.install`을 통해 설치 힌트를 광고할 수 있습니다. 이렇게 하면 core 카탈로그를 데이터 비의존적으로 유지할 수 있습니다.

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

- `detailLabel`: 더 풍부한 카탈로그/상태 표면을 위한 보조 레이블
- `docsLabel`: 문서 링크의 링크 텍스트 재정의
- `preferOver`: 이 카탈로그 항목이 더 높은 우선순위를 가져야 하는 낮은 우선순위 플러그인/채널 ID
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: 선택 표면 복사 제어
- `markdownCapable`: 아웃바운드 포맷 결정 시 채널이 markdown 가능함을 표시
- `exposure.configured`: `false`로 설정 시 구성된 채널 목록 표면에서 채널 숨김
- `exposure.setup`: `false`로 설정 시 대화형 setup/configure picker에서 채널 숨김
- `exposure.docs`: 문서 탐색 표면에서 채널을 내부/비공개로 표시
- `showConfigured` / `showInSetup`: 호환성을 위해 여전히 허용되는 레거시 별칭이며, `exposure` 사용을 권장
- `quickstartAllowFrom`: 채널을 표준 빠른 시작 `allowFrom` 흐름에 포함
- `forceAccountBinding`: 계정이 하나만 있어도 명시적 계정 바인딩 요구
- `preferSessionLookupForAnnounceTarget`: announce 대상 해결 시 세션 조회를 우선

OpenClaw는 **외부 채널 카탈로그**도 병합할 수 있습니다(예: MPM
레지스트리 export). 다음 위치 중 하나에 JSON 파일을 두세요.

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

또는 `OPENCLAW_PLUGIN_CATALOG_PATHS`(또는 `OPENCLAW_MPM_CATALOG_PATHS`)를
하나 이상의 JSON 파일로 지정하세요(쉼표/세미콜론/`PATH` 구분). 각 파일은
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`를 포함해야 합니다. 파서는 `"entries"` 키의
레거시 별칭으로 `"packages"` 또는 `"plugins"`도 허용합니다.

## 컨텍스트 엔진 플러그인

컨텍스트 엔진 플러그인은 수집, 조립,
압축에 대한 세션 컨텍스트 오케스트레이션을 소유합니다. 플러그인에서
`api.registerContextEngine(id, factory)`로 등록한 다음,
`plugins.slots.contextEngine`으로 활성 엔진을 선택하세요.

기본 컨텍스트 파이프라인을 단순히 메모리 검색이나 hooks로 확장하는 것이 아니라,
이를 대체하거나 확장해야 하는 경우 이 방식을 사용하세요.

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

엔진이 압축 알고리즘을 **직접 소유하지 않는다면** `compact()`
구현은 유지하고 이를 명시적으로 위임하세요.

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

## 새 기능 추가하기

플러그인에 현재 API에 맞지 않는 동작이 필요하다면,
비공개 직접 접근으로 플러그인 시스템을 우회하지 마세요. 누락된 기능을 추가하세요.

권장 순서:

1. core 계약 정의
   core가 어떤 공유 동작을 소유해야 하는지 결정합니다. 정책, 폴백, config 병합,
   수명 주기, 채널 대상 의미 체계, 런타임 헬퍼 형태를 포함합니다.
2. 타입이 지정된 플러그인 등록/런타임 표면 추가
   가장 작지만 유용한 타입 지정 기능 표면으로 `OpenClawPluginApi` 및/또는 `api.runtime`를 확장합니다.
3. core + 채널/기능 소비자 연결
   채널과 기능 플러그인은 벤더 구현을 직접 import하는 대신
   core를 통해 새 기능을 소비해야 합니다.
4. 벤더 구현 등록
   그런 다음 벤더 플러그인이 해당 기능에 대해 백엔드를 등록합니다.
5. 계약 커버리지 추가
   시간이 지나도 소유권과 등록 형태가 명시적으로 유지되도록 테스트를 추가합니다.

이것이 OpenClaw가 특정한 방향성을 유지하면서도 한 프로바이더의
관점에 하드코딩되지 않는 방식입니다. 구체적인 파일 체크리스트와 예시는
[Capability Cookbook](/ko/plugins/architecture)을 참고하세요.

### 기능 체크리스트

새 기능을 추가할 때 구현은 일반적으로 다음 표면을 함께 다뤄야 합니다.

- `src/<capability>/types.ts`의 core 계약 타입
- `src/<capability>/runtime.ts`의 core runner/런타임 헬퍼
- `src/plugins/types.ts`의 플러그인 API 등록 표면
- `src/plugins/registry.ts`의 플러그인 레지스트리 연결
- 기능/채널 플러그인이 이를 소비해야 하는 경우 `src/plugins/runtime/*`의 플러그인 런타임 노출
- `src/test-utils/plugin-registration.ts`의 캡처/테스트 헬퍼
- `src/plugins/contracts/registry.ts`의 소유권/계약 검증
- `docs/`의 운영자/플러그인 문서

이 표면 중 하나가 빠져 있다면, 일반적으로 해당 기능이
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

- core가 기능 계약과 오케스트레이션을 소유합니다
- 벤더 플러그인이 벤더 구현을 소유합니다
- 기능/채널 플러그인이 런타임 헬퍼를 소비합니다
- 계약 테스트가 소유권을 명시적으로 유지합니다
