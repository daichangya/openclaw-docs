---
read_when:
    - Tailscale을 통해 Gateway에 액세스하려고 합니다
    - 브라우저 Control UI 및 config 편집을 원합니다
summary: 'Gateway 웹 surface: Control UI, 바인드 모드 및 보안'
title: 웹
x-i18n:
    generated_at: "2026-04-25T12:30:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 424704a35ce3a0f5960486372514751cc93ae90e4b75d0ed114e045664256d2d
    source_path: web/index.md
    workflow: 15
---

Gateway는 Gateway WebSocket과 같은 포트에서 작은 **브라우저 Control UI**(Vite + Lit)를 제공합니다.

- 기본값: `http://<host>:18789/`
- `gateway.tls.enabled: true`일 때: `https://<host>:18789/`
- 선택적 접두사: `gateway.controlUi.basePath` 설정(예: `/openclaw`)

기능은 [Control UI](/ko/web/control-ui)에 있습니다.
이 페이지는 바인드 모드, 보안, 웹 노출 surface에 중점을 둡니다.

## Webhook

`hooks.enabled=true`일 때 Gateway는 동일한 HTTP 서버에서 작은 Webhook 엔드포인트도 노출합니다.
인증 + payload는 [Gateway 구성](/ko/gateway/configuration) → `hooks`를 참조하세요.

## config(기본 활성화)

Control UI는 자산이 존재하면(`dist/control-ui`) **기본적으로 활성화**됩니다.
config로 제어할 수 있습니다.

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath는 선택 사항
  },
}
```

## Tailscale 액세스

### 통합 Serve(권장)

Gateway는 loopback에 유지하고 Tailscale Serve가 이를 프록시하도록 합니다.

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

그런 다음 Gateway를 시작합니다.

```bash
openclaw gateway
```

다음으로 엽니다.

- `https://<magicdns>/`(또는 구성된 `gateway.controlUi.basePath`)

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

그런 다음 Gateway를 시작합니다(이 non-loopback 예시는 공유 비밀 token
인증 사용).

```bash
openclaw gateway
```

다음으로 엽니다.

- `http://<tailscale-ip>:18789/`(또는 구성된 `gateway.controlUi.basePath`)

### 퍼블릭 인터넷(Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // 또는 OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## 보안 참고 사항

- Gateway 인증은 기본적으로 필요합니다(token, password, trusted-proxy, 또는 활성화된 경우 Tailscale Serve ID 헤더).
- non-loopback 바인드도 여전히 **Gateway 인증이 필요**합니다. 실제로는 token/password 인증 또는 `gateway.auth.mode: "trusted-proxy"`를 사용하는 ID 인식 reverse proxy를 의미합니다.
- 마법사는 기본적으로 공유 비밀 인증을 생성하며 일반적으로 Gateway token도 생성합니다(loopback에서도 마찬가지).
- 공유 비밀 모드에서 UI는 `connect.params.auth.token` 또는 `connect.params.auth.password`를 전송합니다.
- `gateway.tls.enabled: true`일 때 로컬 대시보드 및 상태 helper는 `https://` 대시보드 URL과 `wss://` WebSocket URL을 렌더링합니다.
- Tailscale Serve 또는 `trusted-proxy` 같은 ID 포함 모드에서는 WebSocket 인증 검사가 대신 요청 헤더로 충족됩니다.
- non-loopback Control UI 배포의 경우 `gateway.controlUi.allowedOrigins`를 명시적으로 설정하세요(전체 origin). 이 값이 없으면 기본적으로 Gateway 시작이 거부됩니다.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`는 Host 헤더 origin fallback 모드를 활성화하지만, 위험한 보안 저하입니다.
- Serve 사용 시 `gateway.auth.allowTailscale`이 `true`이면 Tailscale ID 헤더가 Control UI/WebSocket 인증을 충족할 수 있습니다(token/password 불필요).
  HTTP API 엔드포인트는 해당 Tailscale ID 헤더를 사용하지 않으며, 대신 Gateway의 일반 HTTP 인증 모드를 따릅니다. 명시적 자격 증명이 필요하도록 하려면 `gateway.auth.allowTailscale: false`를 설정하세요. 자세한 내용은 [Tailscale](/ko/gateway/tailscale) 및 [보안](/ko/gateway/security)을 참조하세요. 이
  token 없는 흐름은 Gateway 호스트가 신뢰된다고 가정합니다.
- `gateway.tailscale.mode: "funnel"`은 `gateway.auth.mode: "password"`(공유 password)가 필요합니다.

## UI 빌드

Gateway는 `dist/control-ui`에서 정적 파일을 제공합니다. 다음 명령으로 빌드하세요.

```bash
pnpm ui:build
```
