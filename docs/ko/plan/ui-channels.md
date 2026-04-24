---
read_when:
    - 채널 메시지 UI, 대화형 페이로드, 네이티브 채널 렌더러 리팩터링하기
    - 메시지 도구 capability, 전달 힌트, 교차 컨텍스트 마커 변경하기
    - Discord Carbon import fanout 또는 채널 Plugin 런타임 지연성 디버깅하기
summary: 시맨틱 메시지 표현을 채널의 네이티브 UI 렌더러와 분리합니다.
title: 채널 프레젠테이션 리팩터링 계획
x-i18n:
    generated_at: "2026-04-24T06:23:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: f983c4d14580e8a66744c7e5f23dd9846c11e926181a8441d60f346cec6d1eea
    source_path: plan/ui-channels.md
    workflow: 15
---

## 상태

공유 에이전트, CLI, Plugin capability, 아웃바운드 전달 표면에 대해 구현 완료:

- `ReplyPayload.presentation`이 시맨틱 메시지 UI를 전달합니다.
- `ReplyPayload.delivery.pin`이 전송된 메시지 pin 요청을 전달합니다.
- 공유 메시지 action은 provider 네이티브 `components`, `blocks`, `buttons`, `card` 대신 `presentation`, `delivery`, `pin`을 노출합니다.
- 코어는 Plugin이 선언한 아웃바운드 capability를 통해 presentation을 렌더링하거나 자동으로 degrade합니다.
- Discord, Slack, Telegram, Mattermost, MS Teams, Feishu 렌더러가 일반 계약을 소비합니다.
- Discord 채널 control-plane 코드는 더 이상 Carbon 기반 UI 컨테이너를 import하지 않습니다.

정식 문서는 이제 [메시지 프레젠테이션](/ko/plugins/message-presentation)에 있습니다.
이 계획은 과거 구현 맥락용으로 유지하세요. 계약, 렌더러, 또는 fallback 동작이 변경되면
정식 가이드를 업데이트하세요.

## 문제

채널 UI는 현재 서로 호환되지 않는 여러 표면으로 나뉘어 있습니다.

- 코어는 `buildCrossContextComponents`를 통해 Discord 형태의 교차 컨텍스트 렌더러 Hook을 소유합니다.
- Discord `channel.ts`는 `DiscordUiContainer`를 통해 네이티브 Carbon UI를 import할 수 있어, 채널 Plugin control plane으로 런타임 UI 의존성을 끌어옵니다.
- 에이전트와 CLI는 Discord `components`, Slack `blocks`, Telegram 또는 Mattermost `buttons`, Teams 또는 Feishu `card` 같은 네이티브 페이로드 escape hatch를 노출합니다.
- `ReplyPayload.channelData`는 전송 힌트와 네이티브 UI envelope를 모두 담고 있습니다.
- 일반 `interactive` 모델은 존재하지만, Discord, Slack, Teams, Feishu, LINE, Telegram, Mattermost에서 이미 사용 중인 더 풍부한 레이아웃보다는 범위가 좁습니다.

이 때문에 코어가 네이티브 UI 형태를 인식하게 되고, Plugin 런타임 지연성이 약화되며, 에이전트가 동일한 메시지 의도를 표현하는 데 provider별 방법을 너무 많이 가지게 됩니다.

## 목표

- 코어가 선언된 capability로부터 메시지에 대한 최적의 시맨틱 프레젠테이션을 결정합니다.
- extension은 capability를 선언하고 시맨틱 프레젠테이션을 네이티브 전송 페이로드로 렌더링합니다.
- 웹 Control UI는 채팅 네이티브 UI와 분리된 상태를 유지합니다.
- 네이티브 채널 페이로드는 공유 에이전트나 CLI 메시지 표면을 통해 노출되지 않습니다.
- 지원되지 않는 presentation 기능은 자동으로 최적의 텍스트 표현으로 degrade됩니다.
- 전송된 메시지 pinning 같은 전달 동작은 presentation이 아니라 일반적인 전달 메타데이터입니다.

## 비목표

