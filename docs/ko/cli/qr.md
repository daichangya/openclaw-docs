---
read_when:
    - 모바일 Node 앱을 gateway와 빠르게 페어링하려는 것입니다.
    - 원격/수동 공유를 위한 설정 코드 출력이 필요합니다.
summary: '`openclaw qr`에 대한 CLI 참조(모바일 페어링 QR + 설정 코드 생성)'
title: QR
x-i18n:
    generated_at: "2026-04-24T06:08:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05e25f5cf4116adcd0630b148b6799e90304058c51c998293ebbed995f0a0533
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

현재 Gateway 구성을 바탕으로 모바일 페어링 QR과 설정 코드를 생성합니다.

## 사용법

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## 옵션

- `--remote`: `gateway.remote.url`을 우선 사용합니다. 이 값이 설정되지 않은 경우에도 `gateway.tailscale.mode=serve|funnel`이면 원격 공개 URL을 제공할 수 있습니다
- `--url <url>`: payload에 사용할 gateway URL을 재정의합니다
- `--public-url <url>`: payload에 사용할 공개 URL을 재정의합니다
- `--token <token>`: bootstrap 흐름이 인증에 사용할 gateway token을 재정의합니다
- `--password <password>`: bootstrap 흐름이 인증에 사용할 gateway password를 재정의합니다
- `--setup-code-only`: 설정 코드만 출력합니다
- `--no-ascii`: ASCII QR 렌더링을 건너뜁니다
- `--json`: JSON을 출력합니다(`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## 참고

- `--token`과 `--password`는 함께 사용할 수 없습니다.
- 이제 설정 코드 자체에는 공유 gateway token/password가 아니라 불투명한 단기 `bootstrapToken`이 포함됩니다.
- 내장된 node/operator bootstrap 흐름에서는 기본 node token이 여전히 `scopes: []`로 생성됩니다.
- bootstrap handoff가 operator token도 발급하는 경우, 그 token은 bootstrap allowlist 범위로 제한됩니다: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- bootstrap scope 검사는 역할 접두사 기반입니다. 해당 operator allowlist는 operator 요청에만 적용되며, operator가 아닌 역할은 여전히 자기 역할 접두사 아래의 scope가 필요합니다.
- Tailscale/공개 `ws://` gateway URL에서는 모바일 페어링이 fail-closed 방식으로 실패합니다. 사설 LAN `ws://`는 계속 지원되지만, Tailscale/공개 모바일 경로는 Tailscale Serve/Funnel 또는 `wss://` gateway URL을 사용해야 합니다.
- `--remote` 사용 시 OpenClaw는 `gateway.remote.url` 또는 `gateway.tailscale.mode=serve|funnel` 중 하나를 요구합니다.
- `--remote` 사용 시, 효과적으로 활성화된 원격 자격 증명이 SecretRef로 구성되어 있고 `--token` 또는 `--password`를 전달하지 않으면, 이 명령은 활성 gateway 스냅샷에서 해당 값을 해석합니다. gateway를 사용할 수 없으면 즉시 실패합니다.
- `--remote` 없이 사용할 때는 CLI 인증 재정의를 전달하지 않으면 로컬 gateway 인증 SecretRef가 해석됩니다.
  - `gateway.auth.token`은 token 인증이 우선될 수 있을 때 해석됩니다(명시적인 `gateway.auth.mode="token"` 또는 password 소스가 우선하지 않는 추론 모드).
  - `gateway.auth.password`는 password 인증이 우선될 수 있을 때 해석됩니다(명시적인 `gateway.auth.mode="password"` 또는 auth/env에서 우선 token이 없는 추론 모드).
- `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고(SecretRef 포함) `gateway.auth.mode`가 설정되지 않은 경우, mode를 명시적으로 설정할 때까지 설정 코드 해석은 실패합니다.
- Gateway 버전 차이 참고: 이 명령 경로는 `secrets.resolve`를 지원하는 gateway가 필요합니다. 이전 gateway는 알 수 없는 메서드 오류를 반환합니다.
- 스캔 후 다음 명령으로 디바이스 페어링을 승인하세요.
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## 관련

- [CLI reference](/ko/cli)
- [Pairing](/ko/cli/pairing)
