---
read_when:
    - 메시지 카드, 버튼, 또는 선택 항목 렌더링 추가 또는 수정하기
    - 풍부한 아웃바운드 메시지를 지원하는 채널 Plugin 빌드하기
    - 메시지 도구 프레젠테이션 또는 전달 기능 변경하기
    - 프로바이더별 카드/블록/컴포넌트 렌더링 회귀 디버깅
summary: 채널 Plugin용 의미적 메시지 카드, 버튼, 선택 항목, 폴백 텍스트, 전달 힌트
title: 메시지 프레젠테이션
x-i18n:
    generated_at: "2026-04-22T04:24:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6913b2b4331598a1396d19a572fba1fffde6cb9a6efa2192f30fe12404eb48d
    source_path: plugins/message-presentation.md
    workflow: 15
---

# 메시지 프레젠테이션

메시지 프레젠테이션은 풍부한 아웃바운드 채팅 UI를 위한 OpenClaw의 공유 계약입니다.
이를 통해 에이전트, CLI 명령, 승인 흐름, Plugin은 메시지
의도를 한 번만 기술하면 되고, 각 채널 Plugin은 가능한 최선의 네이티브 형태로 이를 렌더링할 수 있습니다.

이식 가능한 메시지 UI에는 프레젠테이션을 사용하세요.

- 텍스트 섹션
- 작은 context/footer 텍스트
- 구분선
- 버튼
- 선택 메뉴
- 카드 제목 및 tone

