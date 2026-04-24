---
read_when:
    - 메시지 카드, 버튼 또는 선택 항목 렌더링 추가 또는 수정하기
    - 리치 아웃바운드 메시지를 지원하는 채널 Plugin 만들기
    - 메시지 도구 프레젠테이션 또는 전달 capability 변경하기
    - provider별 카드/블록/컴포넌트 렌더링 회귀 디버깅하기
summary: 채널 Plugins용 시맨틱 메시지 카드, 버튼, 선택 항목, 대체 텍스트, 전달 힌트
title: 메시지 프레젠테이션
x-i18n:
    generated_at: "2026-04-24T06:26:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c8c3903101310de330017b34bc2f0d641f4c8ea2b80a30532736b4409716510
    source_path: plugins/message-presentation.md
    workflow: 15
---

메시지 프레젠테이션은 리치 아웃바운드 채팅 UI를 위한 OpenClaw의 공용 계약입니다.
이를 통해 에이전트, CLI 명령, 승인 흐름, Plugins가 메시지
의도를 한 번만 기술하면, 각 채널 Plugin이 가능한 최적의 네이티브 형태로 렌더링할 수 있습니다.

이식 가능한 메시지 UI에는 presentation을 사용하세요.

- 텍스트 섹션
- 작은 컨텍스트/푸터 텍스트
- 구분선
- 버튼
- 선택 메뉴
- 카드 제목 및 tone

Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card`, Feishu `card` 같은 새로운 provider 네이티브 필드를 공용
message tool에 추가하지 마세요. 이것들은 채널 Plugin이 소유하는 렌더러 출력입니다.

## 계약

Plugin 작성자는 다음에서 공개 계약을 import합니다.

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

형태:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
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

버튼 의미 체계:

- `value`는 채널이 클릭 가능한 제어를 지원할 때 채널의
  기존 상호작용 경로를 통해 다시 라우팅되는 애플리케이션 작업 값입니다.
- `url`은 링크 버튼입니다. `value` 없이 존재할 수 있습니다.
- `label`은 필수이며 텍스트 대체에서도 사용됩니다.
- `style`은 권고 사항입니다. 렌더러는 지원되지 않는 스타일을 전송 실패가 아니라 안전한
  기본값으로 매핑해야 합니다.

선택 메뉴 의미 체계:

- `options[].value`는 선택된 애플리케이션 값입니다.
- `placeholder`는 권고 사항이며 네이티브
  select 지원이 없는 채널에서는 무시될 수 있습니다.
- 채널이 select를 지원하지 않으면 대체 텍스트에 레이블 목록이 표시됩니다.

## Producer 예시

간단한 카드:

```json
{
  "title": "배포 승인",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary가 승격 준비를 마쳤습니다." },
    { "type": "context", "text": "빌드 1234, staging 통과." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "승인", "value": "deploy:approve", "style": "success" },
        { "label": "거절", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

URL 전용 링크 버튼:

```json
{
  "blocks": [
    { "type": "text", "text": "릴리스 노트가 준비되었습니다." },
    {
      "type": "buttons",
      "buttons": [{ "label": "노트 열기", "url": "https://example.com/release" }]
    }
  ]
}
```

선택 메뉴:

```json
{
  "title": "환경 선택",
  "blocks": [
    {
      "type": "select",
      "placeholder": "환경",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "프로덕션", "value": "env:prod" }
      ]
    }
  ]
}
```

CLI 전송:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "배포 승인" \
  --presentation '{"title":"배포 승인","tone":"warning","blocks":[{"type":"text","text":"Canary가 준비되었습니다."},{"type":"buttons","buttons":[{"label":"승인","value":"deploy:approve","style":"success"},{"label":"거절","value":"deploy:decline","style":"danger"}]}]}'
```

고정 전달:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "주제가 열렸습니다" \
  --pin
```

명시적 JSON을 사용한 고정 전달:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## 렌더러 계약

채널 Plugins는 아웃바운드 어댑터에서 렌더 지원을 선언합니다.

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

Capability 필드는 의도적으로 단순한 boolean입니다. 이는
렌더러가 모든 네이티브 플랫폼 제한이 아니라 무엇을 상호작용 가능하게 만들 수 있는지를 설명합니다. 최대 버튼 수, 블록 수, 카드 크기 같은 플랫폼별 제한은 여전히 렌더러가
소유합니다.

## 코어 렌더 흐름

`ReplyPayload` 또는 message action에 `presentation`이 포함되면 core는:

1. presentation payload를 정규화합니다.
2. 대상 채널의 아웃바운드 어댑터를 확인합니다.
3. `presentationCapabilities`를 읽습니다.
4. 어댑터가 payload를 렌더링할 수 있으면 `renderPresentation`을 호출합니다.
5. 어댑터가 없거나 렌더링할 수 없으면 보수적인 텍스트로 대체합니다.
6. 결과 payload를 일반 채널 전달 경로로 전송합니다.
7. 첫 번째 성공적인
   전송 메시지 후 `delivery.pin` 같은 전달 메타데이터를 적용합니다.

Producer가 채널 비종속적으로 유지되도록 fallback 동작은 core가 소유합니다. 채널
Plugins는 네이티브 렌더링과 상호작용 처리를 소유합니다.

## 저하 규칙

Presentation은 제한된 채널에서도 안전하게 전송될 수 있어야 합니다.

대체 텍스트에는 다음이 포함됩니다.

- 첫 줄로서의 `title`
- 일반 문단으로서의 `text` 블록
- 간결한 컨텍스트 줄로서의 `context` 블록
- 시각적 구분자로서의 `divider` 블록
- 링크 버튼의 URL을 포함한 버튼 레이블
- 선택 옵션 레이블

지원되지 않는 네이티브 제어는 전체 전송을 실패시키기보다 저하되어야 합니다.
예:

- 인라인 버튼이 비활성화된 Telegram은 텍스트 fallback을 보냅니다.
- select를 지원하지 않는 채널은 select 옵션을 텍스트로 나열합니다.
- URL 전용 버튼은 네이티브 링크 버튼 또는 fallback URL 줄이 됩니다.
- 선택적 pin 실패는 전달된 메시지를 실패시키지 않습니다.

주요 예외는 `delivery.pin.required: true`입니다. pin이
필수로 요청되었는데 채널이 전송된 메시지를 pin할 수 없으면 전달은 실패로 보고됩니다.

## Provider 매핑

현재 번들 렌더러:

| 채널            | 네이티브 렌더 대상                  | 참고                                                                                                                                               |
| --------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components 및 component containers  | 기존 provider 네이티브 payload producer를 위해 레거시 `channelData.discord.components`를 유지하지만, 새 공용 전송은 `presentation`을 사용해야 합니다. |
| Slack           | Block Kit                           | 기존 provider 네이티브 payload producer를 위해 레거시 `channelData.slack.blocks`를 유지하지만, 새 공용 전송은 `presentation`을 사용해야 합니다.       |
| Telegram        | 텍스트 + 인라인 키보드              | 버튼/select는 대상 표면에 인라인 버튼 capability가 필요하며, 그렇지 않으면 텍스트 fallback이 사용됩니다.                                           |
| Mattermost      | 텍스트 + interactive props          | 다른 블록은 텍스트로 저하됩니다.                                                                                                                   |
| Microsoft Teams | Adaptive Cards                      | 둘 다 제공되면 일반 `message` 텍스트가 카드와 함께 포함됩니다.                                                                                     |
| Feishu          | Interactive cards                   | 카드 헤더는 `title`을 사용할 수 있으며, 본문은 그 제목을 중복하지 않습니다.                                                                       |
| Plain channels  | 텍스트 fallback                     | 렌더러가 없는 채널도 읽을 수 있는 출력을 받습니다.                                                                                                |

Provider 네이티브 payload 호환성은 기존
reply producer를 위한 과도기적 편의 기능입니다. 새로운 공용 네이티브 필드를 추가해야 하는 이유는 아닙니다.

## Presentation vs InteractiveReply

`InteractiveReply`는 승인 및 상호작용
헬퍼가 사용하는 이전 내부 하위 집합입니다. 지원 항목:

- text
- buttons
- selects

`MessagePresentation`이 정식 공용 전송 계약입니다. 추가 항목:

- title
- tone
- context
- divider
- URL 전용 버튼
- `ReplyPayload.delivery`를 통한 일반 전달 메타데이터

오래된 코드를 브리징할 때는 `openclaw/plugin-sdk/interactive-runtime`의 헬퍼를 사용하세요.

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

새 코드는 `MessagePresentation`을 직접 받아들이거나 생성해야 합니다.

## Delivery Pin

Pinning은 프레젠테이션이 아니라 전달 동작입니다. `channelData.telegram.pin` 같은
provider 네이티브 필드 대신 `delivery.pin`을 사용하세요.

의미 체계:

- `pin: true`는 첫 번째로 성공적으로 전달된 메시지를 pin합니다.
- `pin.notify`의 기본값은 `false`입니다.
- `pin.required`의 기본값은 `false`입니다.
- 선택적 pin 실패는 저하되며 전송된 메시지는 그대로 유지됩니다.
- 필수 pin 실패는 전달을 실패시킵니다.
- Chunked 메시지는 마지막 chunk가 아니라 첫 번째 전달된 chunk를 pin합니다.

수동 `pin`, `unpin`, `pins` message action은 provider가 해당 작업을 지원하는 기존
메시지에 대해 여전히 존재합니다.

## Plugin 작성자 체크리스트

- 채널이 시맨틱 프레젠테이션을 렌더링하거나 안전하게 저하시킬 수 있으면
  `describeMessageTool(...)`에서 `presentation`을 선언하세요.
- 런타임 아웃바운드 어댑터에 `presentationCapabilities`를 추가하세요.
- `renderPresentation`은 제어 평면 Plugin
  설정 코드가 아니라 런타임 코드에 구현하세요.
- 네이티브 UI 라이브러리는 뜨거운 setup/catalog 경로 밖에 두세요.
- 플랫폼 제한은 렌더러와 테스트에 보존하세요.
- 지원되지 않는 버튼, select, URL 버튼, 제목/텍스트
  중복, 혼합된 `message` + `presentation` 전송에 대한 fallback 테스트를 추가하세요.
- provider가 전송된 메시지 ID를 pin할 수 있을 때만 `deliveryCapabilities.pin`과
  `pinDeliveredMessage`를 통해 전달 pin 지원을 추가하세요.
- 공용 message action 스키마를 통해 새로운 provider 네이티브 카드/블록/컴포넌트/버튼 필드를 노출하지 마세요.

## 관련 문서

- [Message CLI](/ko/cli/message)
- [Plugin SDK 개요](/ko/plugins/sdk-overview)
- [Plugin 아키텍처](/ko/plugins/architecture-internals#message-tool-schemas)
- [채널 프레젠테이션 리팩터 계획](/ko/plan/ui-channels)
