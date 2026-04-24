---
read_when:
    - OpenClaw와 함께 Synology Chat를 설정하는 중입니다.
    - Synology Chat Webhook 라우팅 디버깅 중입니다.
summary: Synology Chat Webhook 설정 및 OpenClaw 구성
title: Synology Chat
x-i18n:
    generated_at: "2026-04-24T06:05:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5135e9aa1fd86437a635378dfbbde321bbd2e5f6fef7a3cc740ea54ebf4b76d5
    source_path: channels/synology-chat.md
    workflow: 15
---

상태: Synology Chat Webhook를 사용하는 번들 Plugin 다이렉트 메시지 채널입니다.
이 Plugin은 Synology Chat 아웃고잉 Webhook에서 수신 메시지를 받아들이고,
Synology Chat 인커밍 Webhook를 통해 응답을 전송합니다.

## 번들 Plugin

현재 OpenClaw 릴리스에서는 Synology Chat가 번들 Plugin으로 제공되므로, 일반 패키지 빌드에서는 별도 설치가 필요하지 않습니다.

이전 빌드를 사용 중이거나 Synology Chat가 제외된 사용자 지정 설치를 사용 중이라면 수동으로 설치하세요.

로컬 체크아웃에서 설치:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

자세한 내용: [Plugins](/ko/tools/plugin)

## 빠른 설정

1. Synology Chat Plugin이 사용 가능한지 확인합니다.
   - 현재 패키지형 OpenClaw 릴리스에는 이미 번들되어 있습니다.
   - 이전/사용자 지정 설치에서는 위 명령으로 소스 체크아웃에서 수동 추가할 수 있습니다.
   - 이제 `openclaw onboard`는 `openclaw channels add`와 동일한 채널 설정 목록에 Synology Chat를 표시합니다.
   - 비대화형 설정: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Synology Chat 통합에서 다음을 수행합니다.
   - 인커밍 Webhook를 만들고 해당 URL을 복사합니다.
   - 아웃고잉 Webhook를 만들고 비밀 토큰을 설정합니다.
3. 아웃고잉 Webhook URL을 OpenClaw gateway로 지정합니다.
   - 기본값: `https://gateway-host/webhook/synology`
   - 또는 사용자 지정 `channels.synology-chat.webhookPath`
4. OpenClaw에서 설정을 완료합니다.
   - 안내형: `openclaw onboard`
   - 직접 설정: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. gateway를 재시작하고 Synology Chat 봇에 DM을 전송합니다.

Webhook 인증 세부 정보:

- OpenClaw는 아웃고잉 Webhook 토큰을 `body.token`, 그다음 `?token=...`, 그다음 헤더 순서로 허용합니다.
- 허용되는 헤더 형식:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- 토큰이 비어 있거나 누락되면 fail-closed 방식으로 거부됩니다.

최소 config:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## 환경 변수

