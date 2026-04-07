---
read_when:
    - OpenClaw에서 Matrix 설정하기
    - Matrix E2EE 및 검증 구성하기
summary: Matrix 지원 상태, 설정, 구성 예제
title: Matrix
x-i18n:
    generated_at: "2026-04-07T05:57:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: d53baa2ea5916cd00a99cae0ded3be41ffa13c9a69e8ea8461eb7baa6a99e13c
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix는 OpenClaw용 Matrix 번들 채널 plugin입니다.
공식 `matrix-js-sdk`를 사용하며 DM, room, thread, media, reaction, poll, 위치, E2EE를 지원합니다.

## 번들 plugin

Matrix는 현재 OpenClaw 릴리스에 번들 plugin으로 포함되어 있으므로, 일반적인
패키지 빌드에서는 별도 설치가 필요하지 않습니다.

이전 빌드나 Matrix가 제외된 커스텀 설치를 사용하는 경우, 수동으로
설치하세요:

npm에서 설치:

```bash
openclaw plugins install @openclaw/matrix
```

로컬 체크아웃에서 설치:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

plugin 동작 및 설치 규칙은 [Plugins](/ko/tools/plugin)를 참고하세요.

## 설정

1. Matrix plugin을 사용할 수 있는지 확인합니다.
   - 현재 패키지된 OpenClaw 릴리스에는 이미 포함되어 있습니다.
   - 이전/커스텀 설치는 위 명령으로 수동 추가할 수 있습니다.
2. 홈서버에서 Matrix 계정을 생성합니다.
3. 다음 중 하나로 `channels.matrix`를 구성합니다:
   - `homeserver` + `accessToken`, 또는
   - `homeserver` + `userId` + `password`.
4. gateway를 재시작합니다.
5. 봇과 DM을 시작하거나 room에 초대합니다.
   - 새 Matrix 초대는 `channels.matrix.autoJoin`이 허용할 때만 동작합니다.

대화형 설정 경로:

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix 마법사가 실제로 묻는 항목:

- homeserver URL
- 인증 방식: access token 또는 password
- password 인증을 선택한 경우에만 user ID
- 선택적 device 이름
- E2EE 활성화 여부
- 지금 Matrix room 접근을 구성할지 여부
- 지금 Matrix 초대 자동 참가를 구성할지 여부
- 초대 자동 참가를 활성화한 경우 `allowlist`, `always`, `off` 중 어떤 값을 사용할지

알아두어야 할 마법사 동작:

- 선택한 계정에 대해 Matrix 인증 env var가 이미 존재하고, 해당 계정의 인증 정보가 아직 config에 저장되어 있지 않다면, 마법사는 env 바로가기를 제안하여 secret을 config에 복사하지 않고 env vars에 유지한 채 설정할 수 있게 합니다.
- 다른 Matrix 계정을 대화형으로 추가할 때, 입력한 계정 이름은 config와 env vars에서 사용하는 account ID로 정규화됩니다. 예를 들어 `Ops Bot`은 `ops-bot`이 됩니다.
- DM allowlist 프롬프트는 전체 `@user:server` 값을 바로 받을 수 있습니다. 표시 이름은 실시간 디렉터리 조회에서 정확히 하나의 일치 항목을 찾을 때만 동작하며, 그렇지 않으면 마법사가 전체 Matrix ID로 다시 시도하라고 안내합니다.
- Room allowlist 프롬프트는 room ID와 alias를 직접 받을 수 있습니다. 참가 중인 room 이름도 실시간으로 확인할 수 있지만, 해석되지 않은 이름은 설정 중 입력한 그대로만 유지되며 나중에 런타임 allowlist 해석에서는 무시됩니다. `!room:server` 또는 `#alias:server` 사용을 권장합니다.
- 마법사는 이제 초대 자동 참가 단계 전에 명시적인 경고를 표시합니다. `channels.matrix.autoJoin`의 기본값이 `off`이기 때문입니다. 이 값을 설정하지 않으면 agent는 초대된 room이나 새 DM 스타일 초대에 참가하지 않습니다.
- 초대 자동 참가 allowlist 모드에서는 안정적인 초대 대상만 사용하세요: `!roomId:server`, `#alias:server`, 또는 `*`. 일반 room 이름은 거부됩니다.
- 런타임 room/session 식별성은 안정적인 Matrix room ID를 사용합니다. Room에 선언된 alias는 장기 session 키나 안정적인 그룹 식별성이 아니라 조회 입력값으로만 사용됩니다.
- 저장 전에 room 이름을 해석하려면 `openclaw channels resolve --channel matrix "Project Room"`를 사용하세요.

<Warning>
`channels.matrix.autoJoin`의 기본값은 `off`입니다.

설정하지 않은 상태로 두면 봇은 초대된 room이나 새 DM 스타일 초대에 참가하지 않으므로, 먼저 수동으로 참가시키지 않는 한 새 그룹이나 초대된 DM에 나타나지 않습니다.

수락할 초대를 제한하려면 `autoJoin: "allowlist"`와 `autoJoinAllowlist`를 함께 설정하거나, 모든 초대에 참가하게 하려면 `autoJoin: "always"`를 설정하세요.

`allowlist` 모드에서 `autoJoinAllowlist`는 `!roomId:server`, `#alias:server`, 또는 `*`만 허용합니다.
</Warning>

Allowlist 예제:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

모든 초대 참가:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

최소 token 기반 설정:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Password 기반 설정(login 후 token이 캐시됨):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix는 캐시된 자격 증명을 `~/.openclaw/credentials/matrix/`에 저장합니다.
기본 계정은 `credentials.json`을 사용하고, 이름이 있는 계정은 `credentials-<account>.json`을 사용합니다.
현재 인증 정보가 config에 직접 설정되어 있지 않더라도 여기에 캐시된 자격 증명이 있으면 OpenClaw는 설정, doctor, 채널 상태 탐지에서 Matrix가 구성된 것으로 간주합니다.

환경 변수 대응값(config 키가 설정되지 않았을 때 사용됨):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

기본이 아닌 계정의 경우 계정 범위 env vars를 사용하세요:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

계정 `ops`의 예:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

정규화된 account ID `ops-bot`의 경우 다음을 사용합니다:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix는 account ID의 구두점을 이스케이프하여 계정 범위 env vars 간 충돌이 없도록 합니다.
예를 들어 `-`는 `_X2D_`가 되므로 `ops-prod`는 `MATRIX_OPS_X2D_PROD_*`에 매핑됩니다.

대화형 마법사는 해당 인증 env vars가 이미 존재하고 선택한 계정에 대해 Matrix 인증이 아직 config에 저장되어 있지 않을 때만 env-var 바로가기를 제안합니다.

## 구성 예제

다음은 DM 페어링, room allowlist, E2EE 활성화를 포함한 실용적인 기준 config입니다:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