공유 메시지 도구에 Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card`, Feishu `card` 같은 새로운 프로바이더 고유 필드를 추가하지 마세요.
이들은 채널 Plugin이 소유하는 렌더러 출력입니다.

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

- `value`는 채널이 클릭 가능한 컨트롤을 지원할 때
  채널의 기존 상호작용 경로를 통해 다시 라우팅되는 애플리케이션 액션 값입니다.
- `url`은 링크 버튼입니다. `value` 없이 존재할 수 있습니다.
- `label`은 필수이며 텍스트 폴백에서도 사용됩니다.
- `style`은 권고 사항입니다. 렌더러는 지원되지 않는 스타일을
  전송 실패 대신 안전한 기본값으로 매핑해야 합니다.

선택 항목 의미 체계:

- `options[].value`는 선택된 애플리케이션 값입니다.
- `placeholder`는 권고 사항이며, 네이티브
  선택 지원이 없는 채널에서는 무시될 수 있습니다.
- 채널이 선택 항목을 지원하지 않으면 폴백 텍스트에 라벨이 나열됩니다.

## producer 예시

간단한 카드:

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

URL 전용 링크 버튼:

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

선택 메뉴:

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

CLI 전송:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

고정된 전달:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
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

기능 필드는 의도적으로 단순한 boolean입니다. 이는
렌더러가 무엇을 대화형으로 만들 수 있는지를 설명하며, 모든 네이티브 플랫폼 제한을 뜻하지는 않습니다. 렌더러는 여전히 최대 버튼 수, 블록 수, 카드 크기 같은 플랫폼별 제한을 소유합니다.

## 코어 렌더 흐름

`ReplyPayload` 또는 메시지 액션에 `presentation`이 포함되면, 코어는 다음을 수행합니다.

1. 프레젠테이션 페이로드를 정규화합니다.
2. 대상 채널의 아웃바운드 어댑터를 해석합니다.
3. `presentationCapabilities`를 읽습니다.
4. 어댑터가 페이로드를 렌더링할 수 있으면 `renderPresentation`을 호출합니다.
5. 어댑터가 없거나 렌더링할 수 없으면 보수적인 텍스트로 폴백합니다.
6. 결과 페이로드를 일반 채널 전달 경로로 전송합니다.
7. 첫 번째 성공적으로
   전송된 메시지 이후 `delivery.pin` 같은 전달 메타데이터를 적용합니다.

코어는 폴백 동작을 소유하므로 producer는 채널 비종속적으로 유지될 수 있습니다. 채널
Plugins는 네이티브 렌더링과 상호작용 처리를 소유합니다.

## 성능 저하 규칙

프레젠테이션은 제한된 채널에서도 안전하게 전송될 수 있어야 합니다.

폴백 텍스트에는 다음이 포함됩니다.

- 첫 줄의 `title`
- 일반 문단으로서의 `text` 블록
- 간결한 context 줄로서의 `context` 블록
- 시각적 구분자로서의 `divider` 블록
- 링크 버튼의 URL을 포함한 버튼 라벨
- 선택 항목 라벨

지원되지 않는 네이티브 컨트롤은 전체 전송을 실패시키는 대신 성능 저하 처리되어야 합니다.
예시:

- 인라인 버튼이 비활성화된 Telegram은 텍스트 폴백을 전송합니다.
- 선택 항목 지원이 없는 채널은 선택 항목을 텍스트로 나열합니다.
- URL 전용 버튼은 네이티브 링크 버튼 또는 폴백 URL 줄이 됩니다.
- 선택적 고정 실패는 전달된 메시지를 실패시키지 않습니다.

주요 예외는 `delivery.pin.required: true`입니다. 고정이
필수로 요청되었고 채널이 전송된 메시지를 고정할 수 없으면, 전달은 실패를 보고합니다.

## 프로바이더 매핑

현재 번들 렌더러:

| 채널 | 네이티브 렌더 대상 | 참고 |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components 및 component containers | 기존 프로바이더 고유 페이로드 producer를 위해 레거시 `channelData.discord.components`는 유지하지만, 새로운 공유 전송은 `presentation`을 사용해야 합니다. |
| Slack           | Block Kit                           | 기존 프로바이더 고유 페이로드 producer를 위해 레거시 `channelData.slack.blocks`는 유지하지만, 새로운 공유 전송은 `presentation`을 사용해야 합니다. |
| Telegram        | 텍스트 + 인라인 키보드          | 버튼/선택 항목은 대상 표면에 인라인 버튼 기능이 필요하며, 그렇지 않으면 텍스트 폴백이 사용됩니다. |
| Mattermost      | 텍스트 + 대화형 props         | 다른 블록은 텍스트로 성능 저하 처리됩니다. |
| Microsoft Teams | Adaptive Cards                      | 둘 다 제공되면 일반 `message` 텍스트가 카드와 함께 포함됩니다. |
| Feishu          | 대화형 카드                   | 카드 헤더는 `title`을 사용할 수 있으며, 본문은 해당 제목을 중복하지 않습니다. |
| 일반 채널  | 텍스트 폴백                       | 렌더러가 없는 채널도 여전히 읽기 쉬운 출력을 받습니다. |

프로바이더 고유 페이로드 호환성은 기존
reply producer를 위한 전환 편의 기능입니다. 이것이 새로운 공유 네이티브 필드를 추가해야 하는 이유는 아닙니다.

## Presentation vs InteractiveReply

`InteractiveReply`는 승인 및 상호작용
헬퍼에서 사용되는 오래된 내부 부분집합입니다. 지원 항목:

- 텍스트
- 버튼
- 선택 항목

`MessagePresentation`은 정식 공유 전송 계약입니다. 여기에 다음이 추가됩니다.

- title
- tone
- context
- divider
- URL 전용 버튼
- `ReplyPayload.delivery`를 통한 일반 전달 메타데이터

오래된
코드를 연결할 때는 `openclaw/plugin-sdk/interactive-runtime`의 헬퍼를 사용하세요.

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

고정은 프레젠테이션이 아니라 전달 동작입니다. `channelData.telegram.pin` 같은
프로바이더 고유 필드 대신 `delivery.pin`을 사용하세요.

의미 체계:

- `pin: true`는 첫 번째로 성공적으로 전달된 메시지를 고정합니다.
- `pin.notify` 기본값은 `false`입니다.
- `pin.required` 기본값은 `false`입니다.
- 선택적 고정 실패는 성능 저하 처리되며 전송된 메시지는 그대로 유지됩니다.
- 필수 고정 실패는 전달을 실패시킵니다.
- 청크 분할된 메시지는 마지막 청크가 아니라 첫 번째 전달된 청크를 고정합니다.

수동 `pin`, `unpin`, `pins` 메시지 액션은 해당 작업을 지원하는 프로바이더에서 기존
메시지에 대해 여전히 존재합니다.

## Plugin 작성자 체크리스트

- 채널이
  의미적 프레젠테이션을 렌더링하거나 안전하게 성능 저하 처리할 수 있다면 `describeMessageTool(...)`에서 `presentation`을 선언하세요.
- 런타임 아웃바운드 어댑터에 `presentationCapabilities`를 추가하세요.
- `renderPresentation`은 control-plane Plugin
  설정 코드가 아니라 런타임 코드에 구현하세요.
- 네이티브 UI 라이브러리는 핫 setup/catalog 경로에 두지 마세요.
- 렌더러와 테스트에서 플랫폼 제한을 유지하세요.
- 지원되지 않는 버튼, 선택 항목, URL 버튼, title/text
  중복, 혼합 `message` + `presentation` 전송에 대한 폴백 테스트를 추가하세요.
- 프로바이더가 전송된 메시지 id를 고정할 수 있을 때만 `deliveryCapabilities.pin` 및
  `pinDeliveredMessage`를 통해 전달 고정 지원을 추가하세요.
- 공유 메시지 액션 스키마를 통해 새로운 프로바이더 고유 card/block/component/button 필드를 노출하지 마세요.

## 관련 문서

- [Message CLI](/cli/message)
- [Plugin SDK Overview](/ko/plugins/sdk-overview)
- [Plugin Architecture](/ko/plugins/architecture#message-tool-schemas)
- [Channel Presentation Refactor Plan](/ko/plan/ui-channels)
