---
read_when:
    - 네이티브 OpenClaw Plugin 빌드 또는 디버깅하기
    - Plugin capability 모델 또는 소유권 경계를 이해하기
    - Plugin 로드 파이프라인 또는 레지스트리 작업하기
    - provider 런타임 hook 또는 채널 Plugin 구현하기
sidebarTitle: Internals
summary: 'Plugin 내부 구조: capability 모델, 소유권, 계약, 로드 파이프라인, 런타임 헬퍼'
title: Plugin 내부 구조
x-i18n:
    generated_at: "2026-04-24T06:25:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 344c02f9f0bb19780d262929e665fcaf8093ac08cda30b61af56857368b0b07a
    source_path: plugins/architecture.md
    workflow: 15
---

이 문서는 OpenClaw Plugin 시스템의 **심층 아키텍처 참조**입니다. 실용적인 가이드는
아래의 집중된 페이지 중 하나부터 시작하세요.

<CardGroup cols={2}>
  <Card title="Plugin 설치 및 사용" icon="plug" href="/ko/tools/plugin">
    Plugin 추가, 활성화, 문제 해결을 위한 최종 사용자 가이드
  </Card>
  <Card title="Plugin 빌드" icon="rocket" href="/ko/plugins/building-plugins">
    가장 작은 동작하는 manifest로 시작하는 첫 Plugin 튜토리얼
  </Card>
  <Card title="채널 Plugin" icon="comments" href="/ko/plugins/sdk-channel-plugins">
    메시징 채널 Plugin 빌드
  </Card>
  <Card title="Provider Plugin" icon="microchip" href="/ko/plugins/sdk-provider-plugins">
    모델 provider Plugin 빌드
  </Card>
  <Card title="SDK 개요" icon="book" href="/ko/plugins/sdk-overview">
    import 맵 및 등록 API 참조
  </Card>
</CardGroup>

## 공개 capability 모델

Capabilities는 OpenClaw 내부의 공개 **네이티브 Plugin** 모델입니다. 모든
네이티브 OpenClaw Plugin은 하나 이상의 capability 유형에 대해 등록합니다.

| Capability | 등록 메서드 | 예시 Plugin |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| 텍스트 추론 | `api.registerProvider(...)` | `openai`, `anthropic` |
| CLI 추론 백엔드 | `api.registerCliBackend(...)` | `openai`, `anthropic` |
| 음성 | `api.registerSpeechProvider(...)` | `elevenlabs`, `microsoft` |
| 실시간 전사 | `api.registerRealtimeTranscriptionProvider(...)` | `openai` |
| 실시간 음성 | `api.registerRealtimeVoiceProvider(...)` | `openai` |
| 미디어 이해 | `api.registerMediaUnderstandingProvider(...)` | `openai`, `google` |
| 이미지 생성 | `api.registerImageGenerationProvider(...)` | `openai`, `google`, `fal`, `minimax` |
| 음악 생성 | `api.registerMusicGenerationProvider(...)` | `google`, `minimax` |
| 비디오 생성 | `api.registerVideoGenerationProvider(...)` | `qwen` |
| 웹 fetch | `api.registerWebFetchProvider(...)` | `firecrawl` |
| 웹 검색 | `api.registerWebSearchProvider(...)` | `google` |
| 채널 / 메시징 | `api.registerChannel(...)` | `msteams`, `matrix` |

capability를 하나도 등록하지 않고 hooks, tools, 또는
services만 제공하는 Plugin은 **레거시 hook-only** Plugin입니다. 이 패턴도 여전히 완전히 지원됩니다.

### 외부 호환성 입장

capability 모델은 core에 반영되었고 현재 번들/네이티브 Plugin에서
사용되고 있지만, 외부 Plugin 호환성은 "내보내졌으니 고정되었다"보다 더 엄격한 기준이 필요합니다.

| Plugin 상황 | 가이드 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 기존 외부 Plugin | hook 기반 통합이 계속 동작하도록 유지. 이것이 호환성 기준선입니다. |
| 새로운 번들/네이티브 Plugin | vendor별 우회 접근이나 새로운 hook-only 설계보다 명시적 capability 등록을 선호하세요. |
| capability 등록을 채택하는 외부 Plugin | 허용되지만 문서에서 안정적이라고 표시하지 않는 한 capability별 helper 표면은 진화 중이라고 간주하세요. |