`autoJoin`은 room/group 초대뿐 아니라 일반적인 Matrix 초대 전체에 적용됩니다.
여기에는 새 DM 스타일 초대도 포함됩니다. 초대 시점에는 OpenClaw가
초대된 room이 최종적으로 DM으로 취급될지 그룹으로 취급될지 안정적으로 알 수 없으므로, 모든 초대는 먼저 같은
`autoJoin` 결정 과정을 거칩니다. 봇이 참가하고 room이
DM으로 분류된 뒤에는 `dm.policy`가 여전히 적용되므로, `autoJoin`은 참가 동작을 제어하고 `dm.policy`는 응답/접근
동작을 제어합니다.

## 스트리밍 미리보기

Matrix 응답 스트리밍은 옵트인입니다.

OpenClaw가 하나의 실시간 미리보기
응답을 보내고, 모델이 텍스트를 생성하는 동안 그 미리보기를 제자리에서 수정한 뒤,
응답이 완료되면 최종 확정하도록 하려면 `channels.matrix.streaming`을 `"partial"`로 설정하세요:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"`가 기본값입니다. OpenClaw는 최종 응답을 기다렸다가 한 번만 전송합니다.
- `streaming: "partial"`은 현재 assistant 블록에 대해 수정 가능한 미리보기 메시지 하나를 일반 Matrix 텍스트 메시지로 생성합니다. 이는 Matrix의 기존 미리보기 우선 알림 동작을 유지하므로, 기본 클라이언트는 완료된 블록 대신 첫 번째 스트리밍 미리보기 텍스트에 대해 알림을 보낼 수 있습니다.
- `streaming: "quiet"`은 현재 assistant 블록에 대해 수정 가능한 조용한 미리보기 notice 하나를 생성합니다. 완료된 미리보기 수정에 대한 수신자 push rule도 함께 구성하는 경우에만 이 옵션을 사용하세요.
- `blockStreaming: true`는 별도의 Matrix 진행 상태 메시지를 활성화합니다. 미리보기 스트리밍이 활성화된 경우 Matrix는 현재 블록의 실시간 초안을 유지하고 완료된 블록은 별도 메시지로 보존합니다.
- 미리보기 스트리밍이 켜져 있고 `blockStreaming`이 꺼져 있으면 Matrix는 실시간 초안을 제자리에서 수정하고 블록 또는 턴이 끝나면 같은 event를 최종 확정합니다.
- 미리보기가 더 이상 하나의 Matrix event에 들어가지 않으면 OpenClaw는 미리보기 스트리밍을 중단하고 일반 최종 전송으로 대체합니다.
- Media 응답은 여전히 일반적으로 첨부 파일을 전송합니다. 오래된 미리보기를 더 이상 안전하게 재사용할 수 없으면 OpenClaw는 최종 media 응답을 보내기 전에 해당 미리보기를 redaction 처리합니다.
- 미리보기 수정은 추가 Matrix API 호출 비용이 듭니다. 가장 보수적인 rate limit 동작이 필요하다면 streaming을 끄세요.

`blockStreaming`만으로는 초안 미리보기가 활성화되지 않습니다.
미리보기 수정을 사용하려면 `streaming: "partial"` 또는 `streaming: "quiet"`을 사용한 뒤, 완료된 assistant 블록도 별도 진행 상태 메시지로 남기고 싶을 때만 `blockStreaming: true`를 추가하세요.

커스텀 push rule 없이 기본 Matrix 알림을 사용해야 한다면, 미리보기 우선 동작을 위해 `streaming: "partial"`을 사용하거나 최종 전송만 하려면 `streaming`을 끄세요. `streaming: "off"`일 때:

- `blockStreaming: true`는 완료된 각 블록을 일반 알림 Matrix 메시지로 전송합니다.
- `blockStreaming: false`는 최종 완료 응답만 일반 알림 Matrix 메시지로 전송합니다.

### 조용한 완료 미리보기를 위한 셀프 호스팅 push rules

자체 Matrix 인프라를 운영하면서 조용한 미리보기가 블록이나
최종 응답이 완료되었을 때만 알림을 보내게 하려면, `streaming: "quiet"`을 설정하고 완료된 미리보기 수정에 대한 사용자별 push rule을 추가하세요.

이 설정은 대개 homeserver 전체 설정 변경이 아니라 수신 사용자 측 설정입니다:

시작 전 빠른 개념 정리:

- recipient user = 알림을 받아야 하는 사용자
- bot user = 응답을 보내는 OpenClaw Matrix 계정
- 아래 API 호출에는 recipient user의 access token을 사용하세요
- push rule의 `sender`는 bot user의 전체 MXID와 일치시켜야 합니다

1. OpenClaw가 조용한 미리보기를 사용하도록 구성합니다:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. recipient 계정이 이미 일반 Matrix push 알림을 받고 있는지 확인합니다. 조용한 미리보기
   rule은 해당 사용자에 대해 pusher/device가 이미 정상 작동 중일 때만 동작합니다.

3. recipient user의 access token을 가져옵니다.
   - 봇의 token이 아니라 수신 사용자의 token을 사용하세요.
   - 기존 클라이언트 세션 token을 재사용하는 것이 보통 가장 쉽습니다.
   - 새 token을 발급해야 한다면 표준 Matrix Client-Server API로 로그인할 수 있습니다:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. recipient 계정에 이미 pusher가 있는지 확인합니다:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

여기서 활성 pusher/device가 반환되지 않으면, 아래 OpenClaw
rule을 추가하기 전에 먼저 일반 Matrix 알림을 수정하세요.

OpenClaw는 완료된 텍스트 전용 미리보기 수정에 다음 표시를 추가합니다:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. 이런 알림을 받아야 하는 각 recipient 계정에 대해 override push rule을 만듭니다:

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

명령을 실행하기 전에 다음 값을 바꾸세요:

- `https://matrix.example.org`: 사용 중인 homeserver 기본 URL
- `$USER_ACCESS_TOKEN`: 수신 사용자의 access token
- `openclaw-finalized-preview-botname`: 이 수신 사용자에 대해 이 봇에만 고유한 rule ID
- `@bot:example.org`: 수신 사용자 MXID가 아니라 OpenClaw Matrix 봇 MXID

다중 봇 설정에서 중요:

- Push rule은 `ruleId`를 기준으로 식별됩니다. 같은 rule ID에 대해 `PUT`을 다시 실행하면 해당 rule 하나가 업데이트됩니다.
- 한 수신 사용자가 여러 OpenClaw Matrix 봇 계정에 대해 알림을 받아야 한다면, 각 sender 일치마다 고유한 rule ID를 가진 rule을 봇별로 하나씩 만드세요.
- 간단한 패턴은 `openclaw-finalized-preview-<botname>`이며, 예: `openclaw-finalized-preview-ops` 또는 `openclaw-finalized-preview-support`.

rule은 event sender를 기준으로 평가됩니다:

- 수신 사용자의 token으로 인증합니다
- `sender`를 OpenClaw 봇 MXID와 일치시킵니다

6. rule이 존재하는지 확인합니다:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. 스트리밍 응답을 테스트합니다. quiet 모드에서는 room에 조용한 초안 미리보기가 표시되고 최종
   제자리 수정이 블록 또는 턴 완료 시 한 번 알림을 보내야 합니다.

