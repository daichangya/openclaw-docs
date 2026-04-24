---
read_when:
    - OpenClaw가 Nostr를 통해 DM을 수신하도록 하려는 것입니다.
    - 분산형 메시징을 설정하는 중입니다.
summary: NIP-04 암호화 메시지를 통한 Nostr DM 채널
title: Nostr
x-i18n:
    generated_at: "2026-04-24T06:04:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f722bb4e1c5f2b3a9c1d58f5597aad2826a809cba3d165af7bf2faf72b68a0f
    source_path: channels/nostr.md
    workflow: 15
---

**상태:** 선택적 번들 Plugin(구성되기 전까지 기본적으로 비활성화).

Nostr는 소셜 네트워킹을 위한 분산형 프로토콜입니다. 이 채널을 사용하면 OpenClaw가 NIP-04를 통해 암호화된 다이렉트 메시지(DM)를 수신하고 응답할 수 있습니다.

## 번들 Plugin

현재 OpenClaw 릴리스에는 Nostr가 번들 Plugin으로 포함되어 있으므로, 일반 패키지 빌드에서는 별도 설치가 필요하지 않습니다.

### 이전/사용자 지정 설치

- 온보딩(`openclaw onboard`) 및 `openclaw channels add`는 여전히 공유 채널 카탈로그에서 Nostr를 표시합니다.
- 빌드에 번들 Nostr가 제외되어 있다면 수동으로 설치하세요.

```bash
openclaw plugins install @openclaw/nostr
```

로컬 체크아웃 사용(dev 워크플로):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Plugin을 설치하거나 활성화한 뒤 Gateway를 재시작하세요.

### 비대화형 설정

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

키를 config에 저장하지 않고 환경 변수에 유지하려면 `--use-env`를 사용하세요.

## 빠른 설정

1. Nostr 키 쌍을 생성합니다(필요한 경우).

```bash
# nak 사용
nak key generate
```

2. config에 추가합니다.

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. 키를 export합니다.

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Gateway를 재시작합니다.

## 구성 참조

| Key          | Type     | Default                                     | 설명                                |
| ------------ | -------- | ------------------------------------------- | ----------------------------------- |
| `privateKey` | string   | required                                    | `nsec` 또는 hex 형식의 비공개 키    |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | Relay URL(WebSocket)                |
| `dmPolicy`   | string   | `pairing`                                   | DM 액세스 정책                      |
| `allowFrom`  | string[] | `[]`                                        | 허용된 발신자 pubkey                |
| `enabled`    | boolean  | `true`                                      | 채널 활성화/비활성화                |
| `name`       | string   | -                                           | 표시 이름                           |
| `profile`    | object   | -                                           | NIP-01 프로필 메타데이터            |

## 프로필 메타데이터

프로필 데이터는 NIP-01 `kind:0` 이벤트로 게시됩니다. Control UI(Channels -> Nostr -> Profile)에서 관리하거나 config에서 직접 설정할 수 있습니다.

예시:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "개인 Assistant DM 봇",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

참고:

- 프로필 URL은 `https://`를 사용해야 합니다.
- Relay에서 가져올 때 필드를 병합하며 로컬 override는 유지됩니다.

## 액세스 제어

### DM 정책

- **pairing**(기본값): 알 수 없는 발신자에게 페어링 코드가 전송됩니다.
- **allowlist**: `allowFrom`의 pubkey만 DM을 보낼 수 있습니다.
- **open**: 공개 수신 DM(`allowFrom: ["*"]` 필요).
- **disabled**: 수신 DM 무시.

적용 관련 참고:

- 수신 이벤트 서명은 발신자 정책 및 NIP-04 복호화 전에 검증되므로 위조 이벤트는 초기에 거부됩니다.
- 페어링 응답은 원본 DM 본문을 처리하지 않고 전송됩니다.
- 수신 DM은 속도 제한이 적용되며, 너무 큰 payload는 복호화 전에 폐기됩니다.

### allowlist 예시

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## 키 형식

허용되는 형식:

- **비공개 키:** `nsec...` 또는 64자 hex
- **Pubkey (`allowFrom`)**: `npub...` 또는 hex

## Relay

기본값: `relay.damus.io` 및 `nos.lol`.

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

팁:

- 중복 대비를 위해 2~3개의 Relay를 사용하세요.
- Relay를 너무 많이 사용하지 마세요(지연 시간, 중복 문제).
- 유료 Relay는 안정성을 높일 수 있습니다.
- 테스트용 로컬 Relay도 사용할 수 있습니다(`ws://localhost:7777`).

## 프로토콜 지원

| NIP    | 상태      | 설명                                  |
| ------ | --------- | ------------------------------------- |
| NIP-01 | 지원됨    | 기본 이벤트 형식 + 프로필 메타데이터  |
| NIP-04 | 지원됨    | 암호화된 DM(`kind:4`)                 |
| NIP-17 | 예정      | Gift-wrapped DM                       |
| NIP-44 | 예정      | 버전 관리형 암호화                    |

## 테스트

### 로컬 Relay

```bash
# strfry 시작
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### 수동 테스트

1. 로그에서 봇 pubkey(npub)를 확인합니다.
2. Nostr 클라이언트(Damus, Amethyst 등)를 엽니다.
3. 봇 pubkey로 DM을 보냅니다.
4. 응답을 확인합니다.

## 문제 해결

### 메시지를 받지 못하는 경우

- 비공개 키가 유효한지 확인하세요.
- Relay URL에 접근 가능하고 `wss://`를 사용하는지 확인하세요(로컬은 `ws://` 가능).
- `enabled`가 `false`가 아닌지 확인하세요.
- Relay 연결 오류가 있는지 Gateway 로그를 확인하세요.

### 응답을 보내지 못하는 경우

- Relay가 쓰기를 허용하는지 확인하세요.
- 아웃바운드 연결을 확인하세요.
- Relay 속도 제한이 있는지 확인하세요.

### 중복 응답

- 여러 Relay를 사용할 때는 예상되는 동작입니다.
- 메시지는 이벤트 ID로 중복 제거되며, 첫 번째 전달만 응답을 트리거합니다.

## 보안

- 비공개 키를 절대 커밋하지 마세요.
- 키에는 환경 변수를 사용하세요.
- 운영 봇에는 `allowlist`를 고려하세요.
- 서명은 발신자 정책 전에 검증되고, 발신자 정책은 복호화 전에 적용되므로 위조 이벤트는 초기에 거부되며 알 수 없는 발신자는 전체 암호화 작업을 강제할 수 없습니다.

## 제한 사항(MVP)

- 다이렉트 메시지만 지원(그룹 채팅 미지원).
- 미디어 첨부 파일 미지원.
- NIP-04만 지원(NIP-17 gift-wrap은 예정).

## 관련

- [Channels Overview](/ko/channels) — 지원되는 모든 채널
- [Pairing](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [Groups](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [Channel Routing](/ko/channels/channel-routing) — 메시지용 세션 라우팅
- [Security](/ko/gateway/security) — 액세스 모델 및 강화 방법
