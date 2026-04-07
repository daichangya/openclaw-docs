---
read_when:
    - 네이티브 OpenClaw 플러그인을 빌드하거나 디버깅할 때
    - 플러그인 기능 모델 또는 소유권 경계를 이해할 때
    - 플러그인 로드 파이프라인 또는 레지스트리 작업 시
    - 프로바이더 런타임 훅 또는 채널 플러그인을 구현할 때
sidebarTitle: Internals
summary: '플러그인 내부: 기능 모델, 소유권, 계약, 로드 파이프라인, 런타임 헬퍼'
title: 플러그인 내부
x-i18n:
    generated_at: "2026-04-07T06:05:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9c4b0602df12965a29881eab33b0885f991aeefa2a3fdf3cefc1a7770d6dabe0
    source_path: plugins/architecture.md
    workflow: 15
---

# 플러그인 내부

<Info>
  이것은 **심층 아키텍처 참조 문서**입니다. 실용적인 가이드는 다음을 참고하세요:
  - [플러그인 설치 및 사용](/ko/tools/plugin) — 사용자 가이드
  - [시작하기](/ko/plugins/building-plugins) — 첫 번째 플러그인 튜토리얼
  - [채널 플러그인](/ko/plugins/sdk-channel-plugins) — 메시징 채널 빌드
  - [프로바이더 플러그인](/ko/plugins/sdk-provider-plugins) — 모델 프로바이더 빌드
  - [SDK 개요](/ko/plugins/sdk-overview) — import 맵 및 등록 API
</Info>

이 페이지는 OpenClaw 플러그인 시스템의 내부 아키텍처를 다룹니다.

## 공개 기능 모델

기능은 OpenClaw 내부의 공개 **네이티브 플러그인** 모델입니다. 모든
네이티브 OpenClaw 플러그인은 하나 이상의 기능 유형에 대해 등록됩니다:

| 기능                    | 등록 메서드                                      | 예시 플러그인                         |
| ----------------------- | ------------------------------------------------ | ------------------------------------- |
| 텍스트 추론             | `api.registerProvider(...)`                      | `openai`, `anthropic`                 |
| CLI 추론 백엔드         | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                 |
| 음성                    | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`             |
| 실시간 전사             | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                              |
| 실시간 음성             | `api.registerRealtimeVoiceProvider(...)`         | `openai`                              |
| 미디어 이해             | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                    |
| 이미지 생성             | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax`  |
| 음악 생성               | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                   |
| 비디오 생성             | `api.registerVideoGenerationProvider(...)`       | `qwen`                                |
| 웹 가져오기             | `api.registerWebFetchProvider(...)`              | `firecrawl`                           |
| 웹 검색                 | `api.registerWebSearchProvider(...)`             | `google`                              |
| 채널 / 메시징           | `api.registerChannel(...)`                       | `msteams`, `matrix`                   |

기능을 하나도 등록하지 않지만 훅, 도구 또는 서비스를 제공하는
플러그인은 **레거시 hook-only** 플러그인입니다. 이 패턴도 여전히 완전히 지원됩니다.

### 외부 호환성 입장

기능 모델은 이미 코어에 반영되어 있으며 오늘날 번들/네이티브 플러그인에서
사용되고 있지만, 외부 플러그인 호환성은 여전히 "내보내졌으므로 고정되었다"보다
더 엄격한 기준이 필요합니다.

현재 지침:

- **기존 외부 플러그인:** hook 기반 통합이 계속 동작하도록 유지하고,
  이를 호환성 기준선으로 취급합니다
- **새 번들/네이티브 플러그인:** 벤더별 직접 접근이나 새로운 hook-only 설계보다
  명시적 기능 등록을 우선합니다
- **기능 등록을 도입하는 외부 플러그인:** 허용되지만, 문서에서 명시적으로
  안정 계약으로 표시하지 않은 한 기능별 헬퍼 표면은 진화 중인 것으로 취급합니다

실질적인 규칙:

- 기능 등록 API가 의도된 방향입니다
- 전환 기간 동안 외부 플러그인에서 가장 안전한 무중단 경로는 여전히 레거시 훅입니다
- 내보낸 헬퍼 하위 경로가 모두 같은 것은 아닙니다. 우연히 노출된 헬퍼 export가 아니라
  문서화된 좁은 계약을 우선하세요

### 플러그인 형태

OpenClaw는 로드된 모든 플러그인을 정적 메타데이터만이 아니라 실제
등록 동작에 따라 형태로 분류합니다:

- **plain-capability** -- 정확히 하나의 기능 유형만 등록합니다 (예: `mistral` 같은
  provider-only 플러그인)
- **hybrid-capability** -- 여러 기능 유형을 등록합니다 (예: `openai`는 텍스트 추론,
  음성, 미디어 이해, 이미지 생성을 담당함)
- **hook-only** -- 훅만 등록하고(typed 또는 custom), 기능, 도구, 명령, 서비스는 등록하지 않음
- **non-capability** -- 도구, 명령, 서비스 또는 라우트를 등록하지만 기능은 등록하지 않음