나중에 rule을 제거해야 한다면, 수신 사용자의 token으로 같은 rule ID를 삭제하세요:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

참고:

- rule 생성에는 봇의 access token이 아니라 수신 사용자의 access token을 사용하세요.
- 새 사용자 정의 `override` rule은 기본 suppress rule보다 앞에 삽입되므로 추가 정렬 파라미터가 필요하지 않습니다.
- 이는 OpenClaw가 제자리에서 안전하게 최종 확정할 수 있는 텍스트 전용 미리보기 수정에만 영향을 줍니다. Media 대체 전송과 오래된 미리보기 대체 전송은 여전히 일반 Matrix 전송을 사용합니다.
- `GET /_matrix/client/v3/pushers`에 pusher가 표시되지 않으면, 해당 사용자는 아직 이 계정/device에 대해 정상적인 Matrix push 전송이 작동하지 않는 상태입니다.

#### Synapse

Synapse의 경우 위 설정만으로 대체로 충분합니다:

- 완료된 OpenClaw 미리보기 알림을 위해 특별한 `homeserver.yaml` 변경은 필요하지 않습니다.
- Synapse 배포가 이미 일반 Matrix push 알림을 보내고 있다면, 사용자 token + 위의 `pushrules` 호출이 주요 설정 단계입니다.
- Synapse를 reverse proxy 또는 worker 뒤에서 운영한다면 `/_matrix/client/.../pushrules/`가 Synapse에 올바르게 전달되는지 확인하세요.
- Synapse worker를 사용 중이라면 pusher가 정상인지 확인하세요. Push 전송은 메인 프로세스 또는 `synapse.app.pusher` / 구성된 pusher worker가 처리합니다.

#### Tuwunel

Tuwunel에서는 위에 표시된 것과 같은 설정 흐름과 push-rule API 호출을 사용하세요:

- 완료된 미리보기 마커 자체를 위한 Tuwunel 전용 config는 필요하지 않습니다.
- 해당 사용자에 대해 일반 Matrix 알림이 이미 작동한다면, 사용자 token + 위의 `pushrules` 호출이 주요 설정 단계입니다.
- 사용자가 다른 device에서 활성 상태일 때 알림이 사라지는 것처럼 보인다면 `suppress_push_when_active`가 활성화되어 있는지 확인하세요. Tuwunel은 2025년 9월 12일 Tuwunel 1.4.2에서 이 옵션을 추가했으며, 한 device가 활성 상태일 때 다른 device로의 push를 의도적으로 억제할 수 있습니다.

## 암호화 및 검증

암호화된(E2EE) room에서는 outbound image event가 `thumbnail_file`을 사용하므로 전체 첨부 파일과 함께 이미지 미리보기도 암호화됩니다. 암호화되지 않은 room은 여전히 일반 `thumbnail_url`을 사용합니다. 별도 구성은 필요하지 않습니다 — plugin이 E2EE 상태를 자동으로 감지합니다.

### 봇 간 room

기본적으로, 다른 구성된 OpenClaw Matrix 계정에서 보낸 Matrix 메시지는 무시됩니다.