- `buildCrossContextComponents`에 대한 하위 호환 shim 없음.
- `components`, `blocks`, `buttons`, `card`에 대한 공개 네이티브 escape hatch 없음.
- 코어에서 채널 네이티브 UI 라이브러리 import 없음.
- 번들 채널에 대한 provider별 SDK seam 없음.

## 목표 모델

코어 소유 `presentation` 필드를 `ReplyPayload`에 추가합니다.

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};
```

마이그레이션 중 `interactive`는 `presentation`의 하위 집합이 됩니다.

- `interactive` 텍스트 블록은 `presentation.blocks[].type = "text"`로 매핑됩니다.
- `interactive` 버튼 블록은 `presentation.blocks[].type = "buttons"`로 매핑됩니다.
- `interactive` select 블록은 `presentation.blocks[].type = "select"`로 매핑됩니다.

외부 에이전트와 CLI 스키마는 이제 `presentation`을 사용합니다. `interactive`는 기존 reply producer를 위한 내부 레거시 parser/rendering helper로 남습니다.

## 전달 메타데이터

UI가 아닌 전송 동작을 위한 코어 소유 `delivery` 필드를 추가합니다.

```ts
type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

의미:

- `delivery.pin = true`는 첫 번째로 성공적으로 전달된 메시지를 pin하라는 뜻입니다.
- `notify`의 기본값은 `false`입니다.
- `required`의 기본값은 `false`이며, 지원되지 않는 채널 또는 pinning 실패는 전달을 계속하면서 자동으로 degrade됩니다.
- 수동 `pin`, `unpin`, `list-pins` 메시지 action은 기존 메시지에 대해 그대로 유지됩니다.

현재 Telegram ACP topic binding은 `channelData.telegram.pin = true`에서 `delivery.pin = true`로 이동해야 합니다.

## 런타임 capability 계약

presentation 및 delivery 렌더 Hook을 control-plane 채널 Plugin이 아니라 런타임 아웃바운드 어댑터에 추가합니다.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

코어 동작:

- 대상 채널과 런타임 어댑터를 확인합니다.
- presentation capability를 요청합니다.
- 지원되지 않는 블록을 렌더링 전에 degrade합니다.
- `renderPresentation`을 호출합니다.
- 렌더러가 없으면 presentation을 텍스트 fallback으로 변환합니다.
- 전송 성공 후 `delivery.pin`이 요청되고 지원되면 `pinDeliveredMessage`를 호출합니다.

## 채널 매핑

Discord:

- `presentation`을 런타임 전용 모듈에서 components v2와 Carbon 컨테이너로 렌더링합니다.
- accent color helper는 가벼운 모듈에 유지합니다.
- 채널 Plugin control-plane 코드에서 `DiscordUiContainer` import를 제거합니다.

Slack:

- `presentation`을 Block Kit으로 렌더링합니다.
- 에이전트와 CLI의 `blocks` 입력을 제거합니다.

Telegram:

- 텍스트, context, divider를 텍스트로 렌더링합니다.
- action과 select는 대상 표면에서 구성 및 허용된 경우 inline keyboard로 렌더링합니다.
- inline button이 비활성화되어 있으면 텍스트 fallback을 사용합니다.
- ACP topic pinning을 `delivery.pin`으로 이동합니다.

Mattermost:

- action을 구성된 경우 대화형 버튼으로 렌더링합니다.
- 다른 블록은 텍스트 fallback으로 렌더링합니다.

MS Teams:

- `presentation`을 Adaptive Cards로 렌더링합니다.
- 수동 pin/unpin/list-pins action은 유지합니다.
- 대상 대화에서 Graph 지원이 신뢰할 수 있다면 `pinDeliveredMessage`를 선택적으로 구현합니다.

Feishu:

- `presentation`을 interactive cards로 렌더링합니다.
- 수동 pin/unpin/list-pins action은 유지합니다.
- API 동작이 신뢰할 수 있다면 전송된 메시지 pinning용 `pinDeliveredMessage`를 선택적으로 구현합니다.

LINE:

- 가능한 경우 `presentation`을 Flex 또는 template message로 렌더링합니다.
- 지원되지 않는 블록은 텍스트로 fallback합니다.
- LINE UI 페이로드를 `channelData`에서 제거합니다.

