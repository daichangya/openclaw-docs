---
read_when:
    - Gateway Control UI를 localhost 바깥에 노출하기
    - tailnet 또는 공개 대시보드 접근 자동화하기
summary: Gateway 대시보드를 위한 통합 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-04-24T06:16:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30bfe5fa2c9295dcf7164a1a89876d2e097f54d42bd261dfde973fddbd9185ce
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (Gateway 대시보드)

OpenClaw는 Gateway 대시보드와 WebSocket 포트에 대해 Tailscale **Serve**(tailnet) 또는 **Funnel**(공개)을 자동 구성할 수 있습니다. 이렇게 하면 Gateway는 loopback에 바인드된 상태를 유지하고, Tailscale이 HTTPS, 라우팅, 그리고(Serve의 경우) 신원 헤더를 제공합니다.

## 모드

- `serve`: `tailscale serve`를 통한 Tailnet 전용 Serve. Gateway는 `127.0.0.1`에 유지됩니다.
- `funnel`: `tailscale funnel`을 통한 공개 HTTPS. OpenClaw는 공유 비밀번호를 요구합니다.
- `off`: 기본값(Tailscale 자동화 없음).

## 인증

핸드셰이크를 제어하려면 `gateway.auth.mode`를 설정하세요:

- `none` (private ingress 전용)
- `token` (`OPENCLAW_GATEWAY_TOKEN`이 설정된 경우 기본값)
- `password` (`OPENCLAW_GATEWAY_PASSWORD` 또는 구성을 통한 공유 시크릿)
- `trusted-proxy` (신원 인식 reverse proxy; [신뢰된 프록시 인증](/ko/gateway/trusted-proxy-auth) 참고)

`tailscale.mode = "serve"`이고 `gateway.auth.allowTailscale`이 `true`이면,
Control UI/WebSocket 인증은 token/password를 제공하지 않고도
Tailscale 신원 헤더(`tailscale-user-login`)를 사용할 수 있습니다. OpenClaw는
로컬 Tailscale 데몬(`tailscale whois`)을 통해 `x-forwarded-for` 주소를 해석하고
이를 헤더와 일치시키는 방식으로 신원을 검증한 뒤 수락합니다.
OpenClaw는 요청이 loopback에서 오고 Tailscale의 `x-forwarded-for`, `x-forwarded-proto`, `x-forwarded-host`
헤더가 있을 때만 이를 Serve로 간주합니다.
HTTP API 엔드포인트(예: `/v1/*`, `/tools/invoke`, `/api/channels/*`)는
Tailscale 신원 헤더 인증을 사용하지 않습니다. 이들은 여전히 Gateway의
일반 HTTP 인증 모드를 따릅니다: 기본적으로 공유 시크릿 인증, 또는 의도적으로
구성된 trusted-proxy / private-ingress `none` 설정.
이 토큰 없는 흐름은 Gateway 호스트가 신뢰된다는 가정에 기반합니다. 신뢰할 수 없는 로컬 코드가 같은 호스트에서 실행될 수 있다면 `gateway.auth.allowTailscale`을 비활성화하고 대신 token/password 인증을 요구하세요.
명시적인 공유 시크릿 자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`로 설정하고
`gateway.auth.mode: "token"` 또는 `"password"`를 사용하세요.

## 구성 예시

### Tailnet 전용(Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

열기: `https://<magicdns>/` (또는 구성된 `gateway.controlUi.basePath`)

### Tailnet 전용(Tailnet IP에 바인드)

Gateway가 Tailnet IP에서 직접 수신하게 하려면(Serve/Funnel 없음) 이 방식을 사용하세요.

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

다른 Tailnet 기기에서 연결:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

참고: 이 모드에서는 loopback (`http://127.0.0.1:18789`)이 **작동하지 않습니다**.

### 공용 인터넷(Funnel + 공유 비밀번호)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

비밀번호를 디스크에 커밋하는 대신 `OPENCLAW_GATEWAY_PASSWORD` 사용을 권장합니다.

## CLI 예시

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 참고

- Tailscale Serve/Funnel을 사용하려면 `tailscale` CLI가 설치되어 있고 로그인되어 있어야 합니다.
- `tailscale.mode: "funnel"`은 공개 노출을 피하기 위해 인증 모드가 `password`가 아니면 시작을 거부합니다.
- 종료 시 OpenClaw가 `tailscale serve` 또는 `tailscale funnel` 구성을 되돌리게 하려면 `gateway.tailscale.resetOnExit`를 설정하세요.
- `gateway.bind: "tailnet"`은 직접 Tailnet 바인드입니다(HTTPS 없음, Serve/Funnel 없음).
- `gateway.bind: "auto"`는 loopback을 우선합니다. Tailnet 전용을 원하면 `tailnet`을 사용하세요.
- Serve/Funnel은 **Gateway Control UI + WS**만 노출합니다. Node는 동일한 Gateway WS 엔드포인트를 통해 연결되므로 Serve는 Node 접근에도 사용할 수 있습니다.

## 브라우저 제어(원격 Gateway + 로컬 브라우저)

Gateway를 한 머신에서 실행하지만 다른 머신의 브라우저를 제어하고 싶다면,
브라우저 머신에서 **Node 호스트**를 실행하고 두 머신을 같은 tailnet에 두세요.
Gateway가 브라우저 작업을 Node로 프록시하므로 별도의 제어 서버나 Serve URL은 필요하지 않습니다.

브라우저 제어에는 Funnel을 피하고, Node 페어링을 운영자 접근과 동일하게 취급하세요.

## Tailscale 사전 요구 사항 + 제한

- Serve를 사용하려면 tailnet에 HTTPS가 활성화되어 있어야 하며, 없으면 CLI가 프롬프트를 표시합니다.
- Serve는 Tailscale 신원 헤더를 주입하지만, Funnel은 그렇지 않습니다.
- Funnel은 Tailscale v1.38.3+, MagicDNS, HTTPS 활성화, funnel Node 속성을 요구합니다.
- Funnel은 TLS에서 `443`, `8443`, `10000` 포트만 지원합니다.
- macOS에서 Funnel을 사용하려면 오픈소스 Tailscale 앱 변형이 필요합니다.

## 더 알아보기

- Tailscale Serve 개요: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 명령: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 개요: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 명령: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 관련 문서

- [원격 접근](/ko/gateway/remote)
- [Discovery](/ko/gateway/discovery)
- [인증](/ko/gateway/authentication)