agent 간 Matrix 트래픽을 의도적으로 허용하려면 `allowBots`를 사용하세요:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true`는 허용된 room 및 DM에서 다른 구성된 Matrix 봇 계정의 메시지를 수락합니다.
- `allowBots: "mentions"`는 room에서 이 봇을 눈에 띄게 멘션한 경우에만 해당 메시지를 수락합니다. DM은 여전히 허용됩니다.
- `groups.<room>.allowBots`는 한 room에 대해 account 수준 설정을 재정의합니다.
- OpenClaw는 자기 자신에게 응답이 반복되는 루프를 피하기 위해 같은 Matrix user ID의 메시지는 계속 무시합니다.
- Matrix는 여기서 기본적인 bot 플래그를 제공하지 않으므로, OpenClaw는 "bot-authored"를 "이 OpenClaw gateway에서 구성된 다른 Matrix 계정이 보낸 메시지"로 간주합니다.

공유 room에서 봇 간 트래픽을 활성화할 때는 엄격한 room allowlist와 멘션 요구 조건을 사용하세요.

암호화 활성화:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

검증 상태 확인:

```bash
openclaw matrix verify status
```

상세 상태(전체 진단):

```bash
openclaw matrix verify status --verbose
```

저장된 복구 키를 기계 판독 가능한 출력에 포함:

```bash
openclaw matrix verify status --include-recovery-key --json
```

교차 서명 및 검증 상태 bootstrap:

```bash
openclaw matrix verify bootstrap
```

다중 계정 지원: 계정별 자격 증명과 선택적 `name`을 위해 `channels.matrix.accounts`를 사용하세요. 공통 패턴은 [Configuration reference](/ko/gateway/configuration-reference#multi-account-all-channels)를 참고하세요.

상세 bootstrap 진단:

```bash
openclaw matrix verify bootstrap --verbose
```

bootstrap 전에 새 교차 서명 식별성 재설정을 강제:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

복구 키로 이 device 검증:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

상세 device 검증 정보:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Room-key backup 상태 확인:

```bash
openclaw matrix verify backup status
```

상세 backup 상태 진단:

```bash
openclaw matrix verify backup status --verbose
```

서버 backup에서 room key 복원:

```bash
openclaw matrix verify backup restore
```

상세 복원 진단:

```bash
openclaw matrix verify backup restore --verbose
```

현재 서버 backup을 삭제하고 새 backup 기준선을 생성합니다. 저장된
backup 키를 정상적으로 로드할 수 없다면, 이 재설정은 비밀 저장소도 다시 생성하여
향후 콜드 스타트에서 새 backup 키를 로드할 수 있게 할 수 있습니다:

```bash
openclaw matrix verify backup reset --yes
```

모든 `verify` 명령은 기본적으로 간결하며(조용한 내부 SDK 로깅 포함), 자세한 진단은 `--verbose`에서만 표시됩니다.
스크립팅 시 전체 기계 판독 가능 출력이 필요하면 `--json`을 사용하세요.

다중 계정 설정에서 Matrix CLI 명령은 `--account <id>`를 전달하지 않으면 암시적 Matrix 기본 계정을 사용합니다.
여러 이름 있는 계정을 구성했다면 먼저 `channels.matrix.defaultAccount`를 설정하세요. 그렇지 않으면 이러한 암시적 CLI 작업은 중단되고 명시적으로 계정을 선택하라고 요청합니다.
검증 또는 device 작업을 명시적으로 이름 있는 계정에 대상으로 삼고 싶다면 언제든 `--account`를 사용하세요:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

이름 있는 계정에 대해 암호화가 비활성화되어 있거나 사용할 수 없는 경우, Matrix 경고와 검증 오류는 해당 계정의 config 키를 가리킵니다. 예: `channels.matrix.accounts.assistant.encryption`.

### "검증됨"의 의미

OpenClaw는 이 Matrix device가 사용자의 교차 서명 식별성에 의해 검증된 경우에만 검증된 것으로 취급합니다.
실제로 `openclaw matrix verify status --verbose`는 세 가지 신뢰 신호를 표시합니다:

- `Locally trusted`: 현재 클라이언트에서만 이 device를 신뢰함
- `Cross-signing verified`: SDK가 이 device를 교차 서명을 통해 검증된 것으로 보고함
- `Signed by owner`: 이 device가 사용자 자신의 self-signing key로 서명됨

`Verified by owner`는 교차 서명 검증 또는 owner 서명이 존재할 때만 `yes`가 됩니다.
로컬 신뢰만으로는 OpenClaw가 이 device를 완전히 검증된 것으로 취급하기에 충분하지 않습니다.

### bootstrap이 하는 일

`openclaw matrix verify bootstrap`은 암호화된 Matrix 계정을 위한 복구 및 설정 명령입니다.
이 명령은 다음을 순서대로 수행합니다:

- 가능하면 기존 복구 키를 재사용하면서 secret storage를 bootstrap
- 교차 서명을 bootstrap하고 누락된 공개 교차 서명 키 업로드
- 현재 device를 표시하고 교차 서명하려고 시도
- 서버 측 room-key backup이 아직 없으면 새로 생성

홈서버가 교차 서명 키 업로드에 대화형 인증을 요구하면, OpenClaw는 먼저 인증 없이 업로드를 시도하고, 그다음 `m.login.dummy`, 마지막으로 `channels.matrix.password`가 구성된 경우 `m.login.password`로 시도합니다.

현재 교차 서명 식별성을 버리고 새로 만들려는 의도가 있을 때만 `--force-reset-cross-signing`을 사용하세요.

현재 room-key backup을 의도적으로 버리고 향후 메시지를 위한 새
backup 기준선을 시작하려면 `openclaw matrix verify backup reset --yes`를 사용하세요.
복구할 수 없는 오래된 암호화 기록은 계속 사용할 수 없게 되고,
현재 backup secret을 안전하게 로드할 수 없으면 OpenClaw가 secret storage를 다시 만들 수 있다는 점을 받아들일 때만 이 작업을 수행하세요.

### 새 backup 기준선

향후 암호화된 메시지는 계속 정상 작동하게 유지하면서 복구할 수 없는 오래된 기록 손실을 받아들일 수 있다면, 다음 명령을 순서대로 실행하세요:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

이름 있는 Matrix 계정을 명시적으로 대상으로 하려면 각 명령에 `--account <id>`를 추가하세요.

### 시작 시 동작

`encryption: true`일 때 Matrix는 `startupVerification` 기본값을 `"if-unverified"`로 둡니다.
시작 시 이 device가 아직 검증되지 않았다면 Matrix는 다른 Matrix 클라이언트에서 self-verification을 요청하고,
이미 하나가 대기 중이면 중복 요청을 건너뛰며, 재시작 후 재시도 전에 로컬 cooldown을 적용합니다.
기본적으로 요청 생성에 성공한 경우보다 요청 시도가 실패한 경우 더 빨리 재시도합니다.
자동 시작 요청을 비활성화하려면 `startupVerification: "off"`를 설정하거나, 재시도 간격을 더 짧거나 길게 하려면 `startupVerificationCooldownHours`
를 조정하세요.

시작 시에는 자동으로 보수적인 crypto bootstrap 단계도 수행됩니다.
이 단계는 먼저 현재 secret storage와 교차 서명 식별성을 재사용하려고 하며, 명시적인 bootstrap 복구 흐름을 실행하지 않는 한 교차 서명을 재설정하지 않도록 합니다.

시작 과정에서 손상된 bootstrap 상태가 발견되고 `channels.matrix.password`가 구성되어 있다면, OpenClaw는 더 엄격한 복구 경로를 시도할 수 있습니다.
현재 device가 이미 owner-signed 상태라면 OpenClaw는 이를 자동으로 재설정하지 않고 해당 식별성을 유지합니다.

이전 공개 Matrix plugin에서 업그레이드할 때:

- 가능하면 OpenClaw는 동일한 Matrix 계정, access token, device 식별성을 자동으로 재사용합니다.
- 실행 가능한 Matrix 마이그레이션 변경이 적용되기 전에 OpenClaw는 `~/Backups/openclaw-migrations/` 아래에 복구 스냅샷을 생성하거나 재사용합니다.
- 여러 Matrix 계정을 사용하는 경우, 이전 flat-store 레이아웃에서 업그레이드하기 전에 `channels.matrix.defaultAccount`를 설정하세요. 그래야 OpenClaw가 이 공유된 레거시 상태를 어느 계정에 할당할지 알 수 있습니다.
- 이전 plugin이 Matrix room-key backup 복호화 키를 로컬에 저장했다면, 시작 시 또는 `openclaw doctor --fix`가 이를 새 복구 키 흐름으로 자동 가져옵니다.
- 마이그레이션 준비 후 Matrix access token이 변경되었다면, 이제 시작 과정에서 자동 backup 복원을 포기하기 전에 대기 중인 레거시 복원 상태가 있는 형제 token-hash 저장소 루트를 검사합니다.
- 이후에도 같은 계정, homeserver, user에 대해 Matrix access token이 변경되면, OpenClaw는 이제 빈 Matrix 상태 디렉터리에서 시작하는 대신 가장 완전한 기존 token-hash 저장소 루트를 우선 재사용합니다.
- 다음 gateway 시작 시, backup된 room key가 새 crypto store로 자동 복원됩니다.
- 이전 plugin에 backup되지 않은 로컬 전용 room key가 있었다면 OpenClaw는 이를 명확하게 경고합니다. 이러한 키는 이전 rust crypto store에서 자동으로 내보낼 수 없으므로, 수동 복구 전까지 일부 오래된 암호화 기록은 계속 사용할 수 없을 수 있습니다.
- 전체 업그레이드 흐름, 제한 사항, 복구 명령, 일반적인 마이그레이션 메시지는 [Matrix migration](/ko/install/migrating-matrix)을 참고하세요.

암호화된 런타임 상태는 계정별, 사용자별 token-hash 루트 아래
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`에 구성됩니다.
이 디렉터리에는 sync store(`bot-storage.json`), crypto store(`crypto/`),
복구 키 파일(`recovery-key.json`), IndexedDB 스냅샷(`crypto-idb-snapshot.json`),
thread binding(`thread-bindings.json`), 시작 검증 상태(`startup-verification.json`)
가 해당 기능 사용 시 포함됩니다.
token이 변경되더라도 계정 식별성이 동일하면 OpenClaw는 해당 account/homeserver/user 튜플에 대해 가장 적절한 기존
루트를 재사용하므로 이전 sync 상태, crypto 상태, thread binding,
시작 검증 상태가 계속 유지됩니다.

### Node crypto store 모델

이 plugin의 Matrix E2EE는 Node에서 공식 `matrix-js-sdk` Rust crypto 경로를 사용합니다.
이 경로는 crypto 상태를 재시작 간 유지하려면 IndexedDB 기반 지속성을 필요로 합니다.

