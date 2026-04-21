---
read_when:
    - DM 액세스 제어 설정하기
    - 새 iOS/Android Node 페어링하기
    - OpenClaw 보안 상태 검토하기
summary: '페어링 개요: 누가 나에게 DM을 보낼 수 있는지와 어떤 Node가 참여할 수 있는지 승인하기'
title: 페어링
x-i18n:
    generated_at: "2026-04-21T06:00:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4161629ead02dc0bdcd283cc125fe6579a579e03740127f4feb22dfe344bd028
    source_path: channels/pairing.md
    workflow: 15
---

# 페어링

“페어링”은 OpenClaw의 명시적인 **소유자 승인** 단계입니다.
이 기능은 두 곳에서 사용됩니다:

1. **DM 페어링**(누가 봇과 대화할 수 있는지)
2. **Node 페어링**(어떤 기기/Node가 Gateway 네트워크에 참여할 수 있는지)

보안 맥락: [보안](/ko/gateway/security)

## 1) DM 페어링(수신 채팅 액세스)

채널이 DM 정책 `pairing`으로 구성되면, 알 수 없는 발신자는 짧은 코드를 받게 되며 사용자가 승인할 때까지 해당 메시지는 **처리되지 않습니다**.

기본 DM 정책은 다음 문서에 설명되어 있습니다: [보안](/ko/gateway/security)

페어링 코드:

- 8자, 대문자, 혼동하기 쉬운 문자 없음(`0O1I`).
- **1시간 후 만료**됩니다. 봇은 새 요청이 생성될 때만 페어링 메시지를 보냅니다(대략 발신자당 시간당 1회).
- 보류 중인 DM 페어링 요청은 기본적으로 **채널당 3개**로 제한됩니다. 하나가 만료되거나 승인될 때까지 추가 요청은 무시됩니다.

### 발신자 승인하기

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

지원되는 채널: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### 상태가 저장되는 위치

`~/.openclaw/credentials/` 아래에 저장됩니다:

- 보류 중인 요청: `<channel>-pairing.json`
- 승인된 허용 목록 저장소:
  - 기본 계정: `<channel>-allowFrom.json`
  - 기본이 아닌 계정: `<channel>-<accountId>-allowFrom.json`

계정 범위 동작:

- 기본이 아닌 계정은 자신의 범위가 지정된 허용 목록 파일만 읽고 씁니다.
- 기본 계정은 채널 범위의 범위 미지정 허용 목록 파일을 사용합니다.

이 파일들은 민감한 정보로 취급하세요(어시스턴트에 대한 액세스를 제어합니다).

중요: 이 저장소는 DM 액세스용입니다. 그룹 권한 부여는 별개입니다.
DM 페어링 코드를 승인해도 해당 발신자가 그룹 명령을 실행하거나 그룹에서 봇을 제어할 수 있도록 자동으로 허용되지는 않습니다. 그룹 액세스의 경우 채널의 명시적 그룹 허용 목록(예: `groupAllowFrom`, `groups`, 또는 채널에 따라 그룹별/토픽별 오버라이드)을 구성하세요.

## 2) Node 기기 페어링(iOS/Android/macOS/헤드리스 Node)

Node는 `role: node`를 가진 **기기**로 Gateway에 연결됩니다. Gateway는 승인해야 하는 기기 페어링 요청을 생성합니다.

### Telegram으로 페어링하기(iOS 권장)

`device-pair` Plugin을 사용하면 Telegram에서 처음 기기 페어링을 전부 진행할 수 있습니다:

1. Telegram에서 봇에게 `/pair`를 보냅니다.
2. 봇이 두 개의 메시지로 응답합니다: 안내 메시지 하나와 별도의 **설정 코드** 메시지 하나(Telegram에서 복사/붙여넣기 쉬움).
3. 휴대폰에서 OpenClaw iOS 앱 → Settings → Gateway를 엽니다.
4. 설정 코드를 붙여넣고 연결합니다.
5. Telegram으로 돌아가 `/pair pending`을 실행한 뒤(요청 ID, 역할, 범위 검토), 승인합니다.

설정 코드는 다음을 포함하는 base64 인코딩 JSON 페이로드입니다:

- `url`: Gateway WebSocket URL(`ws://...` 또는 `wss://...`)
- `bootstrapToken`: 초기 페어링 핸드셰이크에 사용되는 수명이 짧은 단일 기기 bootstrap 토큰

이 bootstrap 토큰에는 내장된 페어링 bootstrap 프로필이 포함됩니다:

- 기본으로 전달되는 `node` 토큰은 계속 `scopes: []`를 유지합니다
- 전달되는 `operator` 토큰은 bootstrap 허용 목록으로 계속 제한됩니다:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- bootstrap 범위 검사는 하나의 평면 범위 풀 방식이 아니라 역할 접두사 기반입니다:
  operator 범위 항목은 operator 요청에만 적용되며, operator가 아닌 역할은
  여전히 각자의 역할 접두사 아래에서 범위를 요청해야 합니다

설정 코드가 유효한 동안에는 비밀번호처럼 취급하세요.

### Node 기기 승인하기

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

같은 기기가 다른 인증 세부 정보(예: 다른 역할/범위/공개 키)로 다시 시도하면 이전 보류 요청은 대체되고 새로운 `requestId`가 생성됩니다.

중요: 이미 페어링된 기기가 더 넓은 액세스 권한을 자동으로 얻지는 않습니다. 더 많은 범위나 더 넓은 역할을 요청하며 다시 연결되면 OpenClaw는 기존 승인을 그대로 유지하고 새로운 보류 업그레이드 요청을 생성합니다. 승인하기 전에 `openclaw devices list`를 사용해 현재 승인된 액세스와 새로 요청된 액세스를 비교하세요.

### Node 페어링 상태 저장소

`~/.openclaw/devices/` 아래에 저장됩니다:

- `pending.json`(수명이 짧음; 보류 중인 요청은 만료됨)
- `paired.json`(페어링된 기기 + 토큰)

### 참고

- 레거시 `node.pair.*` API(CLI: `openclaw nodes pending|approve|reject|rename`)는 별도의 Gateway 소유 페어링 저장소입니다. WS Node는 여전히 기기 페어링이 필요합니다.
- 페어링 기록은 승인된 역할에 대한 영구적인 source of truth입니다. 활성 기기 토큰은 그 승인된 역할 집합에 계속 제한되며, 승인된 역할 밖에 있는 토큰 항목이 있어도 새로운 액세스가 생기지는 않습니다.

## 관련 문서

- 보안 모델 + 프롬프트 인젝션: [보안](/ko/gateway/security)
- 안전하게 업데이트하기(doctor 실행): [업데이트](/ko/install/updating)
- 채널 구성:
  - Telegram: [Telegram](/ko/channels/telegram)
  - WhatsApp: [WhatsApp](/ko/channels/whatsapp)
  - Signal: [Signal](/ko/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/ko/channels/bluebubbles)
  - iMessage (레거시): [iMessage](/ko/channels/imessage)
  - Discord: [Discord](/ko/channels/discord)
  - Slack: [Slack](/ko/channels/slack)