플러그인의 형태와 기능 세부 내역은 `openclaw plugins inspect <id>`로 확인할 수 있습니다.
자세한 내용은 [CLI 참조](/cli/plugins#inspect)를 참고하세요.

### 레거시 훅

`before_agent_start` 훅은 hook-only 플러그인을 위한 호환성 경로로 여전히 지원됩니다.
레거시 실사용 플러그인들이 여전히 이것에 의존합니다.

방향성:

- 계속 동작하도록 유지
- 레거시로 문서화
- 모델/프로바이더 재정의 작업에는 `before_model_resolve`를 우선
- 프롬프트 변경 작업에는 `before_prompt_build`를 우선
- 실제 사용량이 줄고 픽스처 커버리지가 마이그레이션 안전성을 입증한 뒤에만 제거

### 호환성 신호

`openclaw doctor` 또는 `openclaw plugins inspect <id>`를 실행하면
다음 레이블 중 하나가 표시될 수 있습니다:

| 신호                       | 의미                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | 설정이 정상적으로 파싱되고 플러그인이 해결됨                 |
| **compatibility advisory** | 플러그인이 지원되지만 오래된 패턴을 사용 중임 (예: `hook-only`) |
| **legacy warning**         | 플러그인이 더 이상 권장되지 않는 `before_agent_start`를 사용함 |
| **hard error**             | 설정이 잘못되었거나 플러그인 로드에 실패함                   |

`hook-only`도 `before_agent_start`도 오늘날 플러그인을 깨뜨리지는 않습니다 --
`hook-only`는 권고 수준이며, `before_agent_start`는 경고만 발생시킵니다. 이러한
신호는 `openclaw status --all` 및 `openclaw plugins doctor`에도 표시됩니다.

## 아키텍처 개요

OpenClaw의 플러그인 시스템은 네 개의 레이어로 이루어져 있습니다:

1. **매니페스트 + 탐색**
   OpenClaw는 구성된 경로, 워크스페이스 루트,
   전역 확장 루트, 번들 확장에서 후보 플러그인을 찾습니다.
   탐색은 먼저 네이티브 `openclaw.plugin.json` 매니페스트와 지원되는 번들 매니페스트를 읽습니다.
2. **활성화 + 검증**
   코어는 탐지된 플러그인이 활성화, 비활성화, 차단되었는지 또는 메모리 같은
   독점 슬롯에 선택되었는지 결정합니다.
3. **런타임 로딩**
   네이티브 OpenClaw 플러그인은 jiti를 통해 프로세스 내에서 로드되며
   중앙 레지스트리에 기능을 등록합니다. 호환 가능한 번들은 런타임 코드를 import하지 않고
   레지스트리 레코드로 정규화됩니다.
4. **표면 소비**
   나머지 OpenClaw는 레지스트리를 읽어 도구, 채널, 프로바이더 설정,
   훅, HTTP 라우트, CLI 명령, 서비스를 노출합니다.

플러그인 CLI의 경우 특히 루트 명령 탐색은 두 단계로 분리됩니다:

- parse 시점 메타데이터는 `registerCli(..., { descriptors: [...] })`에서 가져옵니다
- 실제 플러그인 CLI 모듈은 지연 로드된 상태를 유지하다가 첫 호출 시 등록될 수 있습니다

이렇게 하면 플러그인 소유 CLI 코드를 플러그인 내부에 유지하면서도
OpenClaw가 파싱 전에 루트 명령 이름을 예약할 수 있습니다.

중요한 설계 경계:

- 탐색 + config 검증은 플러그인 코드를 실행하지 않고 **manifest/schema metadata**만으로
  동작해야 합니다
- 네이티브 런타임 동작은 플러그인 모듈의 `register(api)` 경로에서 옵니다

이 분리를 통해 OpenClaw는 전체 런타임이 활성화되기 전에
config를 검증하고, 누락되거나 비활성화된 플러그인을 설명하고,
UI/schema 힌트를 구성할 수 있습니다.

### 채널 플러그인과 공유 메시지 도구

채널 플러그인은 일반적인 채팅 작업을 위해 별도의 send/edit/react 도구를
등록할 필요가 없습니다. OpenClaw는 코어에 하나의 공유 `message` 도구를 유지하고,
채널 플러그인은 그 뒤의 채널별 탐색과 실행을 담당합니다.

현재 경계는 다음과 같습니다:

- 코어는 공유 `message` 도구 호스트, 프롬프트 wiring, 세션/스레드 기록 관리,
  실행 디스패치를 담당합니다
- 채널 플러그인은 범위 지정된 작업 탐색, 기능 탐색, 채널별 schema fragment를 담당합니다
- 채널 플러그인은 대화 id가 어떻게 스레드 id를 인코딩하거나 상위 대화로부터 상속하는지 같은
  프로바이더별 세션 대화 문법을 담당합니다
- 채널 플러그인은 자신의 action adapter를 통해 최종 작업을 실행합니다

채널 플러그인의 SDK 표면은
`ChannelMessageActionAdapter.describeMessageTool(...)`입니다. 이 통합 탐색 호출은
플러그인이 보이는 작업, 기능, schema 기여를 함께 반환하게 하므로
이 요소들이 서로 어긋나지 않습니다.

코어는 그 탐색 단계에 런타임 범위를 전달합니다. 중요한 필드는 다음과 같습니다:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 신뢰된 인바운드 `requesterSenderId`

이는 컨텍스트에 민감한 플러그인에 중요합니다. 채널은 활성 계정,
현재 방/스레드/메시지 또는 신뢰된 요청자 신원에 따라 메시지 작업을
숨기거나 노출할 수 있으며, 코어 `message` 도구에 채널별 분기를
하드코딩할 필요가 없습니다.

이것이 내장 러너 라우팅 변경이 여전히 플러그인 작업인 이유입니다.
러너는 현재 채팅/세션 정체성을 플러그인 탐색 경계로 전달하여
공유 `message` 도구가 현재 턴에 맞는 채널 소유 표면을 노출하도록 해야 합니다.

채널 소유 실행 헬퍼의 경우, 번들 플러그인은 실행 런타임을
자체 확장 모듈 내부에 유지해야 합니다. 코어는 더 이상 Discord,
Slack, Telegram, 또는 WhatsApp 메시지 작업 런타임을 `src/agents/tools` 아래에서
소유하지 않습니다. 별도의 `plugin-sdk/*-action-runtime` 하위 경로도 공개하지 않으며,
번들 플러그인은 자신의 확장 소유 모듈에서 로컬 런타임 코드를
직접 import해야 합니다.

동일한 경계는 일반적인 프로바이더명 SDK seam에도 적용됩니다.
코어는 Slack, Discord, Signal,
WhatsApp 또는 유사 확장을 위한 채널별 편의 barrel을 import하면 안 됩니다.
코어에 어떤 동작이 필요하다면 번들 플러그인의 자체 `api.ts` / `runtime-api.ts`
barrel을 사용하거나, 그 필요를 공유 SDK의 좁은 일반 기능으로 승격해야 합니다.

특히 poll의 경우 실행 경로는 두 가지입니다:

- `outbound.sendPoll`은 공통 poll 모델에 맞는 채널을 위한 공유 기준선입니다
- `actions.handleAction("poll")`은 채널별 poll 의미 체계나 추가 poll 매개변수에
  선호되는 경로입니다

이제 코어는 플러그인 poll 디스패치가 작업을 거절한 뒤에야 공유 poll 파싱을
수행하므로, 플러그인 소유 poll 핸들러가 채널별 poll 필드를
먼저 제네릭 poll 파서에 막히지 않고 받아들일 수 있습니다.

전체 시작 시퀀스는 [로드 파이프라인](#load-pipeline)을 참고하세요.

## 기능 소유권 모델

OpenClaw는 네이티브 플러그인을 관련 없는 통합의 잡동사니가 아니라
**회사** 또는 **기능**의 소유권 경계로 취급합니다.

의미하는 바는 다음과 같습니다:

- 회사 플러그인은 보통 해당 회사의 OpenClaw 노출 표면 전체를 담당해야 합니다
- 기능 플러그인은 보통 자신이 도입하는 전체 기능 표면을 담당해야 합니다
- 채널은 프로바이더 동작을 임시로 재구현하지 말고 공유 코어 기능을 소비해야 합니다

예시:

- 번들 `openai` 플러그인은 OpenAI 모델 프로바이더 동작과 OpenAI
  음성 + 실시간 음성 + 미디어 이해 + 이미지 생성 동작을 담당합니다
- 번들 `elevenlabs` 플러그인은 ElevenLabs 음성 동작을 담당합니다
- 번들 `microsoft` 플러그인은 Microsoft 음성 동작을 담당합니다
- 번들 `google` 플러그인은 Google 모델 프로바이더 동작과 Google
  미디어 이해 + 이미지 생성 + 웹 검색 동작을 담당합니다
- 번들 `firecrawl` 플러그인은 Firecrawl 웹 가져오기 동작을 담당합니다
- 번들 `minimax`, `mistral`, `moonshot`, `zai` 플러그인은
  미디어 이해 백엔드를 담당합니다
- 번들 `qwen` 플러그인은 Qwen 텍스트 프로바이더 동작과
  미디어 이해 및 비디오 생성 동작을 담당합니다
- `voice-call` 플러그인은 기능 플러그인입니다: 통화 전송, 도구,
  CLI, 라우트, Twilio 미디어 스트림 브리징을 담당하지만,
  벤더 플러그인을 직접 import하는 대신 공유 음성과
  실시간 전사 및 실시간 음성 기능을 소비합니다

의도된 최종 상태는 다음과 같습니다:

- OpenAI는 텍스트 모델, 음성, 이미지, 미래의 비디오까지 걸쳐 있어도 하나의 플러그인에 존재
- 다른 벤더도 자체 표면 영역에 대해 같은 방식 적용 가능
- 채널은 어떤 벤더 플러그인이 프로바이더를 담당하는지 신경 쓰지 않고,
  코어가 노출하는 공유 기능 계약을 소비

이것이 핵심적인 구분입니다:

- **plugin** = 소유권 경계
- **capability** = 여러 플러그인이 구현하거나 소비할 수 있는 코어 계약

따라서 OpenClaw가 비디오 같은 새 도메인을 추가할 때 첫 질문은
"어떤 프로바이더가 비디오 처리를 하드코딩해야 하는가?"가 아닙니다.
첫 질문은 "코어 비디오 기능 계약이 무엇인가?"입니다. 그 계약이 존재하면
벤더 플러그인이 그것에 대해 등록할 수 있고, 채널/기능 플러그인은 그것을 소비할 수 있습니다.

기능이 아직 존재하지 않는다면, 보통 올바른 접근은 다음과 같습니다:

1. 코어에서 누락된 기능 정의
2. 플러그인 API/런타임을 통해 typed 방식으로 노출
3. 채널/기능을 그 기능에 맞게 연결
4. 벤더 플러그인이 구현 등록

이렇게 하면 소유권은 명확하게 유지되면서도, 코어 동작이
단일 벤더나 일회성 플러그인별 코드 경로에 의존하지 않게 됩니다.

### 기능 레이어링

코드가 어디에 속해야 하는지 결정할 때 다음 사고 모델을 사용하세요:

- **코어 기능 레이어**: 공유 오케스트레이션, 정책, 폴백, config
  병합 규칙, 전달 의미 체계, typed 계약
- **벤더 플러그인 레이어**: 벤더별 API, 인증, 모델 카탈로그, 음성
  합성, 이미지 생성, 향후 비디오 백엔드, 사용량 엔드포인트
- **채널/기능 플러그인 레이어**: 코어 기능을 소비하고 표면에 제시하는
  Slack/Discord/voice-call 등의 통합

예를 들어 TTS는 다음 형태를 따릅니다:

- 코어는 응답 시점 TTS 정책, 폴백 순서, 기본 설정, 채널 전달을 담당
- `openai`, `elevenlabs`, `microsoft`는 합성 구현을 담당
- `voice-call`은 전화용 TTS 런타임 헬퍼를 소비

미래 기능에도 같은 패턴을 우선 적용해야 합니다.

### 다중 기능 회사 플러그인 예시

회사 플러그인은 외부에서 볼 때 응집적으로 느껴져야 합니다. OpenClaw가
모델, 음성, 실시간 전사, 실시간 음성, 미디어 이해, 이미지 생성,
비디오 생성, 웹 가져오기, 웹 검색에 대한 공유 계약을 가진다면,
벤더는 자신의 모든 표면을 한 곳에서 담당할 수 있습니다:

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

중요한 것은 정확한 헬퍼 이름이 아닙니다. 중요한 것은 형태입니다:

- 하나의 플러그인이 벤더 표면을 담당
- 코어는 여전히 기능 계약을 담당
- 채널 및 기능 플러그인은 벤더 코드가 아니라 `api.runtime.*` 헬퍼를 소비
- 계약 테스트는 플러그인이 자신이 소유한다고 주장하는 기능을 등록했는지 검증 가능

### 기능 예시: 비디오 이해

OpenClaw는 이미 이미지/오디오/비디오 이해를 하나의 공유
기능으로 취급합니다. 동일한 소유권 모델이 여기에 적용됩니다:

1. 코어가 media-understanding 계약을 정의
2. 벤더 플러그인이 해당되는 경우 `describeImage`, `transcribeAudio`,
   `describeVideo`를 등록
3. 채널과 기능 플러그인은 벤더 코드에 직접 연결하지 않고 공유 코어 동작을 소비

이렇게 하면 특정 프로바이더의 비디오 가정을 코어에 고정하는 일을 피할 수 있습니다.
플러그인이 벤더 표면을 담당하고, 코어는 기능 계약과 폴백 동작을 담당합니다.

비디오 생성도 이미 동일한 순서를 따릅니다. 코어가 typed
기능 계약과 런타임 헬퍼를 담당하고, 벤더 플러그인은
`api.registerVideoGenerationProvider(...)` 구현을 등록합니다.

구체적인 롤아웃 체크리스트가 필요하다면
[기능 Cookbook](/ko/plugins/architecture)을 참고하세요.

## 계약과 강제

플러그인 API 표면은 의도적으로 typed이며 `OpenClawPluginApi`에
집중되어 있습니다. 이 계약은 지원되는 등록 지점과
플러그인이 의존할 수 있는 런타임 헬퍼를 정의합니다.

이것이 중요한 이유:

- 플러그인 작성자는 하나의 안정적인 내부 표준을 얻습니다
- 코어는 두 플러그인이 동일한 provider id를 등록하는 식의 중복 소유권을 거부할 수 있습니다
- 시작 시 잘못된 등록에 대해 실행 가능한 진단을 노출할 수 있습니다
- 계약 테스트로 번들 플러그인 소유권을 강제하고 조용한 드리프트를 방지할 수 있습니다

강제는 두 레이어로 이루어집니다:

1. **런타임 등록 강제**
   플러그인이 로드될 때 플러그인 레지스트리가 등록을 검증합니다. 예:
   중복 provider id, 중복 speech provider id, 잘못된
   등록은 정의되지 않은 동작 대신 플러그인 진단을 생성합니다.
2. **계약 테스트**
   번들 플러그인은 테스트 실행 중 계약 레지스트리에 캡처되므로,
   OpenClaw가 소유권을 명시적으로 검증할 수 있습니다. 현재는 모델
   프로바이더, speech provider, web search provider, 번들 등록
   소유권에 사용됩니다.

실질적인 효과는 OpenClaw가 어떤 플러그인이 어떤 표면을 소유하는지
사전에 안다는 점입니다. 이는 소유권이 암묵적이 아니라
선언되고, typed이며, 테스트 가능하기 때문에 코어와 채널이
매끄럽게 조합될 수 있게 합니다.

### 계약에 포함되어야 할 것

좋은 플러그인 계약은 다음과 같습니다:

- typed
- 작음
- 기능별
- 코어가 소유
- 여러 플러그인에서 재사용 가능
- 벤더 지식 없이 채널/기능에서 소비 가능

나쁜 플러그인 계약은 다음과 같습니다:

- 코어 안에 숨겨진 벤더별 정책
- 레지스트리를 우회하는 일회성 플러그인 탈출구
- 벤더 구현에 직접 접근하는 채널 코드
- `OpenClawPluginApi` 또는
  `api.runtime`의 일부가 아닌 임시 런타임 객체

확신이 없다면 추상화 수준을 높이세요. 먼저 기능을 정의하고,
그다음 플러그인이 그것에 연결되게 하세요.

## 실행 모델

네이티브 OpenClaw 플러그인은 Gateway와 **같은 프로세스 내에서**
실행됩니다. 샌드박스되지 않습니다. 로드된 네이티브 플러그인은
코어 코드와 동일한 프로세스 수준 신뢰 경계를 가집니다.

의미하는 바:

- 네이티브 플러그인은 도구, 네트워크 핸들러, 훅, 서비스를 등록할 수 있습니다
- 네이티브 플러그인 버그는 gateway를 충돌시키거나 불안정하게 만들 수 있습니다
- 악의적인 네이티브 플러그인은 OpenClaw 프로세스 내부에서의 임의 코드 실행과 동일합니다

호환 가능한 번들은 OpenClaw가 현재 이를 메타데이터/콘텐츠 팩으로
취급하므로 기본적으로 더 안전합니다. 현재 릴리스에서는 이는 주로 번들
Skills를 의미합니다.

번들되지 않은 플러그인에는 allowlist와 명시적 install/load 경로를 사용하세요.
워크스페이스 플러그인은 프로덕션 기본값이 아니라 개발 시점 코드로 취급하세요.

번들 워크스페이스 패키지 이름의 경우, npm 이름에 plugin id를
기준점으로 유지하세요: 기본적으로 `@openclaw/<id>`, 또는
패키지가 의도적으로 더 좁은 플러그인 역할을 노출하는 경우
`-provider`, `-plugin`, `-speech`, `-sandbox`, `-media-understanding` 같은
승인된 typed 접미사를 사용합니다.

중요한 신뢰 관련 참고:

- `plugins.allow`는 소스 출처가 아니라 **plugin id**를 신뢰합니다.
- 번들 플러그인과 같은 id를 가진 워크스페이스 플러그인은, 해당 워크스페이스 플러그인이
  활성화/allowlist된 경우 의도적으로 번들 사본을 가립니다.
- 이는 정상이며 로컬 개발, 패치 테스트, 핫픽스에 유용합니다.

## export 경계

OpenClaw는 구현 편의성이 아니라 기능을 export합니다.

기능 등록은 공개 상태로 유지하세요. 계약이 아닌 헬퍼 export는 줄이세요:

- 번들 플러그인 전용 헬퍼 하위 경로
- 공개 API로 의도되지 않은 런타임 plumbing 하위 경로
- 벤더별 편의 헬퍼
- 구현 세부 사항인 setup/onboarding 헬퍼

일부 번들 플러그인 헬퍼 하위 경로는 호환성과 번들 플러그인 유지보수를 위해
생성된 SDK export 맵에 여전히 남아 있습니다. 현재 예시에는
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, 여러 `plugin-sdk/matrix*` seam이 포함됩니다.
이들은 새로운 서드파티 플러그인을 위한 권장 SDK 패턴이 아니라,
예약된 구현 세부 export로 취급하세요.

## 로드 파이프라인

시작 시 OpenClaw는 대략 다음을 수행합니다:

1. 후보 plugin 루트 탐색
2. 네이티브 또는 호환 번들 매니페스트와 패키지 메타데이터 읽기
3. 안전하지 않은 후보 거부
4. plugin config 정규화 (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. 각 후보의 활성화 여부 결정
6. 활성화된 네이티브 모듈을 jiti로 로드
7. 네이티브 `register(api)` (또는 레거시 별칭 `activate(api)`) 훅을 호출하고 등록을 플러그인 레지스트리에 수집
8. 레지스트리를 명령/런타임 표면에 노출

<Note>
`activate`는 `register`의 레거시 별칭입니다 — 로더는 존재하는 쪽(`def.register ?? def.activate`)을 해결해 같은 시점에 호출합니다. 모든 번들 플러그인은 `register`를 사용합니다. 새 플러그인에는 `register`를 우선하세요.
</Note>

안전 게이트는 런타임 실행 **이전**에 발생합니다. 엔트리가 plugin 루트를 벗어나거나,
경로가 world-writable이거나, 비번들 플러그인에 대해 경로 소유권이 의심스러워 보이면
후보가 차단됩니다.

### Manifest-first 동작

매니페스트는 컨트롤 플레인의 기준 정보원입니다. OpenClaw는 이를 사용해 다음을 수행합니다:

- 플러그인 식별
- 선언된 채널/Skills/config schema 또는 번들 기능 탐색
- `plugins.entries.<id>.config` 검증
- Control UI 레이블/placeholder 보강
- install/catalog 메타데이터 표시

네이티브 플러그인의 경우 런타임 모듈은 데이터 플레인 부분입니다.
이 모듈은 훅, 도구, 명령, 프로바이더 플로우 같은 실제 동작을 등록합니다.

### 로더가 캐시하는 것

OpenClaw는 다음에 대한 짧은 수명의 in-process 캐시를 유지합니다:

- 탐색 결과
- manifest registry 데이터
- 로드된 plugin registry

이 캐시는 급격한 시작 부하와 반복 명령 오버헤드를 줄입니다. 이를
영속성으로 보지 말고, 수명이 짧은 성능 캐시로 생각하면 됩니다.

성능 참고:

- 이 캐시를 비활성화하려면 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 또는
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`을 설정하세요.
- 캐시 기간은 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS`와
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`로 조정합니다.

## 레지스트리 모델

로드된 플러그인은 무작위 코어 전역 상태를 직접 변경하지 않습니다.
중앙 플러그인 레지스트리에 등록합니다.

레지스트리는 다음을 추적합니다:

- 플러그인 레코드 (정체성, 소스, 출처, 상태, 진단)
- 도구
- 레거시 훅과 typed 훅
- 채널
- 프로바이더
- gateway RPC 핸들러
- HTTP 라우트
- CLI registrar
- 백그라운드 서비스
- 플러그인 소유 명령

그런 다음 코어 기능은 플러그인 모듈과 직접 대화하는 대신
이 레지스트리에서 읽습니다. 이렇게 하면 로딩이 단방향으로 유지됩니다:

- 플러그인 모듈 -> 레지스트리 등록
- 코어 런타임 -> 레지스트리 소비

이 분리는 유지보수성에 중요합니다. 대부분의 코어 표면이
"모든 플러그인 모듈을 특수 처리"가 아니라
"레지스트리를 읽는다"라는 하나의 통합 지점만 필요하게 되기 때문입니다.

## 대화 바인딩 콜백

대화를 바인딩하는 플러그인은 승인 해결 시 반응할 수 있습니다.

바인드 요청이 승인되거나 거부된 후 콜백을 받으려면
`api.onConversationBindingResolved(...)`를 사용하세요:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // 이제 이 플러그인 + 대화에 대한 바인딩이 존재합니다.
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
- `decision`: `"allow-once"`, `"allow-always"`, 또는 `"deny"`
- `binding`: 승인된 요청에 대한 해결된 바인딩
- `request`: 원래 요청 요약, detach 힌트, 발신자 id, 대화 메타데이터

이 콜백은 알림 전용입니다. 누가 대화를 바인딩할 수 있는지는 변경하지 않으며,
코어 승인 처리가 끝난 뒤 실행됩니다.

## 프로바이더 런타임 훅

이제 프로바이더 플러그인은 두 레이어를 가집니다:

- 매니페스트 메타데이터: 런타임 로드 전에 저렴하게 프로바이더 env-auth를 조회하기 위한 `providerAuthEnvVars`,
  런타임 로드 전에 저렴하게 채널 env/setup을 조회하기 위한 `channelEnvVars`,
  그리고 런타임 로드 전에 저렴하게 onboarding/auth-choice
  레이블 및 CLI 플래그 메타데이터를 제공하기 위한 `providerAuthChoices`
- config 시점 훅: `catalog` / 레거시 `discovery` 및 `applyConfigDefaults`
- 런타임 훅: `normalizeModelId`, `normalizeTransport`,
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

OpenClaw는 여전히 제네릭 에이전트 루프, 페일오버, transcript 처리, 도구 정책을 담당합니다.
이 훅은 전체 커스텀 추론 전송 계층 없이도
프로바이더별 동작을 확장하기 위한 표면입니다.

프로바이더가 런타임 로드 없이도 제네릭 auth/status/model-picker 경로에서 보아야 하는
env 기반 자격 증명을 갖는다면 매니페스트 `providerAuthEnvVars`를 사용하세요.
온보딩/auth-choice CLI 표면이 provider choice id, group label,
간단한 one-flag auth wiring을 런타임 로드 없이 알아야 한다면
매니페스트 `providerAuthChoices`를 사용하세요. 프로바이더 런타임
`envVars`는 onboarding 레이블이나 OAuth
client-id/client-secret 설정 변수 같은 운영자 대상 힌트에 유지하세요.

채널에 런타임 로드 없이도 제네릭 shell-env 폴백, config/status 검사,
setup 프롬프트에서 보여야 하는 env 기반 auth 또는 setup이 있다면
매니페스트 `channelEnvVars`를 사용하세요.

### 훅 순서와 사용법

모델/프로바이더 플러그인의 경우 OpenClaw는 대략 다음 순서로 훅을 호출합니다.
"사용 시점" 열은 빠른 결정 가이드입니다.

| #   | 훅                                | 역할                                                                                                           | 사용 시점                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 생성 중 `models.providers`에 provider config 게시                                              | 프로바이더가 카탈로그나 기본 `base URL` 값을 소유할 때                                                                                      |
| 2   | `applyConfigDefaults`             | config materialization 중 프로바이더 소유 전역 config 기본값 적용                                             | 기본값이 auth 모드, env, 또는 프로바이더 모델 계열 의미 체계에 의존할 때                                                                   |
| --  | _(내장 모델 조회)_                | OpenClaw가 먼저 일반 레지스트리/카탈로그 경로를 시도함                                                        | _(플러그인 훅 아님)_                                                                                                                        |
| 3   | `normalizeModelId`                | 조회 전에 레거시 또는 프리뷰 model-id 별칭 정규화                                                             | 프로바이더가 정식 모델 해결 전에 별칭 정리를 소유할 때                                                                                      |
| 4   | `normalizeTransport`              | 일반 모델 조립 전에 프로바이더 계열 `api` / `baseUrl` 정규화                                                  | 프로바이더가 동일 전송 계열 내부의 custom provider id에 대한 transport 정리를 소유할 때                                                    |
| 5   | `normalizeConfig`                 | 런타임/provider 해결 전에 `models.providers.<id>` 정규화                                                      | 플러그인과 함께 있어야 하는 config 정리가 필요할 때; 번들 Google 계열 헬퍼도 지원되는 Google config 엔트리를 보완                         |
| 6   | `applyNativeStreamingUsageCompat` | config provider에 네이티브 streaming-usage 호환 재작성 적용                                                   | 프로바이더에 엔드포인트 기반 네이티브 streaming usage 메타데이터 수정이 필요할 때                                                         |
| 7   | `resolveConfigApiKey`             | 런타임 auth 로드 전에 config provider에 대한 env-marker auth 해결                                             | 프로바이더가 provider 소유 env-marker API key 해결을 가질 때; `amazon-bedrock`도 여기서 내장 AWS env-marker resolver를 가짐              |
| 8   | `resolveSyntheticAuth`            | 평문 저장 없이 local/self-hosted 또는 config-backed auth 노출                                                 | 프로바이더가 synthetic/local credential marker로 동작할 수 있을 때                                                                         |
| 9   | `resolveExternalAuthProfiles`     | 프로바이더 소유 외부 auth profile 오버레이; 기본 `persistence`는 CLI/app 소유 credential에 대해 `runtime-only` | 프로바이더가 새로 고친 토큰을 복사 저장하지 않고 외부 auth credential을 재사용할 때                                                        |
| 10  | `shouldDeferSyntheticProfileAuth` | env/config-backed auth보다 저장된 synthetic profile placeholder 우선순위를 낮춤                               | 프로바이더가 precedence를 가져가면 안 되는 synthetic placeholder profile을 저장할 때                                                       |
| 11  | `resolveDynamicModel`             | 아직 로컬 레지스트리에 없는 프로바이더 소유 model id에 대한 동기 폴백                                        | 프로바이더가 임의의 업스트림 model id를 허용할 때                                                                                           |
| 12  | `prepareDynamicModel`             | 비동기 워밍업 후 `resolveDynamicModel`를 다시 실행                                                            | 프로바이더가 알 수 없는 id 해결 전에 네트워크 메타데이터가 필요할 때                                                                        |
| 13  | `normalizeResolvedModel`          | 내장 러너가 해결된 모델을 사용하기 전 최종 재작성                                                             | 프로바이더가 코어 transport를 사용하되 transport 재작성이 필요할 때                                                                         |
| 14  | `contributeResolvedModelCompat`   | 다른 호환 transport 뒤에 있는 벤더 모델에 대한 compat 플래그 기여                                            | 프로바이더가 프로바이더를 장악하지 않고 프록시 transport에서 자신의 모델을 인식할 때                                                       |
| 15  | `capabilities`                    | 공유 코어 로직이 사용하는 프로바이더 소유 transcript/tooling 메타데이터                                       | 프로바이더에 transcript/provider 계열 특이점이 있을 때                                                                                      |
| 16  | `normalizeToolSchemas`            | 내장 러너가 보기 전에 tool schema 정규화                                                                      | 프로바이더에 transport 계열 schema 정리가 필요할 때                                                                                         |
| 17  | `inspectToolSchemas`              | 정규화 후 프로바이더 소유 schema 진단 노출                                                                    | 코어에 provider-specific 규칙을 가르치지 않고 키워드 경고를 제공하고 싶을 때                                                               |
| 18  | `resolveReasoningOutputMode`      | 네이티브와 tagged reasoning-output 계약 중 선택                                                               | 프로바이더가 네이티브 필드 대신 tagged reasoning/final output이 필요할 때                                                                   |
| 19  | `prepareExtraParams`              | 일반 stream option wrapper 전에 요청 매개변수 정규화                                                          | 프로바이더에 기본 요청 매개변수 또는 provider별 매개변수 정리가 필요할 때                                                                   |
| 20  | `createStreamFn`                  | 일반 stream 경로를 custom transport로 완전히 대체                                                             | 프로바이더에 wrapper가 아닌 custom wire protocol이 필요할 때                                                                                |
| 21  | `wrapStreamFn`                    | 일반 wrapper 적용 후 stream wrapper                                                                            | 프로바이더에 custom transport 없이 요청 header/body/model compat wrapper가 필요할 때                                                        |
| 22  | `resolveTransportTurnState`       | 네이티브 per-turn transport header 또는 metadata 첨부                                                         | 프로바이더가 일반 transport가 provider-native turn identity를 보내길 원할 때                                                               |
| 23  | `resolveWebSocketSessionPolicy`   | 네이티브 WebSocket header 또는 session cool-down 정책 첨부                                                    | 프로바이더가 일반 WS transport에서 session header 또는 fallback 정책을 조정하길 원할 때                                                     |
| 24  | `formatApiKey`                    | auth-profile formatter: 저장된 profile을 런타임 `apiKey` 문자열로 변환                                        | 프로바이더가 추가 auth metadata를 저장하고 custom 런타임 token 형태가 필요할 때                                                            |
| 25  | `refreshOAuth`                    | custom refresh endpoint 또는 refresh 실패 정책을 위한 OAuth refresh 재정의                                    | 프로바이더가 공유 `pi-ai` refresher에 맞지 않을 때                                                                                          |
| 26  | `buildAuthDoctorHint`             | OAuth refresh 실패 시 추가되는 복구 힌트                                                                      | 프로바이더에 refresh 실패 후 provider 소유 auth 복구 안내가 필요할 때                                                                       |
| 27  | `matchesContextOverflowError`     | 프로바이더 소유 context-window overflow 매처                                                                  | 일반 휴리스틱이 놓치는 원시 overflow 오류가 프로바이더에 있을 때                                                                            |
| 28  | `classifyFailoverReason`          | 프로바이더 소유 failover 이유 분류                                                                            | 프로바이더가 원시 API/transport 오류를 rate-limit/overload 등으로 매핑할 수 있을 때                                                        |
| 29  | `isCacheTtlEligible`              | 프록시/backhaul 프로바이더를 위한 프롬프트 캐시 정책                                                          | 프로바이더에 프록시별 cache TTL 게이팅이 필요할 때                                                                                          |
| 30  | `buildMissingAuthMessage`         | 제네릭 missing-auth 복구 메시지 대체                                                                          | 프로바이더에 provider-specific missing-auth 복구 힌트가 필요할 때                                                                           |
| 31  | `suppressBuiltInModel`            | 오래된 업스트림 모델 숨김 및 선택적 사용자 대상 오류 힌트                                                    | 프로바이더가 오래된 업스트림 행을 숨기거나 벤더 힌트로 교체해야 할 때                                                                       |
| 32  | `augmentModelCatalog`             | 탐색 후 synthetic/final 카탈로그 행 추가                                                                      | 프로바이더가 `models list` 및 picker에 synthetic forward-compat 행이 필요할 때                                                             |
| 33  | `isBinaryThinking`                | binary-thinking 프로바이더용 on/off reasoning 토글                                                            | 프로바이더가 binary thinking on/off만 노출할 때                                                                                             |
| 34  | `supportsXHighThinking`           | 선택된 모델에 대한 `xhigh` reasoning 지원                                                                     | 프로바이더가 일부 모델에서만 `xhigh`를 원할 때                                                                                              |
| 35  | `resolveDefaultThinkingLevel`     | 특정 모델 계열용 기본 `/think` 수준                                                                           | 프로바이더가 모델 계열의 기본 `/think` 정책을 소유할 때                                                                                     |
| 36  | `isModernModelRef`                | live profile 필터 및 smoke 선택용 modern-model 매처                                                           | 프로바이더가 live/smoke preferred-model 매칭을 소유할 때                                                                                    |
| 37  | `prepareRuntimeAuth`              | 추론 직전 구성된 credential을 실제 런타임 token/key로 교환                                                   | 프로바이더에 token 교환 또는 짧게 유지되는 요청 credential이 필요할 때                                                                      |
| 38  | `resolveUsageAuth`                | `/usage` 및 관련 상태 표면용 usage/billing credential 해결                                                   | 프로바이더에 custom usage/quota token 파싱 또는 다른 usage credential이 필요할 때                                                           |
| 39  | `fetchUsageSnapshot`              | auth 해결 후 프로바이더별 usage/quota snapshot 가져오기 및 정규화                                             | 프로바이더에 provider-specific usage endpoint 또는 payload parser가 필요할 때                                                               |
| 40  | `createEmbeddingProvider`         | 메모리/검색용 프로바이더 소유 embedding adapter 빌드                                                         | 메모리 embedding 동작이 프로바이더 플러그인과 함께 있어야 할 때                                                                             |
| 41  | `buildReplayPolicy`               | 프로바이더용 transcript 처리 제어 replay policy 반환                                                          | 프로바이더에 custom transcript 정책(예: thinking block 제거)이 필요할 때                                                                    |
| 42  | `sanitizeReplayHistory`           | 일반 transcript 정리 후 replay history 재작성                                                                 | 프로바이더에 공유 compaction helper를 넘는 provider-specific replay 재작성이 필요할 때                                                     |
| 43  | `validateReplayTurns`             | 내장 러너 전에 최종 replay turn 검증 또는 재구성                                                              | provider transport에 일반 sanitization 후 더 엄격한 turn 검증이 필요할 때                                                                   |
| 44  | `onModelSelected`                 | 프로바이더 소유 post-selection 부작용 실행                                                                    | 모델이 활성화될 때 프로바이더에 telemetry 또는 provider 소유 상태가 필요할 때                                                               |

`normalizeModelId`, `normalizeTransport`, `normalizeConfig`는 먼저
일치한 provider plugin을 확인한 다음, 실제로 model id 또는
transport/config를 변경할 때까지 다른 훅 지원 provider plugin으로 폴백합니다. 이렇게 하면
호출자가 어떤 번들 플러그인이 재작성을 소유하는지 알 필요 없이
alias/compat provider shim이 계속 동작합니다. 어떤 provider hook도 지원되는
Google 계열 config 엔트리를 재작성하지 않으면, 번들 Google config normalizer가
여전히 그 호환성 정리를 적용합니다.

프로바이더에 완전한 custom wire protocol 또는 custom 요청 실행기가 필요하다면,
그것은 다른 종류의 확장입니다. 이 훅은 여전히 OpenClaw의 일반
추론 루프에서 실행되는 프로바이더 동작을 위한 것입니다.

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
  `wrapStreamFn`을 사용합니다. Claude 4.6 forward-compat,
  프로바이더 계열 힌트, auth 복구 안내, usage 엔드포인트 통합,
  프롬프트 캐시 적격성, auth 인식 config 기본값, Claude
  기본/적응형 thinking 정책, beta header를 위한 Anthropic 전용 stream shaping,
  `/fast` / `serviceTier`, `context1m`을 담당하기 때문입니다.
- Anthropic의 Claude 전용 stream 헬퍼는 지금도 번들 플러그인의 자체
  공개 `api.ts` / `contract-api.ts` seam에 유지됩니다. 해당 패키지 표면은
  제네릭 SDK를 한 프로바이더의 beta-header 규칙 중심으로 넓히는 대신
  `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` 및 더 저수준의
  Anthropic wrapper builder를 export합니다.
- OpenAI는 `resolveDynamicModel`, `normalizeResolvedModel`,
  `capabilities`와 `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking`, `isModernModelRef`
  를 사용합니다. GPT-5.4 forward-compat, 직접 OpenAI의
  `openai-completions` -> `openai-responses` 정규화, Codex 인식 auth
  힌트, Spark 숨김, synthetic OpenAI 목록 행, GPT-5 thinking /
  live-model 정책을 소유하기 때문입니다. `openai-responses-defaults` stream 계열은
  attribution header, `/fast`/`serviceTier`, text verbosity,
  네이티브 Codex 웹 검색, reasoning-compat payload shaping,
  Responses context management를 위한 공유 네이티브 OpenAI Responses wrapper를 담당합니다.
- OpenRouter는 `catalog`와 `resolveDynamicModel`,
  `prepareDynamicModel`을 사용합니다. 이 프로바이더가 pass-through이며
  OpenClaw의 정적 카탈로그가 갱신되기 전에 새 model id를 노출할 수 있기 때문입니다.
  또한 `capabilities`, `wrapStreamFn`, `isCacheTtlEligible`를 사용해
  프로바이더별 요청 header, 라우팅 metadata, reasoning patch, 프롬프트 캐시 정책을
  코어 밖에 유지합니다. replay 정책은
  `passthrough-gemini` 계열에서 오며, `openrouter-thinking` stream 계열은
  프록시 reasoning 주입과 지원되지 않는 모델 / `auto` 건너뛰기를 담당합니다.
- GitHub Copilot은 `catalog`, `auth`, `resolveDynamicModel`,
  `capabilities`와 `prepareRuntimeAuth`, `fetchUsageSnapshot`을 사용합니다.
  프로바이더 소유 device login, 모델 폴백 동작, Claude transcript 특이점,
  GitHub token -> Copilot token 교환, 프로바이더 소유 usage 엔드포인트가 필요하기 때문입니다.
- OpenAI Codex는 `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth`, `augmentModelCatalog`와
  `prepareExtraParams`, `resolveUsageAuth`, `fetchUsageSnapshot`을 사용합니다.
  여전히 코어 OpenAI transport에서 실행되지만 transport/base URL
  정규화, OAuth refresh 폴백 정책, 기본 transport 선택,
  synthetic Codex catalog 행, ChatGPT usage 엔드포인트 통합을 소유하기 때문입니다.
  직접 OpenAI와 동일한 `openai-responses-defaults` stream 계열을 공유합니다.
- Google AI Studio와 Gemini CLI OAuth는 `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn`, `isModernModelRef`를 사용합니다.
  `google-gemini` replay 계열이 Gemini 3.1 forward-compat 폴백,
  네이티브 Gemini replay 검증, bootstrap replay 정리, tagged
  reasoning-output 모드, modern-model 매칭을 소유하고,
  `google-thinking` stream 계열이 Gemini thinking payload 정규화를
  담당하기 때문입니다. Gemini CLI OAuth는 또한 `formatApiKey`, `resolveUsageAuth`,
  `fetchUsageSnapshot`을 사용해 token formatting, token parsing,
  quota 엔드포인트 wiring을 담당합니다.
- Anthropic Vertex는
  `anthropic-by-model` replay 계열을 통해 `buildReplayPolicy`를 사용하므로
  Claude 전용 replay 정리가 모든 `anthropic-messages` transport가 아니라
  Claude id에만 범위가 제한됩니다.
- Amazon Bedrock은 `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `resolveDefaultThinkingLevel`을 사용합니다.
  Anthropic-on-Bedrock 트래픽에 대한 Bedrock 전용
  throttle/not-ready/context-overflow 오류 분류를 소유하기 때문입니다.
  replay 정책은 여전히 동일한 Claude 전용 `anthropic-by-model` 보호를 공유합니다.
- OpenRouter, Kilocode, Opencode, Opencode Go는
  `passthrough-gemini` replay 계열을 통해 `buildReplayPolicy`를 사용합니다.
  Gemini 모델을 OpenAI 호환 transport를 통해 프록시하고,
  네이티브 Gemini replay 검증이나 bootstrap 재작성 없이
  Gemini thought-signature 정리가 필요하기 때문입니다.
- MiniMax는
  `hybrid-anthropic-openai` replay 계열을 통해 `buildReplayPolicy`를 사용합니다.
  하나의 프로바이더가 Anthropic-message와 OpenAI 호환 의미 체계를 모두 소유하기 때문입니다.
  Anthropic 측에서는 Claude 전용 thinking-block 제거를 유지하면서
  reasoning output mode를 다시 네이티브로 재정의하고,
  `minimax-fast-mode` stream 계열이 공유 stream 경로에서 fast-mode 모델 재작성을 담당합니다.
- Moonshot은 `catalog`와 `wrapStreamFn`을 사용합니다.
  여전히 공유 OpenAI transport를 사용하지만 프로바이더 소유 thinking payload 정규화가 필요하기 때문입니다.
  `moonshot-thinking` stream 계열은 config와 `/think` 상태를
  네이티브 binary thinking payload에 매핑합니다.
- Kilocode는 `catalog`, `capabilities`, `wrapStreamFn`,
  `isCacheTtlEligible`를 사용합니다. 프로바이더 소유 요청 header,
  reasoning payload 정규화, Gemini transcript 힌트, Anthropic
  cache-TTL 게이팅이 필요하기 때문입니다. `kilocode-thinking` stream 계열은
  공유 프록시 stream 경로에서 Kilo thinking 주입을 유지하면서
  명시적 reasoning payload를 지원하지 않는 `kilo/auto` 및
  기타 프록시 model id는 건너뜁니다.
- Z.AI는 `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth`, `fetchUsageSnapshot`을 사용합니다. GLM-5 폴백,
  `tool_stream` 기본값, binary thinking UX, modern-model 매칭,
  usage auth + quota fetching 둘 다를 소유하기 때문입니다.
  `tool-stream-default-on` stream 계열은 기본 활성화된 `tool_stream` wrapper를
  프로바이더별 수작업 glue 바깥에 유지합니다.
- xAI는 `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel`, `isModernModelRef`
  를 사용합니다. 네이티브 xAI Responses transport 정규화, Grok fast-mode
  alias 재작성, 기본 `tool_stream`, strict-tool / reasoning-payload
  정리, 플러그인 소유 도구용 폴백 auth 재사용, forward-compat Grok
  모델 해결, xAI tool-schema profile, 지원되지 않는 schema keyword,
  네이티브 `web_search`, HTML entity tool-call 인수 디코딩 같은
  프로바이더 소유 compat patch를 담당하기 때문입니다.
- Mistral, OpenCode Zen, OpenCode Go는 `capabilities`만 사용해
  transcript/tooling 특이점을 코어 밖에 유지합니다.
- `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway`, `volcengine` 같은
  catalog-only 번들 프로바이더는 `catalog`만 사용합니다.
- Qwen은 텍스트 프로바이더용 `catalog`와, 멀티모달 표면을 위한
  공유 media-understanding 및 video-generation 등록을 사용합니다.
- MiniMax와 Xiaomi는 `catalog`와 usage hook을 사용합니다. 추론은
  여전히 공유 transport를 통해 실행되지만 `/usage`
  동작은 플러그인 소유이기 때문입니다.

## 런타임 헬퍼

플러그인은 `api.runtime`를 통해 선택된 코어 헬퍼에 접근할 수 있습니다. TTS 예시:

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

- `textToSpeech`는 파일/음성 메모 표면에 대한 일반 코어 TTS 출력 페이로드를 반환합니다.
- 코어 `messages.tts` 설정과 프로바이더 선택을 사용합니다.
- PCM 오디오 버퍼 + 샘플 속도를 반환합니다. 플러그인은 프로바이더에 맞게 리샘플링/인코딩해야 합니다.
- `listVoices`는 프로바이더별 선택 사항입니다. 벤더 소유 음성 picker나 setup 흐름에 사용하세요.
- 음성 목록에는 프로바이더 인식 picker를 위한 locale, gender, personality 태그 같은
  더 풍부한 메타데이터가 포함될 수 있습니다.
- 현재 전화용 지원은 OpenAI와 ElevenLabs에 있습니다. Microsoft는 지원하지 않습니다.

플러그인은 `api.registerSpeechProvider(...)`로 speech provider를 등록할 수도 있습니다.

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

- TTS 정책, 폴백, 응답 전달은 코어에 유지하세요.
- 벤더 소유 합성 동작에는 speech provider를 사용하세요.
- 레거시 Microsoft `edge` 입력은 `microsoft` provider id로 정규화됩니다.
- 권장되는 소유권 모델은 회사 중심입니다. OpenClaw가 이러한
  기능 계약을 추가함에 따라 하나의 벤더 플러그인이 텍스트, 음성, 이미지, 미래의 미디어 프로바이더를
  함께 소유할 수 있습니다.

이미지/오디오/비디오 이해의 경우 플러그인은 범용 key/value bag 대신
하나의 typed media-understanding provider를 등록합니다:

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

- 오케스트레이션, 폴백, config, 채널 wiring은 코어에 유지하세요.
- 벤더 동작은 provider plugin에 유지하세요.
- 점진적 확장은 typed 상태를 유지해야 합니다: 새 선택적 메서드, 새 선택적
  결과 필드, 새 선택적 기능.
- 비디오 생성도 이미 동일한 패턴을 따릅니다:
  - 코어가 기능 계약과 런타임 헬퍼를 담당
  - 벤더 플러그인이 `api.registerVideoGenerationProvider(...)`를 등록
  - 기능/채널 플러그인이 `api.runtime.videoGeneration.*`를 소비

media-understanding 런타임 헬퍼의 경우 플러그인은 다음을 호출할 수 있습니다:

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
이전 STT 별칭을 사용할 수 있습니다:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

참고:

- `api.runtime.mediaUnderstanding.*`가 이미지/오디오/비디오 이해를 위한
  선호되는 공유 표면입니다.
- 코어 media-understanding 오디오 설정(`tools.media.audio`)과 프로바이더 폴백 순서를 사용합니다.
- 전사 결과가 생성되지 않으면 `{ text: undefined }`를 반환합니다
  (예: 입력을 건너뛰었거나 지원되지 않는 경우).
- `api.runtime.stt.transcribeAudioFile(...)`는 호환성 별칭으로 남아 있습니다.

플러그인은 `api.runtime.subagent`를 통해 백그라운드 subagent 실행도 시작할 수 있습니다:

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

- `provider`와 `model`은 영구 세션 변경이 아니라 실행별 선택적 override입니다.
- OpenClaw는 신뢰된 호출자에 대해서만 이러한 override 필드를 허용합니다.
- 플러그인 소유 폴백 실행의 경우 운영자는 `plugins.entries.<id>.subagent.allowModelOverride: true`로
  옵트인해야 합니다.
- 신뢰된 플러그인을 특정 canonical `provider/model` 대상으로 제한하려면
  `plugins.entries.<id>.subagent.allowedModels`를 사용하세요. 어떤 대상이든 명시적으로 허용하려면 `"*"`를 사용합니다.
- 신뢰되지 않은 플러그인의 subagent 실행도 동작하지만,
  override 요청은 조용히 폴백되지 않고 거부됩니다.

웹 검색의 경우 플러그인은 에이전트 도구 wiring에 직접 접근하는 대신
공유 런타임 헬퍼를 소비할 수 있습니다:

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

- 프로바이더 선택, 자격 증명 해결, 공유 요청 의미 체계는 코어에 유지하세요.
- 벤더별 검색 transport에는 web-search provider를 사용하세요.
- `api.runtime.webSearch.*`는 에이전트 도구 wrapper에 의존하지 않고
  검색 동작이 필요한 기능/채널 플러그인을 위한 선호되는 공유 표면입니다.

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
- `listProviders(...)`: 사용 가능한 이미지 생성 프로바이더와 해당 기능을 나열합니다.

## Gateway HTTP 라우트

플러그인은 `api.registerHttpRoute(...)`로 HTTP 엔드포인트를 노출할 수 있습니다.

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
- `auth`: 필수. 일반 gateway auth가 필요하면 `"gateway"`, 플러그인 관리 auth/webhook 검증이면 `"plugin"`을 사용
- `match`: 선택 사항. `"exact"`(기본값) 또는 `"prefix"`
- `replaceExisting`: 선택 사항. 동일 플러그인이 자신의 기존 라우트 등록을 교체할 수 있도록 허용
- `handler`: 요청을 처리했으면 `true`를 반환

참고:

- `api.registerHttpHandler(...)`는 제거되었으며 플러그인 로드 오류를 발생시킵니다. 대신 `api.registerHttpRoute(...)`를 사용하세요.
- 플러그인 라우트는 반드시 `auth`를 명시적으로 선언해야 합니다.
- 정확히 동일한 `path + match` 충돌은 `replaceExisting: true`가 아닌 한 거부되며, 한 플러그인이 다른 플러그인의 라우트를 교체할 수는 없습니다.
- `auth` 수준이 다른 중첩 라우트는 거부됩니다. `exact`/`prefix` fallthrough 체인은 같은 auth 수준에서만 유지하세요.
- `auth: "plugin"` 라우트는 운영자 런타임 scope를 자동으로 받지 않습니다. 특권 있는 Gateway 헬퍼 호출이 아니라 플러그인 관리 webhook/서명 검증용입니다.
- `auth: "gateway"` 라우트는 Gateway 요청 런타임 scope 내부에서 실행되지만, 이 scope는 의도적으로 보수적입니다:
  - 공유 비밀 bearer auth (`gateway.auth.mode = "token"` / `"password"`)는
    호출자가 `x-openclaw-scopes`를 보내더라도 플러그인 라우트 런타임 scope를 `operator.write`에 고정합니다
  - 신뢰된 신원 기반 HTTP 모드(예: `trusted-proxy` 또는 프라이빗 ingress에서의 `gateway.auth.mode = "none"`)는
    헤더가 명시적으로 있을 때만 `x-openclaw-scopes`를 반영합니다
  - 이러한 신원 기반 플러그인 라우트 요청에서 `x-openclaw-scopes`가 없으면
    런타임 scope는 `operator.write`로 폴백합니다
- 실질적인 규칙: gateway-auth 플러그인 라우트를 암묵적인 관리자 표면으로 가정하지 마세요.
  라우트에 admin 전용 동작이 필요하면 신원 기반 auth 모드를 요구하고,
  명시적 `x-openclaw-scopes` 헤더 계약을 문서화하세요.

## 플러그인 SDK import 경로

플러그인 작성 시 단일한 `openclaw/plugin-sdk` import 대신
SDK 하위 경로를 사용하세요:

- 플러그인 등록 기본 요소에는 `openclaw/plugin-sdk/plugin-entry`
- 제네릭 공유 plugin-facing 계약에는 `openclaw/plugin-sdk/core`
- 루트 `openclaw.json` Zod schema export(`OpenClawSchema`)에는 `openclaw/plugin-sdk/config-schema`
- 안정적인 채널 기본 요소인 `openclaw/plugin-sdk/channel-setup`,
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
  `openclaw/plugin-sdk/webhook-ingress`는 공유 setup/auth/reply/webhook
  wiring용입니다. `channel-inbound`는 debounce, mention 매칭,
  envelope formatting, inbound envelope context helper를 위한 공유 위치입니다.
  `channel-setup`은 좁은 optional-install setup seam입니다.
  `setup-runtime`은 `setupEntry` /
  지연 시작에서 사용되는 런타임 안전 setup 표면이며, import-safe setup patch adapter를 포함합니다.
  `setup-adapter-runtime`은 env 인식 account-setup adapter seam입니다.
  `setup-tools`는 작은 CLI/archive/docs helper seam(`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`)입니다.
- 도메인 하위 경로인 `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
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
  `openclaw/plugin-sdk/directory-runtime`는 공유 런타임/config 헬퍼용입니다.
  `telegram-command-config`는 Telegram custom
  명령 정규화/검증을 위한 좁은 공개 seam이며 번들
  Telegram 계약 표면을 일시적으로 사용할 수 없더라도 계속 제공됩니다.
  `text-runtime`은 assistant-visible-text 제거,
  markdown 렌더/청킹 헬퍼, redaction 헬퍼, directive-tag 헬퍼,
  safe-text 유틸리티를 포함한 공유 text/markdown/logging seam입니다.
- 승인 전용 채널 seam은 플러그인에서 하나의 `approvalCapability`
  계약을 우선해야 합니다. 그러면 코어가 관련 없는 플러그인 필드에
  승인 동작을 섞는 대신 그 하나의 기능을 통해 승인 auth, 전달, 렌더, 네이티브 라우팅 동작을 읽습니다.
- `openclaw/plugin-sdk/channel-runtime`은 더 이상 권장되지 않으며 이전 플러그인을 위한
  호환성 shim으로만 남아 있습니다. 새 코드는 대신 더 좁은 일반 기본 요소를 import해야 하며,
  리포지토리 코드도 이 shim에 대한 새 import를 추가하면 안 됩니다.
- 번들 확장 내부 구현은 비공개로 유지됩니다. 외부 플러그인은 오직
  `openclaw/plugin-sdk/*` 하위 경로만 사용해야 합니다. OpenClaw 코어/테스트 코드는
  `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js`, `login-qr-api.js` 같은 좁은 파일을 포함해
  플러그인 패키지 루트 아래의 리포 공개 엔트리 지점을 사용할 수 있습니다.
  코어나 다른 확장에서 플러그인 패키지의 `src/*`를 import하지 마세요.
- 리포 엔트리 지점 분리:
  `<plugin-package-root>/api.js`는 helper/types barrel,
  `<plugin-package-root>/runtime-api.js`는 runtime-only barrel,
  `<plugin-package-root>/index.js`는 번들 플러그인 엔트리,
  `<plugin-package-root>/setup-entry.js`는 setup 플러그인 엔트리입니다.
- 현재 번들 provider 예시:
  - Anthropic은 `wrapAnthropicProviderStream`, beta-header helper,
    `service_tier` 파싱 같은 Claude stream 헬퍼를 위해 `api.js` / `contract-api.js`를 사용합니다.
  - OpenAI는 provider builder, default-model helper,
    realtime provider builder를 위해 `api.js`를 사용합니다.
  - OpenRouter는 provider builder와 onboarding/config
    helper를 위해 `api.js`를 사용하며, `register.runtime.js`는 여전히
    리포 로컬 용도로 제네릭 `plugin-sdk/provider-stream` 헬퍼를 재export할 수 있습니다.
- facade 로드 공개 엔트리 지점은 활성 런타임 config snapshot이 존재하면 이를 우선하고,
  OpenClaw가 아직 런타임 snapshot을 제공하지 않을 때는 디스크의 해결된 config 파일로 폴백합니다.
- 제네릭 공유 기본 요소가 선호되는 공개 SDK 계약으로 남아 있습니다.
  소수의 예약된 호환성용 번들 채널 브랜드 헬퍼 seam은 여전히 존재합니다.
  이들을 새로운 서드파티 import 대상이 아니라 번들 유지보수/호환성 seam으로 취급하세요.
  새로운 교차 채널 계약은 여전히 제네릭 `plugin-sdk/*` 하위 경로나
  플러그인 로컬 `api.js` / `runtime-api.js` barrel에 반영되어야 합니다.

호환성 참고:

- 새 코드에서는 루트 `openclaw/plugin-sdk` barrel을 피하세요.
- 먼저 좁고 안정적인 기본 요소를 우선하세요. 새로운
  setup/pairing/reply/feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool 하위 경로가 새 번들 및 외부 플러그인 작업을 위한 의도된 계약입니다.
  대상 파싱/매칭은 `openclaw/plugin-sdk/channel-targets`에 있어야 합니다.
  메시지 작업 게이트와 reaction message-id helper는
  `openclaw/plugin-sdk/channel-actions`에 있어야 합니다.
- 번들 확장 전용 헬퍼 barrel은 기본적으로 안정적이지 않습니다. 어떤
  헬퍼가 번들 확장에만 필요하다면 그것을
  `openclaw/plugin-sdk/<extension>`로 승격하는 대신 확장의 로컬 `api.js` 또는 `runtime-api.js`
  seam 뒤에 두세요.
- 새 공유 helper seam은 채널 브랜드가 아니라 제네릭해야 합니다. 공유 대상
  파싱은 `openclaw/plugin-sdk/channel-targets`에 있어야 하고, 채널별
  내부 구현은 소유 플러그인의 로컬 `api.js` 또는 `runtime-api.js`
  seam 뒤에 유지해야 합니다.
- `image-generation`,
  `media-understanding`, `speech` 같은 기능별 하위 경로는 번들/네이티브 플러그인이
  오늘날 이를 사용하기 때문에 존재합니다. 그렇다고 그 경로의 모든 export된 헬퍼가
  장기적으로 고정된 외부 계약이라는 뜻은 아닙니다.

## 메시지 도구 스키마

플러그인은 채널별 `describeMessageTool(...)` schema 기여를 소유해야 합니다.
프로바이더별 필드는 공유 코어가 아니라 플러그인에 두세요.

공유 가능한 이식형 schema fragment에는
`openclaw/plugin-sdk/channel-actions`를 통해 export되는 제네릭 헬퍼를 재사용하세요:

- 버튼 그리드 스타일 payload에는 `createMessageToolButtonsSchema()`
- 구조화된 카드 payload에는 `createMessageToolCardSchema()`

특정 프로바이더에만 의미가 있는 schema 형태라면
이를 공유 SDK로 승격하는 대신 해당 플러그인의 자체 소스에 정의하세요.

## 채널 대상 해결

채널 플러그인은 채널별 대상 의미 체계를 소유해야 합니다. 공유
outbound 호스트는 제네릭하게 유지하고, 프로바이더 규칙에는 메시징 adapter 표면을 사용하세요:

- `messaging.inferTargetChatType({ to })`는 정규화된 대상을 directory 조회 전에
  `direct`, `group`, `channel` 중 무엇으로 취급할지 결정합니다.
- `messaging.targetResolver.looksLikeId(raw, normalized)`는 어떤 입력이
  directory 검색 대신 바로 id 유사 해결로 가야 하는지 코어에 알려줍니다.
- `messaging.targetResolver.resolveTarget(...)`는 정규화 후 또는
  directory miss 후 코어가 최종 provider 소유 해결이 필요할 때 플러그인 폴백입니다.
- `messaging.resolveOutboundSessionRoute(...)`는 대상이 해결된 후의
  provider-specific session route 구성을 소유합니다.

권장 분리:

- peers/groups 검색 전에 일어나야 하는 범주 결정에는 `inferTargetChatType` 사용
- "이것을 명시적/네이티브 target id로 취급" 검사에는 `looksLikeId` 사용
- 광범위한 directory 검색이 아니라 provider-specific 정규화 폴백에는 `resolveTarget` 사용
- chat id, thread id, JID, handle, room id 같은 provider-native id는
  제네릭 SDK 필드가 아니라 `target` 값 또는 provider-specific 매개변수 안에 유지

## config 기반 디렉터리

config에서 directory 엔트리를 파생하는 플러그인은 그 로직을 플러그인 내부에 두고
`openclaw/plugin-sdk/directory-runtime`의 공유 헬퍼를 재사용해야 합니다.

다음과 같은 config 기반 peers/groups가 필요한 채널에 사용하세요:

- allowlist 기반 DM peer
- 구성된 채널/그룹 맵
- account 범위의 정적 directory 폴백

`directory-runtime`의 공유 헬퍼는 오직 제네릭 작업만 처리합니다:

- 쿼리 필터링
- limit 적용
- deduping/정규화 헬퍼
- `ChannelDirectoryEntry[]` 빌드

채널별 account 검사와 id 정규화는 플러그인 구현에 남겨두어야 합니다.

## 프로바이더 카탈로그

프로바이더 플러그인은
`registerProvider({ catalog: { run(...) { ... } } })`로 추론용 모델 카탈로그를 정의할 수 있습니다.

`catalog.run(...)`은 OpenClaw가 `models.providers`에 쓰는 것과 같은 형태를 반환합니다:

- 하나의 provider 엔트리에는 `{ provider }`
- 여러 provider 엔트리에는 `{ providers }`

프로바이더별 model id, 기본 `base URL` 값,
또는 auth 게이트된 모델 메타데이터를 플러그인이 소유할 때 `catalog`를 사용하세요.

`catalog.order`는 OpenClaw의 내장 암시적 프로바이더에 비해
플러그인의 카탈로그가 언제 병합되는지 제어합니다:

- `simple`: 일반 API key 또는 env 기반 프로바이더
- `profile`: auth profile이 존재할 때 나타나는 프로바이더
- `paired`: 여러 관련 provider 엔트리를 합성하는 프로바이더
- `late`: 다른 암시적 프로바이더 이후 마지막 단계

나중 프로바이더가 키 충돌 시 우선하므로,
플러그인은 같은 provider id를 가진 내장 provider 엔트리를 의도적으로 덮어쓸 수 있습니다.

호환성:

- `discovery`는 여전히 레거시 별칭으로 동작합니다
- `catalog`와 `discovery`가 모두 등록되어 있으면 OpenClaw는 `catalog`를 사용합니다

## 읽기 전용 채널 검사

플러그인이 채널을 등록한다면 `resolveAccount(...)`와 함께
`plugin.config.inspectAccount(cfg, accountId)`도 구현하는 것을 우선하세요.

이유:

- `resolveAccount(...)`는 런타임 경로입니다. 자격 증명이 완전히 materialize되었다고
  가정해도 되며, 필요한 secret이 없으면 빠르게 실패할 수 있습니다.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, doctor/config
  복구 흐름 같은 읽기 전용 명령 경로는 구성을 설명하기 위해
  런타임 자격 증명을 materialize할 필요가 없어야 합니다.

권장 `inspectAccount(...)` 동작:

- 설명적인 계정 상태만 반환
- `enabled`와 `configured` 유지
- 관련 있는 경우 자격 증명 소스/상태 필드 포함:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 읽기 전용 사용 가능 여부를 보고하기 위해 원시 token 값을 반환할 필요는 없습니다.
  상태 스타일 명령에는 `tokenStatus: "available"`(및 해당 source 필드)만으로 충분합니다.
- SecretRef를 통해 자격 증명이 구성되었지만 현재 명령 경로에서는 사용할 수 없을 때는
  `configured_unavailable`을 사용하세요.

이렇게 하면 읽기 전용 명령이 충돌하거나 계정을 미구성으로 잘못 보고하는 대신
"구성되었지만 이 명령 경로에서는 사용할 수 없음"을 보고할 수 있습니다.

## 패키지 팩

플러그인 디렉터리에는 `openclaw.extensions`가 포함된 `package.json`이 있을 수 있습니다:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

각 엔트리는 하나의 플러그인이 됩니다. 팩이 여러 확장을 나열하면 플러그인 id는
`name/<fileBase>`가 됩니다.

플러그인이 npm 의존성을 import한다면 해당 디렉터리에 설치하여
`node_modules`를 사용할 수 있게 하세요 (`npm install` / `pnpm install`).

보안 가드레일: 모든 `openclaw.extensions` 엔트리는 symlink 해결 후에도
플러그인 디렉터리 내부에 있어야 합니다. 패키지 디렉터리를 벗어나는 엔트리는
거부됩니다.

보안 참고: `openclaw plugins install`은 플러그인 의존성을
`npm install --omit=dev --ignore-scripts`로 설치합니다 (라이프사이클 스크립트 없음, 런타임에 dev 의존성 없음). 플러그인 의존성
트리는 "순수 JS/TS" 상태로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.

선택 사항: `openclaw.setupEntry`는 가벼운 setup 전용 모듈을 가리킬 수 있습니다.
OpenClaw가 비활성화된 채널 플러그인에 대한 setup 표면이 필요하거나,
채널 플러그인이 활성화되었지만 아직 구성되지 않은 경우
전체 플러그인 엔트리 대신 `setupEntry`를 로드합니다. 이렇게 하면
주 플러그인 엔트리가 도구, 훅, 기타 런타임 전용
코드를 함께 wiring하는 경우에도 시작과 setup이 더 가벼워집니다.

선택 사항:
`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`은
채널 플러그인이 이미 구성된 경우에도 gateway의
pre-listen 시작 단계에서 같은 `setupEntry` 경로를 사용하도록 옵트인할 수 있게 합니다.

이 옵션은 `setupEntry`가 gateway가 수신을 시작하기 전에 존재해야 하는
시작 표면을 완전히 포괄할 때만 사용하세요. 실제로는 setup 엔트리가
시작에 의존하는 모든 채널 소유 기능을 등록해야 한다는 뜻입니다. 예:

- 채널 등록 자체
- gateway가 수신을 시작하기 전에 반드시 사용 가능해야 하는 모든 HTTP 라우트
- 동일한 시점에 반드시 존재해야 하는 모든 gateway 메서드, 도구, 서비스

전체 엔트리가 여전히 필요한 시작 기능을 하나라도 소유한다면
이 플래그를 활성화하지 마세요. 기본 동작을 유지하고
OpenClaw가 시작 중 전체 엔트리를 로드하게 하세요.

번들 채널은 전체 채널 런타임이 로드되기 전에 코어가 참조할 수 있는
setup 전용 contract-surface helper도 게시할 수 있습니다. 현재 setup
promotion 표면은 다음과 같습니다:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

코어는 레거시 단일 계정 채널 config를
전체 플러그인 엔트리를 로드하지 않고 `channels.<id>.accounts.*`로 승격해야 할 때
이 표면을 사용합니다. Matrix가 현재 번들 예시입니다.
이 플러그인은 named account가 이미 존재할 때 auth/bootstrap key만
named promoted account로 이동하며, 항상 `accounts.default`를 생성하는 대신
구성된 비표준 default-account key를 보존할 수 있습니다.

이 setup patch adapter는 번들 contract-surface 탐색을 지연 상태로 유지합니다.
import 시점은 가볍게 유지되고, promotion 표면은 모듈 import 시 번들 채널 시작에
재진입하는 대신 최초 사용 시에만 로드됩니다.

이러한 시작 표면에 gateway RPC 메서드가 포함될 때는
플러그인 전용 prefix를 유지하세요. 코어 admin namespace(`config.*`,
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

채널 플러그인은 `openclaw.channel`을 통해 setup/discovery 메타데이터를,
`openclaw.install`을 통해 install 힌트를 알릴 수 있습니다. 이렇게 하면 코어 카탈로그가 데이터 비종속 상태를 유지합니다.

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
- `docsLabel`: 문서 링크의 텍스트 재정의
- `preferOver`: 이 카탈로그 엔트리가 더 높은 우선순위를 가져야 하는 낮은 우선순위 plugin/channel id
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: 선택 표면 복사 제어
- `markdownCapable`: 아웃바운드 서식 결정에서 채널이 markdown 가능함을 표시
- `exposure.configured`: `false`로 설정하면 구성된 채널 목록 표면에서 채널 숨김
- `exposure.setup`: `false`로 설정하면 대화형 setup/configure picker에서 채널 숨김
- `exposure.docs`: 문서 탐색 표면에서 채널을 내부/비공개로 표시
- `showConfigured` / `showInSetup`: 호환성을 위해 여전히 허용되는 레거시 별칭; `exposure`를 우선
- `quickstartAllowFrom`: 채널을 표준 빠른 시작 `allowFrom` 흐름에 옵트인
- `forceAccountBinding`: 계정이 하나뿐이어도 명시적 계정 바인딩 요구
- `preferSessionLookupForAnnounceTarget`: announce 대상 해결 시 session lookup 우선

OpenClaw는 **외부 채널 카탈로그**도 병합할 수 있습니다 (예: MPM
레지스트리 export). 다음 위치 중 하나에 JSON 파일을 두세요:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

또는 `OPENCLAW_PLUGIN_CATALOG_PATHS` (또는 `OPENCLAW_MPM_CATALOG_PATHS`)를
하나 이상의 JSON 파일로 지정하세요 (쉼표/세미콜론/`PATH` 구분). 각 파일은
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`
형태를 포함해야 합니다. 파서는 `"entries"` 키의 레거시 별칭으로
`"packages"` 또는 `"plugins"`도 허용합니다.

## 컨텍스트 엔진 플러그인

컨텍스트 엔진 플러그인은 세션 컨텍스트 오케스트레이션의 수집, 조립,
압축을 담당합니다. 플러그인에서
`api.registerContextEngine(id, factory)`로 등록한 뒤,
`plugins.slots.contextEngine`으로 활성 엔진을 선택하세요.

기본 컨텍스트 파이프라인을 단순히 메모리 검색이나 훅으로 확장하는 것이 아니라
교체하거나 확장해야 할 때 사용하세요.

```ts
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

엔진이 압축 알고리즘을 **소유하지 않는다면** `compact()`는 계속
구현하고 명시적으로 위임하세요:

```ts
import { delegateCompactionToRuntime } from "openclaw/plugin-sdk/core";

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
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
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

1. 코어 계약 정의
   코어가 어떤 공유 동작을 소유해야 하는지 결정합니다: 정책, 폴백, config 병합,
   수명 주기, 채널 대상 의미 체계, 런타임 헬퍼 형태.
2. typed 플러그인 등록/런타임 표면 추가
   `OpenClawPluginApi` 및/또는 `api.runtime`를 가장 작지만 유용한
   typed 기능 표면으로 확장합니다.
3. 코어 + 채널/기능 소비자 연결
   채널 및 기능 플러그인은 벤더 구현을 직접 import하지 말고,
   코어를 통해 새 기능을 소비해야 합니다.
4. 벤더 구현 등록
   그런 다음 벤더 플러그인이 해당 기능에 대해 자신의 백엔드를 등록합니다.
5. 계약 커버리지 추가
   시간이 지나도 소유권과 등록 형태가 명확하게 유지되도록 테스트를 추가합니다.

이렇게 해야 OpenClaw가 특정 프로바이더의 관점에 하드코딩되지 않으면서도
의견을 가진 시스템으로 유지될 수 있습니다. 구체적인 파일 체크리스트와 예제가 필요하면
[기능 Cookbook](/ko/plugins/architecture)을 참고하세요.

### 기능 체크리스트

새 기능을 추가할 때는 구현이 보통 다음 표면을 함께 건드려야 합니다:

- `src/<capability>/types.ts`의 코어 계약 타입
- `src/<capability>/runtime.ts`의 코어 러너/런타임 헬퍼
- `src/plugins/types.ts`의 플러그인 API 등록 표면
- `src/plugins/registry.ts`의 플러그인 레지스트리 wiring
- 기능/채널 플러그인이 이를 소비해야 하는 경우 `src/plugins/runtime/*`의 플러그인 런타임 노출
- `src/test-utils/plugin-registration.ts`의 capture/test helper
- `src/plugins/contracts/registry.ts`의 소유권/계약 assertion
- `docs/`의 운영자/플러그인 문서

이 표면들 중 하나라도 빠져 있다면, 보통 그 기능이 아직 완전히 통합되지 않았다는 신호입니다.

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

이렇게 하면 규칙이 단순해집니다:

- 코어가 기능 계약 + 오케스트레이션을 담당
- 벤더 플러그인이 벤더 구현을 담당
- 기능/채널 플러그인이 런타임 헬퍼를 소비
- 계약 테스트가 소유권을 명시적으로 유지