OpenClaw는 현재 Node에서 이를 다음 방식으로 제공합니다:

- SDK가 기대하는 IndexedDB API shim으로 `fake-indexeddb` 사용
- `initRustCrypto` 전에 `crypto-idb-snapshot.json`에서 Rust crypto IndexedDB 내용 복원
- init 후와 런타임 중에 업데이트된 IndexedDB 내용을 다시 `crypto-idb-snapshot.json`에 저장
- gateway 런타임 지속성과 CLI 유지보수가 같은 스냅샷 파일에서 충돌하지 않도록 advisory file lock으로 `crypto-idb-snapshot.json`에 대한 스냅샷 복원/저장을 직렬화

이것은 커스텀 crypto 구현이 아니라 호환성/저장소 처리 계층입니다.
스냅샷 파일은 민감한 런타임 상태이며 제한적인 파일 권한으로 저장됩니다.
OpenClaw의 보안 모델에서는 gateway 호스트와 로컬 OpenClaw 상태 디렉터리가 이미 신뢰된 운영자 경계 안에 있으므로, 이는 별도의 원격 신뢰 경계라기보다 주로 운영상 내구성 문제입니다.

계획된 개선 사항:

- recovery key 및 관련 store 암호화 secret을 로컬 파일뿐 아니라 OpenClaw secrets provider에서도 가져올 수 있도록 영구 Matrix 키 자료에 대한 SecretRef 지원 추가

## 프로필 관리

선택한 계정의 Matrix self-profile을 다음 명령으로 업데이트합니다:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

이름 있는 Matrix 계정을 명시적으로 대상으로 하려면 `--account <id>`를 추가하세요.

Matrix는 `mxc://` avatar URL을 직접 받을 수 있습니다. `http://` 또는 `https://` avatar URL을 전달하면 OpenClaw가 먼저 이를 Matrix에 업로드하고, 해석된 `mxc://` URL을 `channels.matrix.avatarUrl`(또는 선택한 account override)로 다시 저장합니다.

## 자동 검증 notice

이제 Matrix는 검증 수명 주기 notice를 strict DM 검증 room에 `m.notice` 메시지로 직접 게시합니다.
여기에는 다음이 포함됩니다:

- 검증 요청 notice
- 검증 준비 완료 notice(명시적인 "Verify by emoji" 안내 포함)
- 검증 시작 및 완료 notice
- 사용 가능할 때 SAS 세부 정보(emoji 및 decimal)

다른 Matrix 클라이언트에서 들어오는 검증 요청은 추적되며 OpenClaw가 자동 수락합니다.
self-verification 흐름의 경우 OpenClaw는 emoji 검증을 사용할 수 있게 되면 SAS 흐름도 자동으로 시작하고 자신의 측 확인도 완료합니다.
다른 Matrix 사용자/device의 검증 요청에 대해서는 OpenClaw가 요청을 자동 수락한 뒤 SAS 흐름이 정상적으로 진행되기를 기다립니다.
검증을 완료하려면 여전히 Matrix 클라이언트에서 emoji 또는 decimal SAS를 비교하고 "They match"를 확인해야 합니다.

OpenClaw는 self-initiated 중복 흐름을 무조건 자동 수락하지 않습니다. 시작 시 self-verification 요청이 이미 대기 중이면 새 요청을 만들지 않습니다.

검증 프로토콜/시스템 notice는 agent 채팅 파이프라인으로 전달되지 않으므로 `NO_REPLY`를 생성하지 않습니다.

### Device 위생 관리

오래된 OpenClaw 관리 Matrix device가 계정에 누적되면 암호화된 room의 신뢰를 파악하기 어려워질 수 있습니다.
다음 명령으로 목록을 확인하세요:

```bash
openclaw matrix devices list
```

오래된 OpenClaw 관리 device 제거:

```bash
openclaw matrix devices prune-stale
```

### Direct Room 복구

직접 메시지 상태가 동기화되지 않으면 OpenClaw가 오래된 solo room을 가리키는 stale `m.direct` 매핑을 갖게 되어 실제 DM 대신 그쪽을 참조할 수 있습니다. 특정 상대에 대한 현재 매핑은 다음 명령으로 확인하세요:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

다음 명령으로 복구합니다:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

복구는 Matrix 전용 로직을 plugin 내부에 유지합니다:

- 우선 `m.direct`에 이미 매핑된 엄격한 1:1 DM을 사용합니다
- 그렇지 않으면 해당 사용자와 현재 참가 중인 엄격한 1:1 DM으로 대체합니다
- 정상적인 DM이 없으면 새 direct room을 만들고 `m.direct`를 그 room으로 다시 기록합니다

복구 흐름은 오래된 room을 자동으로 삭제하지 않습니다. 정상적인 DM을 선택하고 매핑만 업데이트하여 새 Matrix 전송, 검증 notice, 기타 direct-message 흐름이 다시 올바른 room을 대상으로 하도록 합니다.

## Threads

Matrix는 자동 응답과 message-tool 전송 모두에 대해 네이티브 Matrix thread를 지원합니다.

- `dm.sessionScope: "per-user"`(기본값)는 Matrix DM 라우팅을 발신자 범위로 유지하므로, 여러 DM room이 같은 상대를 가리키면 하나의 session을 공유할 수 있습니다.
- `dm.sessionScope: "per-room"`은 일반 DM 인증 및 allowlist 검사 방식을 유지하면서 각 Matrix DM room을 자체 session 키로 분리합니다.
- 명시적인 Matrix 대화 binding은 여전히 `dm.sessionScope`보다 우선하므로, binding된 room과 thread는 선택된 대상 session을 유지합니다.
- `threadReplies: "off"`는 응답을 최상위에 유지하고, 들어오는 thread 메시지는 부모 session에서 처리합니다.
- `threadReplies: "inbound"`는 들어온 메시지가 이미 해당 thread에 있을 때만 thread 안에서 응답합니다.
- `threadReplies: "always"`는 room 응답을 트리거 메시지를 루트로 하는 thread에 유지하고, 첫 트리거 메시지부터 해당 대화를 일치하는 thread 범위 session을 통해 라우팅합니다.
- `dm.threadReplies`는 DM에 대해서만 최상위 설정을 재정의합니다. 예를 들어 room thread는 분리하면서 DM은 평면적으로 유지할 수 있습니다.
- 들어오는 thread 메시지는 thread 루트 메시지를 추가 agent 컨텍스트로 포함합니다.
- 이제 message-tool 전송은 명시적인 `threadId`가 제공되지 않는 한, 대상이 같은 room이거나 같은 DM user 대상이면 현재 Matrix thread를 자동 상속합니다.
- 같은 session DM user 대상 재사용은 현재 session 메타데이터가 같은 Matrix 계정의 동일한 DM 상대를 입증할 때만 동작합니다. 그렇지 않으면 OpenClaw는 일반 user 범위 라우팅으로 대체합니다.
- OpenClaw가 같은 공유 Matrix DM session에서 하나의 Matrix DM room이 다른 DM room과 충돌하는 것을 감지하면, thread binding이 활성화되어 있고 `dm.sessionScope` 힌트가 있을 때 해당 room에 `/focus` 탈출 경로를 설명하는 일회성 `m.notice`를 게시합니다.
- Matrix는 런타임 thread binding을 지원합니다. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, 그리고 thread-bound `/acp spawn`이 이제 Matrix room과 DM에서 동작합니다.
- 최상위 Matrix room/DM의 `/focus`는 `threadBindings.spawnSubagentSessions=true`일 때 새 Matrix thread를 만들고 대상 session에 binding합니다.
- 기존 Matrix thread 내부에서 `/focus` 또는 `/acp spawn --thread here`를 실행하면 현재 thread를 그대로 binding합니다.