capability 등록이 의도된 방향입니다. 레거시 hooks는 전환 기간 동안 외부 Plugin에 대해
가장 안전한 무중단 경로로 남아 있습니다. 내보낸 helper subpath가 모두 동등한 것은 아니므로,
우발적 helper export보다 좁고 문서화된 계약을 선호하세요.

### Plugin 형태

OpenClaw는 로드된 각 Plugin을 정적 메타데이터가 아니라
실제 등록 동작에 따라 다음 형태로 분류합니다.

- **plain-capability**: 정확히 하나의 capability 유형만 등록(예:
  `mistral` 같은 provider 전용 Plugin)
- **hybrid-capability**: 여러 capability 유형 등록(예:
  `openai`는 텍스트 추론, 음성, 미디어 이해, 이미지
  생성을 모두 소유)
- **hook-only**: typed 또는 custom hooks만 등록하고 capabilities,
  tools, commands, services는 없음
- **non-capability**: capabilities는 등록하지 않고 tools, commands, services, routes를 등록

`openclaw plugins inspect <id>`를 사용하면 Plugin의 형태와 capability
구성을 볼 수 있습니다. 자세한 내용은 [CLI reference](/ko/cli/plugins#inspect)를 참조하세요.

### 레거시 hooks

`before_agent_start` hook은 hook-only Plugin을 위한 호환성 경로로 계속 지원됩니다. 실제 레거시 Plugin이 여전히 여기에 의존합니다.

방향:

- 계속 동작하도록 유지
- 레거시로 문서화
- 모델/provider 재정의 작업에는 `before_model_resolve`를 선호
- 프롬프트 변경 작업에는 `before_prompt_build`를 선호
- 실제 사용량이 줄고 fixture 커버리지가 안전한 마이그레이션을 입증할 때만 제거

### 호환성 신호

`openclaw doctor` 또는 `openclaw plugins inspect <id>`를 실행하면
다음 레이블 중 하나를 볼 수 있습니다.

| 신호 | 의미 |
| -------------------------- | ------------------------------------------------------------ |
| **config valid** | 설정이 정상적으로 파싱되고 Plugin이 확인됨 |
| **compatibility advisory** | Plugin이 지원되지만 오래된 패턴을 사용함(예: `hook-only`) |
| **legacy warning** | Plugin이 deprecated된 `before_agent_start`를 사용함 |
| **hard error** | 설정이 잘못되었거나 Plugin 로드 실패 |

`hook-only`와 `before_agent_start` 모두 현재는 Plugin을 깨뜨리지 않습니다.
`hook-only`는 advisory이고, `before_agent_start`는 경고만 발생시킵니다. 이러한
신호는 `openclaw status --all`과 `openclaw plugins doctor`에도 나타납니다.

## 아키텍처 개요

OpenClaw의 Plugin 시스템은 네 개의 계층으로 구성됩니다.

1. **Manifest + discovery**
   OpenClaw는 구성된 경로, 워크스페이스 루트,
   전역 Plugin 루트, 번들 Plugin에서 후보 Plugin을 찾습니다. discovery는 먼저 네이티브
   `openclaw.plugin.json` manifest와 지원되는 번들 manifest를 읽습니다.
2. **활성화 + 검증**
   core는 발견된 Plugin이 활성화, 비활성화, 차단, 또는
   memory 같은 배타적 슬롯에 선택되었는지 결정합니다.
3. **런타임 로딩**
   네이티브 OpenClaw Plugin은 jiti를 통해 프로세스 내부에서 로드되고
   중앙 레지스트리에 capabilities를 등록합니다. 호환되는 번들은 런타임 코드를 import하지 않고
   레지스트리 레코드로 정규화됩니다.
4. **표면 소비**
   OpenClaw의 나머지 부분은 레지스트리를 읽어 tools, channels, provider
   설정, hooks, HTTP routes, CLI commands, services를 노출합니다.

특히 Plugin CLI의 경우, 루트 명령 discovery는 두 단계로 나뉩니다.

- 파싱 시점 메타데이터는 `registerCli(..., { descriptors: [...] })`에서 옴
- 실제 Plugin CLI 모듈은 지연 상태를 유지하고 첫 호출 시 등록될 수 있음

이렇게 하면 Plugin 소유 CLI 코드를 Plugin 내부에 유지하면서도 OpenClaw가
파싱 전에 루트 명령 이름을 예약할 수 있습니다.

중요한 설계 경계:

- discovery + 설정 검증은 Plugin 코드를 실행하지 않고 **manifest/schema metadata**
  로부터 동작해야 합니다
- 네이티브 런타임 동작은 Plugin 모듈의 `register(api)` 경로에서 옵니다

이 분리는 OpenClaw가 전체 런타임이 활성화되기 전에 설정을 검증하고,
누락되었거나 비활성화된 Plugin을 설명하며, UI/schema 힌트를 구성할 수 있게 합니다.

### 활성화 계획

활성화 계획은 제어 평면의 일부입니다. 호출자는 더 넓은 런타임 레지스트리를 로드하기 전에,
구체적인 명령, provider, 채널, route, agent harness, 또는
capability에 어떤 Plugin이 관련 있는지 물어볼 수 있습니다.

planner는 현재 manifest 동작과의 호환성을 유지합니다.

- `activation.*` 필드는 명시적 planner 힌트입니다
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools`, hooks는 여전히 manifest 소유권 대체 경로입니다
- ids 전용 planner API는 기존 호출자용으로 계속 사용 가능합니다
- plan API는 reason label을 보고하므로 진단에서 명시적
  힌트와 소유권 대체를 구분할 수 있습니다

`activation`을 lifecycle hook이나
`register(...)`의 대체로 취급하지 마세요. 이는 로딩 범위를 좁히는 데 사용하는 metadata입니다. 이미 관계를 설명하는
소유권 필드가 있다면 그것을 선호하고, 추가 planner 힌트가 필요할 때만 `activation`을 사용하세요.

### 채널 Plugin과 공용 message 도구

채널 Plugin은 일반 채팅 동작을 위해 별도의 send/edit/react 도구를 등록할 필요가 없습니다.
OpenClaw는 core에 하나의 공용 `message` 도구를 유지하고, 채널 Plugin이 그 뒤의 채널별 discovery 및 실행을 소유합니다.

현재 경계는 다음과 같습니다.

- core는 공용 `message` 도구 호스트, 프롬프트 연결, 세션/스레드
  bookkeeping, 실행 dispatch를 소유
- 채널 Plugin은 범위 지정된 action discovery, capability discovery, 채널별 스키마 조각을 소유
- 채널 Plugin은 대화 id가 스레드 id를 어떻게 인코딩하거나 부모 대화에서 상속하는지 같은
  provider별 세션 대화 문법을 소유
- 채널 Plugin은 action adapter를 통해 최종 action을 실행

채널 Plugin의 경우 SDK 표면은
`ChannelMessageActionAdapter.describeMessageTool(...)`입니다. 이 통합 discovery
호출을 통해 Plugin은 visible actions, capabilities, schema
기여를 함께 반환할 수 있으므로 이 요소들이 서로 어긋나지 않습니다.

채널별 message-tool 매개변수에 로컬 경로나 원격 미디어 URL 같은
미디어 소스가 포함되어 있다면, Plugin은
`describeMessageTool(...)`에서 `mediaSourceParams`도 함께 반환해야 합니다. core는 이 명시적
목록을 사용해 Plugin 소유 매개변수 이름을 하드코딩하지 않고 샌드박스 경로 정규화와
아웃바운드 미디어 접근 힌트를 적용합니다.
하나의 채널 전체 평면 목록이 아니라 action 범위 맵을 선호하세요. 그래야
프로필 전용 미디어 매개변수가 `send` 같은 관련 없는 action에서 정규화되지 않습니다.

core는 런타임 범위를 이 discovery 단계로 전달합니다. 중요한 필드는 다음을 포함합니다.

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 신뢰된 인바운드 `requesterSenderId`

이는 컨텍스트 민감형 Plugin에서 중요합니다. 채널은 활성 account, 현재 room/thread/message,
또는 신뢰된 요청자 정체성에 따라 message action을 숨기거나 노출할 수 있으며,
core `message` 도구에 채널별 분기를 하드코딩할 필요가 없습니다.

이 때문에 embedded-runner 라우팅 변경도 여전히 Plugin 작업입니다. runner는
현재 채팅/세션 정체성을 Plugin discovery 경계로 전달하여 공용 `message` 도구가
현재 턴에 맞는 채널 소유 표면을 노출하도록 해야 합니다.

채널 소유 실행 helper의 경우 번들 Plugin은 실행
런타임을 자체 extension 모듈 안에 유지해야 합니다. core는 더 이상
`src/agents/tools` 아래의 Discord, Slack, Telegram, WhatsApp message-action 런타임을 소유하지 않습니다.
별도의 `plugin-sdk/*-action-runtime` subpath는 공개하지 않으며, 번들
Plugin은 자체 extension 소유 모듈에서 로컬 런타임 코드를 직접 import해야 합니다.

같은 경계는 provider 이름이 붙은 SDK seam 전반에도 적용됩니다. core는
Slack, Discord, Signal, WhatsApp 등의 extension용 채널별 편의 barrel을 import해서는 안 됩니다.
core에 특정 동작이 필요하다면 번들 Plugin의 자체 `api.ts` / `runtime-api.ts`
barrel을 소비하거나, 그 필요를 공유 SDK의 좁은 일반 capability로 승격하세요.

특히 poll의 경우 실행 경로는 두 가지입니다.

- `outbound.sendPoll`은 공통
  poll 모델에 맞는 채널을 위한 공용 기준선입니다
- `actions.handleAction("poll")`은 채널별
  poll 의미 체계나 추가 poll 매개변수에 선호되는 경로입니다

이제 core는 Plugin poll dispatch가 action을 거절한 뒤에야 공용 poll 파싱을 수행하므로,
Plugin 소유 poll 핸들러가 일반 poll 파서에 먼저 막히지 않고 채널별 poll
필드를 받을 수 있습니다.

전체 시작 시퀀스는 [Plugin architecture internals](/ko/plugins/architecture-internals)를 참조하세요.

## Capability 소유권 모델

OpenClaw는 네이티브 Plugin을 관련 없는 통합의 묶음이 아니라 **회사** 또는
**기능**의 소유권 경계로 취급합니다.

즉, 다음을 의미합니다.

- 회사 Plugin은 보통 해당 회사의 모든 OpenClaw 노출
  표면을 소유해야 합니다
- 기능 Plugin은 보통 자신이 도입하는 전체 기능 표면을 소유해야 합니다
- 채널은 provider 동작을 임시방편으로 재구현하는 대신 공용 core capability를 소비해야 합니다

<Accordion title="번들 Plugin 전반의 예시 소유권 패턴">
  - **벤더 다중 capability**: `openai`는 텍스트 추론, 음성, 실시간
    음성, 미디어 이해, 이미지 생성을 소유합니다. `google`은 텍스트
    추론과 함께 미디어 이해, 이미지 생성, 웹 검색을 소유합니다.
    `qwen`은 텍스트 추론과 함께 미디어 이해 및 비디오 생성을 소유합니다.
  - **벤더 단일 capability**: `elevenlabs`와 `microsoft`는 음성을 소유합니다.
    `firecrawl`은 web-fetch를 소유합니다. `minimax` / `mistral` / `moonshot` / `zai`는
    미디어 이해 백엔드를 소유합니다.
  - **기능 Plugin**: `voice-call`은 통화 전송, tools, CLI, routes,
    Twilio 미디어 스트림 브리징을 소유하지만, 벤더
    Plugin을 직접 import하는 대신 공용 음성, 실시간 전사, 실시간 음성 capability를 소비합니다.
</Accordion>

의도된 최종 상태는 다음과 같습니다.

- OpenAI는 텍스트 모델, 음성, 이미지, 그리고
  향후 비디오까지 하나의 Plugin에 존재
- 다른 벤더도 동일하게 자신의 표면 영역을 하나의 Plugin으로 소유 가능
- 채널은 어떤 벤더 Plugin이 provider를 소유하는지 신경 쓰지 않고 core가 노출하는
  공용 capability 계약을 소비

이것이 핵심 구분입니다.

- **Plugin** = 소유권 경계
- **capability** = 여러 Plugin이 구현하거나 소비할 수 있는 core 계약

따라서 OpenClaw가 비디오 같은 새 도메인을 추가할 때 첫 질문은
"어떤 provider가 비디오 처리를 하드코딩해야 하는가?"가 아닙니다. 첫 질문은 "핵심 비디오 capability 계약이 무엇인가?"입니다.
그 계약이 존재하면 벤더 Plugin이 그것에 등록할 수 있고, 채널/기능 Plugin이 그것을 소비할 수 있습니다.

capability가 아직 존재하지 않는다면, 보통 올바른 순서는 다음과 같습니다.

1. core에서 누락된 capability를 정의
2. Plugin API/런타임을 통해 typed 방식으로 노출
3. 채널/기능을 해당 capability에 연결
4. 벤더 Plugin이 구현을 등록하게 함

이렇게 하면 소유권을 명시적으로 유지하면서도 특정
벤더나 일회성 Plugin 전용 코드 경로에 의존하는 core 동작을 피할 수 있습니다.

### Capability 계층화

코드가 어디에 속하는지 결정할 때 다음 개념 모델을 사용하세요.

- **core capability 계층**: 공용 오케스트레이션, 정책, 대체, 설정
  병합 규칙, 전달 의미 체계, typed 계약
- **벤더 Plugin 계층**: 벤더별 API, 인증, 모델 카탈로그, 음성
  합성, 이미지 생성, 향후 비디오 백엔드, 사용량 엔드포인트
- **채널/기능 Plugin 계층**: Slack/Discord/voice-call 등 통합으로,
  core capability를 소비하고 이를 표면에 제시

예를 들어 TTS는 다음 구조를 따릅니다.

- core는 응답 시점 TTS 정책, 대체 순서, prefs, 채널 전달을 소유
- `openai`, `elevenlabs`, `microsoft`는 합성 구현을 소유
- `voice-call`은 telephony TTS 런타임 helper를 소비

향후 capability에도 같은 패턴을 선호해야 합니다.

### 다중 capability 회사 Plugin 예시

회사 Plugin은 외부에서 보기에 응집력 있게 느껴져야 합니다. OpenClaw가
모델, 음성, 실시간 전사, 실시간 음성, 미디어
이해, 이미지 생성, 비디오 생성, web fetch, 웹 검색에 대한 공용 계약을 가지고 있다면,
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

중요한 것은 정확한 helper 이름이 아니라 형태입니다.

- 하나의 Plugin이 벤더 표면을 소유
- core는 여전히 capability 계약을 소유
- 채널과 기능 Plugin은 벤더 코드가 아니라 `api.runtime.*` helper를 소비
- 계약 테스트는 Plugin이 자신이 소유한다고 주장하는 capability를 등록했는지 검증 가능

### Capability 예시: 비디오 이해

OpenClaw는 이미 이미지/오디오/비디오 이해를 하나의 공용
capability로 취급합니다. 여기에도 같은 소유권 모델이 적용됩니다.

1. core가 media-understanding 계약을 정의
2. 벤더 Plugin이 필요에 따라 `describeImage`, `transcribeAudio`,
   `describeVideo`를 등록
3. 채널과 기능 Plugin은 벤더 코드에 직접 연결하는 대신 공용 core 동작을 소비

이렇게 하면 한 provider의 비디오 가정을 core에 박아 넣는 것을 피할 수 있습니다. Plugin이
벤더 표면을 소유하고, core는 capability 계약과 대체 동작을 소유합니다.

비디오 생성도 이미 같은 순서를 사용합니다. core가 typed
capability 계약과 런타임 helper를 소유하고, 벤더 Plugin이
그에 대해 `api.registerVideoGenerationProvider(...)` 구현을 등록합니다.

구체적인 롤아웃 체크리스트가 필요하다면
[Capability Cookbook](/ko/plugins/architecture)를 참조하세요.

## 계약과 강제

Plugin API 표면은 의도적으로 `OpenClawPluginApi` 안에 typed되고 중앙화되어 있습니다.
이 계약은 지원되는 등록 지점과
Plugin이 의존할 수 있는 런타임 helper를 정의합니다.

이것이 중요한 이유:

- Plugin 작성자는 하나의 안정적인 내부 표준을 갖게 됨
- core는 두 Plugin이 같은
  provider id를 등록하는 중복 소유권을 거부할 수 있음
- 시작 시 잘못된 등록에 대해 실행 가능한 진단을 제공할 수 있음
- 계약 테스트가 번들 Plugin 소유권을 강제하고 조용한 드리프트를 방지할 수 있음

강제 계층은 두 가지입니다.

1. **런타임 등록 강제**
   Plugin 레지스트리는 Plugin이 로드될 때 등록을 검증합니다. 예:
   중복 provider id, 중복 speech provider id, 잘못된
   등록은 정의되지 않은 동작 대신 Plugin 진단을 생성합니다.
2. **계약 테스트**
   번들 Plugin은 테스트 실행 중 계약 레지스트리에 캡처되므로
   OpenClaw가 소유권을 명시적으로 검증할 수 있습니다. 현재는 모델
   provider, speech provider, web search provider, 번들 등록
   소유권에 사용됩니다.

실질적인 효과는 OpenClaw가 어느 Plugin이 어느 표면을 소유하는지
미리 알고 있다는 것입니다. 소유권이 암묵적인 것이 아니라 선언되고, typed되며, 테스트 가능하기 때문에
core와 채널이 자연스럽게 조합될 수 있습니다.

### 계약에 포함되어야 할 것

좋은 Plugin 계약은 다음과 같습니다.

- typed
- 작음
- capability별
- core가 소유
- 여러 Plugin에서 재사용 가능
- 벤더 지식 없이 채널/기능이 소비 가능

나쁜 Plugin 계약은 다음과 같습니다.

- core에 숨겨진 벤더별 정책
- 레지스트리를 우회하는 일회성 Plugin 탈출구
- 벤더 구현으로 바로 들어가는 채널 코드
- `OpenClawPluginApi` 또는
  `api.runtime`의 일부가 아닌 임시 런타임 객체

확실하지 않을 때는 추상화 수준을 높이세요. 먼저 capability를 정의하고, 그다음
Plugin이 그에 연결되게 하세요.

## 실행 모델

네이티브 OpenClaw Plugin은 Gateway와 **동일 프로세스 안에서** 실행됩니다. 샌드박스되지 않습니다.
로드된 네이티브 Plugin은 core 코드와 동일한 프로세스 수준 신뢰 경계를 가집니다.

의미하는 바:

- 네이티브 Plugin은 tools, network handlers, hooks, services를 등록할 수 있음
- 네이티브 Plugin 버그는 gateway를 크래시시키거나 불안정하게 만들 수 있음
- 악의적인 네이티브 Plugin은 OpenClaw 프로세스 내부에서의 임의 코드 실행과 동일함

호환 번들은 현재 OpenClaw가 이를 metadata/content pack으로 취급하기 때문에 기본적으로 더 안전합니다.
현재 릴리스에서 이는 주로 번들
Skills를 의미합니다.

비번들 Plugin에는 허용 목록과 명시적 설치/로드 경로를 사용하세요. 워크스페이스 Plugin은
프로덕션 기본값이 아니라 개발 시점 코드로 취급하세요.

번들 워크스페이스 패키지 이름의 경우 Plugin id는 npm
이름에 고정되게 유지하세요: 기본적으로 `@openclaw/<id>`, 또는
패키지가 의도적으로 더 좁은 Plugin 역할을 노출하는 경우 `-provider`, `-plugin`, `-speech`, `-sandbox`, `-media-understanding` 같은 승인된 typed 접미사를 사용하세요.

중요한 신뢰 참고:

- `plugins.allow`는 소스 출처가 아니라 **Plugin id**를 신뢰합니다.
- 번들 Plugin과 같은 id를 가진 워크스페이스 Plugin은 해당 워크스페이스 Plugin이 활성화/허용 목록에 있을 때 의도적으로
  번들 사본을 가립니다.
- 이는 로컬 개발, 패치 테스트, 핫픽스에 정상적이고 유용한 동작입니다.
- 번들 Plugin 신뢰는 설치 메타데이터가 아니라 로드 시점의 소스 스냅샷 —
  manifest와 디스크의 코드 — 에서 확인됩니다. 손상되었거나
  대체된 설치 기록이 실제 소스가 주장하는 것 이상으로 번들 Plugin의 신뢰
  표면을 조용히 넓히지는 못합니다.

## 내보내기 경계

OpenClaw는 구현 편의 기능이 아니라 capability를 내보냅니다.

capability 등록은 공개 상태로 유지하세요. 비계약 helper export는 줄이세요.

- 번들 Plugin 전용 helper subpath
- 공개 API 용도가 아닌 런타임 plumbing subpath
- 벤더별 convenience helper
- 구현 세부 사항인 setup/onboarding helper

일부 번들 Plugin helper subpath는 호환성과 번들 Plugin 유지보수를 위해
생성된 SDK export 맵에 여전히 남아 있습니다. 현재 예시로는
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, 그리고 여러 `plugin-sdk/matrix*` seam이 있습니다. 이를
새로운 서드파티 Plugin을 위한 권장 SDK 패턴이 아니라 예약된 구현 세부 사항 export로 취급하세요.

## 내부 구조 및 참조

로드 파이프라인, 레지스트리 모델, provider 런타임 hook, Gateway HTTP
routes, message tool 스키마, 채널 target 확인, provider 카탈로그,
context engine Plugin, 그리고 새 capability 추가 가이드는
[Plugin architecture internals](/ko/plugins/architecture-internals)를 참조하세요.

## 관련 항목

- [Building plugins](/ko/plugins/building-plugins)
- [Plugin SDK setup](/ko/plugins/sdk-setup)
- [Plugin manifest](/ko/plugins/manifest)
