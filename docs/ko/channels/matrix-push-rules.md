---
read_when:
    - 자체 호스팅 Synapse 또는 Tuwunel용 Matrix 조용한 스트리밍 설정 중입니다
    - 사용자는 모든 미리보기 편집이 아니라 완료된 블록에 대해서만 알림을 받기를 원합니다.
summary: 조용한 최종 미리보기 편집을 위한 수신자별 Matrix 푸시 규칙
title: 조용한 미리보기를 위한 Matrix 푸시 규칙
x-i18n:
    generated_at: "2026-04-24T06:04:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a8cf9a4041b63e13feb21ee2eb22909cb14931d6929bedf6b94315f7a270cf
    source_path: channels/matrix-push-rules.md
    workflow: 15
---

`channels.matrix.streaming`이 `"quiet"`이면 OpenClaw는 단일 미리보기 이벤트를 제자리에서 편집하고, 최종 편집에는 사용자 지정 콘텐츠 플래그를 표시합니다. Matrix 클라이언트는 사용자별 푸시 규칙이 그 플래그와 일치할 때만 최종 편집에 대해 알림을 보냅니다. 이 페이지는 Matrix를 자체 호스팅하며 각 수신자 계정에 해당 규칙을 설치하려는 운영자를 위한 것입니다.

기본 Matrix 알림 동작만 원한다면 `streaming: "partial"`을 사용하거나 스트리밍을 끄세요. [Matrix 채널 설정](/ko/channels/matrix#streaming-previews)을 참고하세요.

## 사전 요구 사항

- recipient user = 알림을 받아야 하는 사람
- bot user = 응답을 보내는 OpenClaw Matrix 계정
- 아래 API 호출에는 recipient user의 액세스 토큰을 사용하세요
- 푸시 규칙의 `sender`는 bot user의 전체 MXID와 일치해야 합니다
- recipient 계정에는 이미 정상적으로 동작하는 pusher가 있어야 합니다. 조용한 미리보기 규칙은 일반 Matrix 푸시 전달이 정상일 때만 동작합니다

## 단계

<Steps>
  <Step title="조용한 미리보기 구성">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="수신자의 액세스 토큰 가져오기">
    가능하면 기존 클라이언트 세션 토큰을 재사용하세요. 새 토큰을 발급하려면 다음을 사용합니다.

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="pusher 존재 확인">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

pusher가 하나도 반환되지 않으면 계속하기 전에 이 계정의 일반 Matrix 푸시 전달 문제를 먼저 해결하세요.

  </Step>

  <Step title="override 푸시 규칙 설치">
    OpenClaw는 최종 확정된 텍스트 전용 미리보기 편집에 `content["com.openclaw.finalized_preview"] = true`를 표시합니다. 이 마커와 발신자인 bot MXID를 함께 일치시키는 규칙을 설치하세요.

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    실행 전에 다음 값을 바꾸세요.

    - `https://matrix.example.org`: 사용자 homeserver 기본 URL
    - `$USER_ACCESS_TOKEN`: recipient user의 액세스 토큰
    - `openclaw-finalized-preview-botname`: 수신자별 봇마다 고유한 규칙 ID(형식: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: recipient가 아니라 OpenClaw bot MXID

  </Step>

  <Step title="검증">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

그런 다음 스트리밍 응답을 테스트하세요. quiet 모드에서는 방에 조용한 초안 미리보기가 표시되고, 블록 또는 턴이 완료되면 한 번만 알림이 전송됩니다.

  </Step>
</Steps>

나중에 규칙을 제거하려면 recipient의 토큰으로 동일한 규칙 URL에 `DELETE`를 호출하면 됩니다.

## 멀티봇 참고 사항

푸시 규칙은 `ruleId`를 기준으로 식별됩니다. 동일한 ID에 대해 `PUT`을 다시 실행하면 단일 규칙이 업데이트됩니다. 동일한 recipient에게 여러 OpenClaw bot이 알림을 보내는 경우, 발신자 일치 조건이 서로 다른 규칙을 bot마다 하나씩 만드세요.

새 사용자 정의 `override` 규칙은 기본 suppress 규칙보다 앞에 삽입되므로 추가 정렬 파라미터는 필요하지 않습니다. 이 규칙은 제자리에서 최종 확정될 수 있는 텍스트 전용 미리보기 편집에만 영향을 줍니다. 미디어 fallback 및 오래된 미리보기 fallback은 일반 Matrix 전달을 사용합니다.

## homeserver 참고 사항

<AccordionGroup>
  <Accordion title="Synapse">
    특별한 `homeserver.yaml` 변경은 필요하지 않습니다. 일반 Matrix 알림이 이미 이 사용자에게 정상적으로 도달한다면, recipient 토큰 + 위의 `pushrules` 호출이 주요 설정 단계입니다.

    Synapse를 리버스 프록시 또는 worker 뒤에서 실행하는 경우 `/_matrix/client/.../pushrules/`가 Synapse로 올바르게 전달되는지 확인하세요. 푸시 전달은 메인 프로세스 또는 `synapse.app.pusher` / 구성된 pusher worker가 처리하므로, 이들이 정상 상태인지 확인해야 합니다.

  </Accordion>

  <Accordion title="Tuwunel">
    Synapse와 동일한 흐름이며, 최종 미리보기 마커를 위해 Tuwunel 전용 구성은 필요하지 않습니다.

    사용자가 다른 디바이스에서 활성 상태일 때 알림이 사라진다면 `suppress_push_when_active`가 활성화되어 있는지 확인하세요. Tuwunel은 1.4.2(2025년 9월)에 이 옵션을 추가했으며, 한 디바이스가 활성 상태일 때 다른 디바이스로의 푸시를 의도적으로 억제할 수 있습니다.

  </Accordion>
</AccordionGroup>

## 관련

- [Matrix 채널 설정](/ko/channels/matrix)
- [스트리밍 개념](/ko/concepts/streaming)