## ACP 대화 binding

Matrix room, DM, 기존 Matrix thread를 채팅 표면을 바꾸지 않고도 지속적인 ACP workspace로 전환할 수 있습니다.

빠른 운영자 흐름:

- 계속 사용하려는 Matrix DM, room, 기존 thread 안에서 `/acp spawn codex --bind here`를 실행합니다.
- 최상위 Matrix DM 또는 room에서는 현재 DM/room이 그대로 채팅 표면으로 유지되고 이후 메시지는 생성된 ACP session으로 라우팅됩니다.
- 기존 Matrix thread 안에서는 `--bind here`가 현재 thread를 그 자리에서 binding합니다.
- `/new`와 `/reset`은 같은 binding된 ACP session을 그 자리에서 재설정합니다.
- `/acp close`는 ACP session을 닫고 binding을 제거합니다.

참고:

- `--bind here`는 하위 Matrix thread를 생성하지 않습니다.
- `threadBindings.spawnAcpSessions`는 OpenClaw가 하위 Matrix thread를 생성하거나 binding해야 하는 `/acp spawn --thread auto|here`에서만 필요합니다.

### Thread Binding 구성

Matrix는 `session.threadBindings`에서 전역 기본값을 상속하며, 채널별 override도 지원합니다:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix thread-bound spawn 플래그는 옵트인입니다:

- 최상위 `/focus`가 새 Matrix thread를 생성하고 binding할 수 있도록 하려면 `threadBindings.spawnSubagentSessions: true`를 설정하세요.
- `/acp spawn --thread auto|here`가 ACP session을 Matrix thread에 binding할 수 있도록 하려면 `threadBindings.spawnAcpSessions: true`를 설정하세요.

## Reactions

Matrix는 outbound reaction 작업, inbound reaction 알림, inbound ack reaction을 지원합니다.

- Outbound reaction tooling은 `channels["matrix"].actions.reactions`로 제어됩니다.
- `react`는 특정 Matrix event에 reaction을 추가합니다.
- `reactions`는 특정 Matrix event의 현재 reaction 요약을 나열합니다.
- `emoji=""`는 해당 event에 대한 봇 계정 자신의 reaction을 제거합니다.
- `remove: true`는 봇 계정의 지정된 emoji reaction만 제거합니다.

Ack reaction은 표준 OpenClaw 해석 순서를 사용합니다:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- agent identity emoji fallback

Ack reaction 범위는 다음 순서로 해석됩니다:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Reaction notification 모드는 다음 순서로 해석됩니다:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- 기본값: `own`

현재 동작:

- `reactionNotifications: "own"`은 봇이 작성한 Matrix 메시지를 대상으로 하는 추가된 `m.reaction` event를 전달합니다.
- `reactionNotifications: "off"`는 reaction 시스템 event를 비활성화합니다.
- Reaction 제거는 Matrix가 이를 독립적인 `m.reaction` 제거가 아니라 redaction으로 노출하므로 아직 시스템 event로 합성되지 않습니다.

## 히스토리 컨텍스트

- `channels.matrix.historyLimit`는 Matrix room 메시지가 agent를 트리거할 때 `InboundHistory`에 포함할 최근 room 메시지 수를 제어합니다.
- 이 값은 `messages.groupChat.historyLimit`로 fallback됩니다. 둘 다 설정되지 않으면 유효 기본값은 `0`이므로, 멘션 게이트가 있는 room 메시지는 버퍼링되지 않습니다. 비활성화하려면 `0`으로 설정하세요.
- Matrix room 히스토리는 room 전용입니다. DM은 일반 session 히스토리를 계속 사용합니다.
- Matrix room 히스토리는 pending 전용입니다. OpenClaw는 아직 응답을 트리거하지 않은 room 메시지를 버퍼링한 뒤, 멘션 또는 다른 트리거가 도착하면 그 창을 스냅샷으로 만듭니다.
- 현재 트리거 메시지는 `InboundHistory`에 포함되지 않습니다. 해당 턴의 메인 inbound body에 그대로 남습니다.
- 같은 Matrix event를 재시도할 때는 더 새로운 room 메시지로 드리프트하지 않고 원래 히스토리 스냅샷을 재사용합니다.

## 컨텍스트 가시성

Matrix는 가져온 응답 텍스트, thread 루트, pending 히스토리 같은 보조 room 컨텍스트에 대해 공통 `contextVisibility` 제어를 지원합니다.

- `contextVisibility: "all"`이 기본값입니다. 보조 컨텍스트는 수신한 그대로 유지됩니다.
- `contextVisibility: "allowlist"`는 활성 room/user allowlist 검사에서 허용된 발신자로 보조 컨텍스트를 필터링합니다.
- `contextVisibility: "allowlist_quote"`는 `allowlist`처럼 동작하지만, 명시적으로 인용된 응답 하나는 계속 유지합니다.

이 설정은 보조 컨텍스트의 가시성에 영향을 주며, inbound 메시지 자체가 응답을 트리거할 수 있는지 여부에는 영향을 주지 않습니다.
트리거 권한은 여전히 `groupPolicy`, `groups`, `groupAllowFrom`, DM policy 설정에서 결정됩니다.

## DM 및 room 정책 예제

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

멘션 게이팅과 allowlist 동작은 [Groups](/ko/channels/groups)를 참고하세요.

Matrix DM 페어링 예제:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

승인되지 않은 Matrix 사용자가 승인 전에 계속 메시지를 보내면, OpenClaw는 새 코드를 발급하지 않고 같은 보류 중 pairing 코드를 재사용하며 짧은 cooldown 후 다시 reminder 응답을 보낼 수 있습니다.

공통 DM pairing 흐름과 저장소 레이아웃은 [Pairing](/ko/channels/pairing)을 참고하세요.

## Exec 승인

Matrix는 Matrix 계정의 exec 승인 클라이언트로 동작할 수 있습니다.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (선택 사항; `channels.matrix.dm.allowFrom`으로 fallback)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, 기본값: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