일반 또는 제한된 채널:

- presentation을 보수적인 서식의 텍스트로 변환합니다.

## 리팩터링 단계

1. `ui-colors.ts`를 Carbon 기반 UI에서 분리하고 `extensions/discord/src/channel.ts`에서 `DiscordUiContainer`를 제거하는 Discord 릴리스 수정을 다시 적용합니다.
2. `ReplyPayload`, 아웃바운드 페이로드 정규화, 전달 요약, Hook 페이로드에 `presentation`과 `delivery`를 추가합니다.
3. 좁은 SDK/런타임 하위 경로에 `MessagePresentation` 스키마와 parser helper를 추가합니다.
4. 메시지 capability `buttons`, `cards`, `components`, `blocks`를 시맨틱 presentation capability로 대체합니다.
5. presentation 렌더와 delivery pinning을 위한 런타임 아웃바운드 어댑터 Hook을 추가합니다.
6. 교차 컨텍스트 component 구성을 `buildCrossContextPresentation`으로 대체합니다.
7. `src/infra/outbound/channel-adapters.ts`를 삭제하고 채널 Plugin 타입에서 `buildCrossContextComponents`를 제거합니다.
8. `maybeApplyCrossContextMarker`가 네이티브 params 대신 `presentation`을 첨부하도록 변경합니다.
9. Plugin-dispatch send 경로가 시맨틱 presentation과 delivery 메타데이터만 소비하도록 업데이트합니다.
10. 에이전트와 CLI의 네이티브 페이로드 params `components`, `blocks`, `buttons`, `card`를 제거합니다.
11. 네이티브 message-tool 스키마를 생성하던 SDK helper를 제거하고, 이를 presentation 스키마 helper로 대체합니다.
12. `channelData`에서 UI/네이티브 envelope를 제거하고, 남은 각 필드가 검토될 때까지 전송 메타데이터만 유지합니다.
13. Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE 렌더러를 마이그레이션합니다.
14. 메시지 CLI, 채널 페이지, Plugin SDK, capability cookbook 문서를 업데이트합니다.
15. Discord 및 영향받는 채널 entrypoint에 대한 import fanout profiling을 실행합니다.

이 리팩터링에서는 공유 에이전트, CLI, Plugin capability, 아웃바운드 어댑터 계약에 대해 1-11 및 13-14단계가 구현되었습니다. 12단계는 provider 비공개 `channelData` 전송 envelope에 대한 더 깊은 내부 정리 작업으로 남아 있습니다. 15단계는 타입/테스트 게이트를 넘어 import-fanout 수치를 정량화하고 싶을 때의 후속 검증으로 남아 있습니다.

## 테스트

다음을 추가하거나 업데이트합니다.

- Presentation 정규화 테스트
- 지원되지 않는 블록에 대한 presentation 자동 degrade 테스트
- Plugin dispatch 및 코어 전달 경로에 대한 교차 컨텍스트 마커 테스트
- Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE, 텍스트 fallback에 대한 채널 렌더 매트릭스 테스트
- 네이티브 필드가 제거되었음을 증명하는 메시지 도구 스키마 테스트
- 네이티브 플래그가 제거되었음을 증명하는 CLI 테스트
- Carbon을 다루는 Discord entrypoint import 지연성 회귀 테스트
- Telegram 및 일반 fallback을 다루는 delivery pin 테스트

## 열린 질문

- 첫 번째 단계에서 `delivery.pin`을 Discord, Slack, MS Teams, Feishu에 구현해야 할까요, 아니면 Telegram만 먼저 해야 할까요?
- `delivery`가 결국 `replyToId`, `replyToCurrent`, `silent`, `audioAsVoice` 같은 기존 필드도 흡수해야 할까요, 아니면 post-send 동작에만 집중해야 할까요?
- presentation이 이미지나 파일 참조를 직접 지원해야 할까요, 아니면 지금은 미디어를 UI 레이아웃과 분리된 상태로 유지해야 할까요?

## 관련

- [채널 개요](/ko/channels)
- [메시지 프레젠테이션](/ko/plugins/message-presentation)