기본 계정에는 다음 env var를 사용할 수 있습니다.

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS`(쉼표로 구분)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

config 값이 env var보다 우선합니다.

`SYNOLOGY_CHAT_INCOMING_URL`은 워크스페이스 `.env`에서 설정할 수 없습니다. [Workspace `.env` files](/ko/gateway/security)를 참고하세요.

## DM 정책 및 액세스 제어

- `dmPolicy: "allowlist"`가 권장 기본값입니다.
- `allowedUserIds`는 Synology 사용자 ID 목록(또는 쉼표로 구분된 문자열)을 받습니다.
- `allowlist` 모드에서 `allowedUserIds`가 비어 있으면 잘못된 구성으로 처리되며 Webhook 경로가 시작되지 않습니다(모두 허용하려면 `dmPolicy: "open"` 사용).
- `dmPolicy: "open"`은 모든 발신자를 허용합니다.
- `dmPolicy: "disabled"`는 DM을 차단합니다.
- 응답 수신자 바인딩은 기본적으로 안정적인 숫자 `user_id`를 사용합니다. `channels.synology-chat.dangerouslyAllowNameMatching: true`는 변경 가능한 사용자 이름/닉네임 조회를 통한 응답 전달을 다시 활성화하는 비상 호환성 모드입니다.
- 페어링 승인은 다음 명령으로 처리합니다.
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## 아웃바운드 전달

대상에는 숫자 Synology Chat 사용자 ID를 사용하세요.

예시:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

미디어 전송은 URL 기반 파일 전달을 지원합니다.
아웃바운드 파일 URL은 `http` 또는 `https`를 사용해야 하며, OpenClaw가 URL을 NAS Webhook로 전달하기 전에 사설 또는 그 외 차단된 네트워크 대상은 거부됩니다.

## 멀티 계정

여러 Synology Chat 계정은 `channels.synology-chat.accounts` 아래에서 지원됩니다.
각 계정은 토큰, 인커밍 URL, Webhook 경로, DM 정책, 제한을 재정의할 수 있습니다.
다이렉트 메시지 세션은 계정과 사용자별로 격리되므로, 서로 다른 두 Synology 계정에서 동일한 숫자 `user_id`를 사용하더라도 transcript 상태를 공유하지 않습니다.
활성화된 각 계정에는 고유한 `webhookPath`를 지정하세요. 이제 OpenClaw는 중복된 정확한 경로를 거부하며,
멀티 계정 설정에서 공유 Webhook 경로만 상속하는 이름 있는 계정은 시작을 거부합니다.
이름 있는 계정에 대해 의도적으로 레거시 상속이 필요하면,
해당 계정 또는 `channels.synology-chat`에 `dangerouslyAllowInheritedWebhookPath: true`를 설정할 수 있지만,
중복된 정확한 경로는 여전히 fail-closed 방식으로 거부됩니다. 가능하면 계정별 명시적 경로를 사용하세요.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## 보안 참고 사항

- `token`은 비밀로 유지하고 유출되면 교체하세요.
- 자체 서명된 로컬 NAS 인증서를 명시적으로 신뢰하는 경우가 아니면 `allowInsecureSsl: false`를 유지하세요.
- 인바운드 Webhook 요청은 토큰 검증 및 발신자별 속도 제한이 적용됩니다.
- 잘못된 토큰 검사는 상수 시간 비밀 비교를 사용하며 fail-closed 방식으로 거부됩니다.
- 운영 환경에서는 `dmPolicy: "allowlist"`를 권장합니다.
- 레거시 사용자 이름 기반 응답 전달이 꼭 필요하지 않다면 `dangerouslyAllowNameMatching`은 끄세요.
- 멀티 계정 설정에서 공유 경로 라우팅 위험을 명시적으로 감수하는 경우가 아니면 `dangerouslyAllowInheritedWebhookPath`는 끄세요.

## 문제 해결

- `Missing required fields (token, user_id, text)`:
  - 아웃고잉 Webhook payload에 필요한 필드 중 하나가 없습니다
  - Synology가 헤더로 토큰을 보내는 경우 gateway/프록시가 해당 헤더를 유지하는지 확인하세요
- `Invalid token`:
  - 아웃고잉 Webhook 비밀값이 `channels.synology-chat.token`과 일치하지 않습니다
  - 요청이 잘못된 계정/Webhook 경로로 들어오고 있습니다
  - 리버스 프록시가 요청이 OpenClaw에 도달하기 전에 토큰 헤더를 제거했습니다
- `Rate limit exceeded`:
  - 동일한 소스에서 너무 많은 잘못된 토큰 시도가 있으면 해당 소스가 일시적으로 차단될 수 있습니다
  - 인증된 발신자에게도 별도의 사용자별 메시지 속도 제한이 있습니다
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"`가 활성화되었지만 구성된 사용자가 없습니다
- `User not authorized`:
  - 발신자의 숫자 `user_id`가 `allowedUserIds`에 없습니다

## 관련

- [Channels Overview](/ko/channels) — 지원되는 모든 채널
- [Pairing](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [Groups](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [Channel Routing](/ko/channels/channel-routing) — 메시지 세션 라우팅
- [Security](/ko/gateway/security) — 액세스 모델 및 강화 방법