승인자는 `@owner:example.org` 같은 Matrix user ID여야 합니다. `enabled`가 설정되지 않았거나 `"auto"`이고, `execApprovals.approvers` 또는 `channels.matrix.dm.allowFrom`에서 최소 한 명의 승인자를 해석할 수 있으면 Matrix는 네이티브 exec 승인을 자동 활성화합니다. Matrix를 네이티브 승인 클라이언트로 명시적으로 비활성화하려면 `enabled: false`를 설정하세요. 그렇지 않으면 승인 요청은 다른 구성된 승인 경로 또는 exec 승인 fallback 정책으로 대체됩니다.

현재 Matrix 네이티브 라우팅은 exec 전용입니다:

- `channels.matrix.execApprovals.*`는 exec 승인에 대해서만 네이티브 DM/channel 라우팅을 제어합니다.
- Plugin 승인은 여전히 공통 same-chat `/approve` 및 구성된 `approvals.plugin` 전달을 사용합니다.
- Matrix는 plugin 승인 권한 추론이 안전할 때 `channels.matrix.dm.allowFrom`를 plugin 승인 인가에도 재사용할 수 있지만, 별도의 네이티브 plugin 승인 DM/channel fanout 경로를 제공하지는 않습니다.

전달 규칙:

- `target: "dm"`은 승인 프롬프트를 승인자 DM으로 보냅니다
- `target: "channel"`은 프롬프트를 원래 Matrix room 또는 DM으로 다시 보냅니다
- `target: "both"`는 승인자 DM과 원래 Matrix room 또는 DM 모두로 보냅니다

Matrix 승인 프롬프트는 기본 승인 메시지에 reaction 바로가기를 추가합니다:

- `✅` = 한 번 허용
- `❌` = 거부
- `♾️` = 유효한 exec policy에서 허용되는 경우 항상 허용

승인자는 해당 메시지에 reaction을 달거나 fallback slash 명령 `/approve <id> allow-once`, `/approve <id> allow-always`, 또는 `/approve <id> deny`를 사용할 수 있습니다.

해석된 승인자만 승인 또는 거부할 수 있습니다. Channel 전달에는 명령 텍스트가 포함되므로 `channel` 또는 `both`는 신뢰할 수 있는 room에서만 활성화하세요.

Matrix 승인 프롬프트는 공통 core 승인 planner를 재사용합니다. Matrix 전용 네이티브 표면은 exec 승인에 대한 전송 계층, 즉 room/DM 라우팅과 message send/update/delete 동작만 담당합니다.

계정별 override:

- `channels.matrix.accounts.<account>.execApprovals`

관련 문서: [Exec approvals](/ko/tools/exec-approvals)

## 다중 계정 예제

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

최상위 `channels.matrix` 값은 계정이 자체적으로 재정의하지 않는 한 이름 있는 계정의 기본값으로 동작합니다.
`groups.<room>.account`(또는 레거시 `rooms.<room>.account`)로 상속된 room 항목을 특정 Matrix 계정 하나로 제한할 수 있습니다.
`account`가 없는 항목은 모든 Matrix 계정에 공유되며, 기본 계정이 최상위 `channels.matrix.*`에 직접 구성된 경우 `account: "default"`도 계속 동작합니다.
부분적인 공유 인증 기본값만으로는 별도의 암시적 기본 계정이 생성되지 않습니다. OpenClaw는 해당 기본값에 새 인증(`homeserver` + `accessToken`, 또는 `homeserver` + `userId` 및 `password`)이 있을 때만 최상위 `default` 계정을 합성합니다. 이름 있는 계정은 나중에 캐시된 자격 증명이 인증을 충족하면 `homeserver` + `userId`만으로도 계속 탐지될 수 있습니다.
Matrix에 이미 이름 있는 계정이 정확히 하나만 있거나 `defaultAccount`가 기존 이름 있는 계정 키를 가리키는 경우, 단일 계정에서 다중 계정으로의 복구/설정 승격은 새 `accounts.default` 항목을 만드는 대신 해당 계정을 보존합니다. Matrix 인증/bootstrap 키만 그 승격된 계정으로 이동하며, 공유 전송 정책 키는 최상위에 그대로 유지됩니다.
암시적 라우팅, 프로빙, CLI 작업에서 OpenClaw가 하나의 이름 있는 Matrix 계정을 우선 사용하게 하려면 `defaultAccount`를 설정하세요.
여러 이름 있는 계정을 구성한 경우, 암시적 계정 선택에 의존하는 CLI 명령에는 `defaultAccount`를 설정하거나 `--account <id>`를 전달하세요.
하나의 명령에 대해 그 암시적 선택을 재정의하려면 `openclaw matrix verify ...` 및 `openclaw matrix devices ...`에 `--account <id>`를 전달하세요.

## 비공개/LAN homeserver

기본적으로 OpenClaw는 SSRF 보호를 위해 비공개/내부 Matrix homeserver를 차단하며,
계정별로 명시적으로 옵트인한 경우에만 허용합니다.

homeserver가 localhost, LAN/Tailscale IP, 또는 내부 호스트 이름에서 실행 중이라면,
해당 Matrix 계정에 대해 `network.dangerouslyAllowPrivateNetwork`를 활성화하세요:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

CLI 설정 예제:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

이 옵트인은 신뢰된 비공개/내부 대상만 허용합니다. 다음과 같은 공개 평문 homeserver는
`http://matrix.example.org:8008` 계속 차단됩니다. 가능하면 `https://` 사용을 권장합니다.

## Matrix 트래픽 프록시

Matrix 배포에 명시적인 outbound HTTP(S) 프록시가 필요하다면 `channels.matrix.proxy`를 설정하세요:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

이름 있는 계정은 `channels.matrix.accounts.<id>.proxy`로 최상위 기본값을 재정의할 수 있습니다.
OpenClaw는 런타임 Matrix 트래픽과 계정 상태 프로브 모두에 같은 프록시 설정을 사용합니다.

## 대상 해석

OpenClaw가 room 또는 user 대상을 요청하는 모든 위치에서 Matrix는 다음 대상 형식을 허용합니다:

- 사용자: `@user:server`, `user:@user:server`, 또는 `matrix:user:@user:server`
- Room: `!room:server`, `room:!room:server`, 또는 `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, 또는 `matrix:channel:#alias:server`

실시간 디렉터리 조회는 로그인된 Matrix 계정을 사용합니다:

- 사용자 조회는 해당 homeserver의 Matrix 사용자 디렉터리를 조회합니다.
- Room 조회는 명시적인 room ID와 alias를 직접 허용하고, 그다음 해당 계정의 참가 중인 room 이름 검색으로 fallback합니다.
- 참가 중인 room 이름 조회는 최선의 노력 방식입니다. room 이름을 ID 또는 alias로 해석할 수 없으면 런타임 allowlist 해석에서 무시됩니다.

## 구성 참조

