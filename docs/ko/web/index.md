---
read_when:
    - Tailscale을 통해 Gateway에 액세스하려는 경우
    - 브라우저 Control UI와 config 편집을 원하는 경우
summary: 'Gateway 웹 표면: Control UI, bind 모드, 보안'
title: 웹
x-i18n:
    generated_at: "2026-04-24T06:43:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0336a6597cebf4a8a83d348abd3d59ff4b9bd7349a32c8a0a0093da0f656e97d
    source_path: web/index.md
    workflow: 15
---

Gateway는 Gateway WebSocket과 같은 포트에서 작은 **브라우저 Control UI**(Vite + Lit)를 제공합니다.

- 기본값: `http://<host>:18789/`
- 선택적 접두사: `gateway.controlUi.basePath` 설정(예: `/openclaw`)

capability는 [Control UI](/ko/web/control-ui)에 있습니다.
이 페이지는 bind 모드, 보안, 웹 표면에 초점을 둡니다.

## Webhooks

`hooks.enabled=true`이면, Gateway는 같은 HTTP 서버에서 작은 Webhook 엔드포인트도 노출합니다.
인증 + payload는 [Gateway 구성](/ko/gateway/configuration)의 `hooks`를 참조하세요.

## Config (기본 활성화)

Control UI는 자산이 존재할 때(`dist/control-ui`) **기본적으로 활성화**됩니다.
config로 이를 제어할 수 있습니다.

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath는 선택 사항
  },
}
```

## Tailscale 액세스

### 통합 Serve (권장)

Gateway를 loopback에 유지하고 Tailscale Serve가 이를 프록시하게 하세요.

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

그런 다음 gateway를 시작:

```bash
openclaw gateway
```

열기:

- `https://<magicdns>/` (또는 구성한 `gateway.controlUi.basePath`)

### Tailnet bind + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

그런 다음 gateway를 시작합니다(이 non-loopback 예시는 공유 시크릿 token
인증 사용).

```bash
openclaw gateway
```

열기:

- `http://<tailscale-ip>:18789/` (또는 구성한 `gateway.controlUi.basePath`)

### 공용 인터넷 (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // 또는 OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## 보안 참고

- 기본적으로 Gateway 인증이 필요합니다(token, password, trusted-proxy, 또는 활성화된 경우 Tailscale Serve identity 헤더).
- non-loopback bind에는 여전히 **Gateway 인증이 필요합니다**. 실제로는 token/password 인증 또는 `gateway.auth.mode: "trusted-proxy"`를 사용하는 identity-aware 리버스 프록시를 의미합니다.
- 마법사는 기본적으로 공유 시크릿 인증을 만들고 보통
  gateway token도 생성합니다(loopback에서도).
- 공유 시크릿 모드에서 UI는 `connect.params.auth.token` 또는
  `connect.params.auth.password`를 보냅니다.
- Tailscale Serve 또는 `trusted-proxy` 같은 identity-bearing 모드에서는
  WebSocket 인증 검사가 대신 요청 헤더로 충족됩니다.
- non-loopback Control UI 배포의 경우, `gateway.controlUi.allowedOrigins`를
  명시적으로 설정하세요(전체 origin). 이를 설정하지 않으면 기본적으로 gateway 시작이 거부됩니다.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`는
  Host 헤더 origin fallback 모드를 활성화하지만, 위험한 보안 하향 조정입니다.
- Serve 사용 시 `gateway.auth.allowTailscale`이 `true`이면
  Tailscale identity 헤더가 Control UI/WebSocket 인증을 충족할 수 있습니다
  (token/password 불필요).
  HTTP API 엔드포인트는 이 Tailscale identity 헤더를 사용하지 않으며, 대신
  gateway의 일반 HTTP 인증 모드를 따릅니다.
  명시적 자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`를 설정하세요.
  자세한 내용은 [Tailscale](/ko/gateway/tailscale) 및 [보안](/ko/gateway/security)을 참조하세요. 이
  tokenless 흐름은 gateway 호스트가 신뢰된다는 가정하에 동작합니다.
- `gateway.tailscale.mode: "funnel"`에는 `gateway.auth.mode: "password"`(공유 password)가 필요합니다.

## UI 빌드

Gateway는 `dist/control-ui`에서 정적 파일을 제공합니다. 다음으로 빌드하세요.

```bash
pnpm ui:build
```