- `enabled`: 채널 활성화 또는 비활성화.
- `name`: 계정의 선택적 label.
- `defaultAccount`: 여러 Matrix 계정이 구성된 경우 선호되는 account ID.
- `homeserver`: homeserver URL, 예: `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: 이 Matrix 계정이 비공개/내부 homeserver에 연결되도록 허용합니다. homeserver가 `localhost`, LAN/Tailscale IP, 또는 `matrix-synapse` 같은 내부 호스트로 해석될 때 활성화하세요.
- `proxy`: Matrix 트래픽용 선택적 HTTP(S) 프록시 URL. 이름 있는 계정은 자체 `proxy`로 최상위 기본값을 재정의할 수 있습니다.
- `userId`: 전체 Matrix user ID, 예: `@bot:example.org`.
- `accessToken`: token 기반 인증용 access token. `channels.matrix.accessToken` 및 `channels.matrix.accounts.<id>.accessToken`에는 env/file/exec provider 전반에서 일반 텍스트 값과 SecretRef 값을 모두 지원합니다. [Secrets Management](/ko/gateway/secrets)를 참고하세요.
- `password`: password 기반 login용 password. 일반 텍스트 값과 SecretRef 값을 지원합니다.
- `deviceId`: 명시적인 Matrix device ID.
- `deviceName`: password login용 device 표시 이름.
- `avatarUrl`: 프로필 동기화 및 `set-profile` 업데이트용으로 저장되는 self-avatar URL.
- `initialSyncLimit`: 시작 시 sync event 제한.
- `encryption`: E2EE 활성화.
- `allowlistOnly`: DM과 room에 대해 allowlist 전용 동작을 강제.
- `allowBots`: 다른 구성된 OpenClaw Matrix 계정의 메시지를 허용 (`true` 또는 `"mentions"`).
- `groupPolicy`: `open`, `allowlist`, 또는 `disabled`.
- `contextVisibility`: 보조 room 컨텍스트 가시성 모드 (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: room 트래픽용 user ID allowlist.
- `groupAllowFrom` 항목은 전체 Matrix user ID여야 합니다. 해석되지 않은 이름은 런타임에 무시됩니다.
- `historyLimit`: 그룹 히스토리 컨텍스트로 포함할 최대 room 메시지 수. `messages.groupChat.historyLimit`로 fallback되며, 둘 다 설정되지 않으면 유효 기본값은 `0`입니다. 비활성화하려면 `0`으로 설정하세요.
- `replyToMode`: `off`, `first`, `all`, 또는 `batched`.
- `markdown`: outbound Matrix 텍스트용 선택적 Markdown 렌더링 구성.
- `streaming`: `off` (기본값), `partial`, `quiet`, `true`, 또는 `false`. `partial` 및 `true`는 일반 Matrix 텍스트 메시지로 미리보기 우선 초안 업데이트를 활성화합니다. `quiet`은 셀프 호스팅 push-rule 설정용 비알림 미리보기 notice를 사용합니다.
- `blockStreaming`: `true`는 초안 미리보기 스트리밍이 활성화된 동안 완료된 assistant 블록에 대해 별도의 진행 상태 메시지를 활성화합니다.
- `threadReplies`: `off`, `inbound`, 또는 `always`.
- `threadBindings`: thread-bound session 라우팅 및 수명 주기에 대한 채널별 override.
- `startupVerification`: 시작 시 자동 self-verification 요청 모드 (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: 자동 시작 검증 요청 재시도 전 cooldown.
- `textChunkLimit`: outbound 메시지 chunk 크기.
- `chunkMode`: `length` 또는 `newline`.
- `responsePrefix`: outbound 응답용 선택적 메시지 prefix.
- `ackReaction`: 이 채널/계정용 선택적 ack reaction override.
- `ackReactionScope`: 선택적 ack reaction 범위 override (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: inbound reaction 알림 모드 (`own`, `off`).
- `mediaMaxMb`: Matrix media 처리용 media 크기 상한(MB). outbound 전송과 inbound media 처리 모두에 적용됩니다.
- `autoJoin`: 초대 자동 참가 정책 (`always`, `allowlist`, `off`). 기본값: `off`. 이는 room/group 초대뿐 아니라 DM 스타일 초대를 포함한 일반 Matrix 초대 전체에 적용됩니다. OpenClaw는 참가한 room을 DM 또는 그룹으로 안정적으로 분류하기 전에 초대 시점에 이 결정을 내립니다.
- `autoJoinAllowlist`: `autoJoin`이 `allowlist`일 때 허용되는 room/alias. Alias 항목은 초대 처리 중 room ID로 해석되며, OpenClaw는 초대된 room이 주장하는 alias 상태를 신뢰하지 않습니다.
- `dm`: DM 정책 블록 (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: OpenClaw가 room에 참가하고 이를 DM으로 분류한 후의 DM 접근을 제어합니다. 초대 자동 참가 여부는 바꾸지 않습니다.
- `dm.allowFrom` 항목은 이미 실시간 디렉터리 조회로 해석한 경우가 아니라면 전체 Matrix user ID여야 합니다.
- `dm.sessionScope`: `per-user` (기본값) 또는 `per-room`. 같은 상대라도 각 Matrix DM room이 별도 컨텍스트를 유지하길 원하면 `per-room`을 사용하세요.
- `dm.threadReplies`: DM 전용 thread 정책 override (`off`, `inbound`, `always`). DM에서 응답 배치와 session 격리 모두에 대해 최상위 `threadReplies` 설정을 재정의합니다.
- `execApprovals`: Matrix 네이티브 exec 승인 전달 (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: exec 요청을 승인할 수 있는 Matrix user ID. `dm.allowFrom`이 이미 승인자를 식별하는 경우 선택 사항입니다.
- `execApprovals.target`: `dm | channel | both` (기본값: `dm`).
- `accounts`: 이름 있는 계정별 override. 최상위 `channels.matrix` 값은 이 항목들의 기본값으로 동작합니다.
- `groups`: room별 정책 맵. room ID 또는 alias 사용을 권장하며, 해석되지 않은 room 이름은 런타임에 무시됩니다. session/group 식별성은 해석 후 안정적인 room ID를 사용하며, 사람이 읽기 쉬운 label은 여전히 room 이름에서 가져옵니다.
- `groups.<room>.account`: 다중 계정 설정에서 하나의 상속된 room 항목을 특정 Matrix 계정으로 제한합니다.
- `groups.<room>.allowBots`: 구성된 bot 발신자에 대한 room 수준 override (`true` 또는 `"mentions"`).
- `groups.<room>.users`: room별 발신자 allowlist.
- `groups.<room>.tools`: room별 도구 허용/거부 override.
- `groups.<room>.autoReply`: room 수준 멘션 게이팅 override. `true`는 해당 room의 멘션 요구를 비활성화하고, `false`는 다시 강제합니다.
- `groups.<room>.skills`: 선택적 room 수준 skill 필터.
- `groups.<room>.systemPrompt`: 선택적 room 수준 system prompt 스니펫.
- `rooms`: `groups`의 레거시 alias.
- `actions`: 작업별 도구 게이팅 (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## 관련 항목

- [Channels Overview](/ko/channels) — 지원되는 모든 채널
- [Pairing](/ko/channels/pairing) — DM 인증 및 pairing 흐름
- [Groups](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [Channel Routing](/ko/channels/channel-routing) — 메시지용 session 라우팅
- [Security](/ko/gateway/security) — 접근 모델 및 하드닝
