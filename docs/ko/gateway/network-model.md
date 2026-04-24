---
read_when:
    - Gateway 네트워킹 모델을 간결하게 보고 싶습니다
summary: Gateway, node, 그리고 canvas host가 연결되는 방식.
title: 네트워크 모델
x-i18n:
    generated_at: "2026-04-24T06:15:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68637b72c4b3a6110556909da9a454e4be480fe2f3b42b09d054949c1104a62c
    source_path: gateway/network-model.md
    workflow: 15
---

> 이 내용은 [Network](/ko/network#core-model)로 통합되었습니다. 최신 가이드는 해당 페이지를 참조하세요.

대부분의 작업은 채널 연결과 WebSocket 제어 플레인을 소유하는 단일 장기 실행 프로세스인 Gateway(`openclaw gateway`)를 통해 흐릅니다.

## 핵심 규칙

- 호스트당 하나의 Gateway를 권장합니다. WhatsApp Web 세션을 소유할 수 있는 유일한 프로세스입니다. rescue bot 또는 엄격한 격리가 필요하다면 격리된 profile과 포트로 여러 gateway를 실행하세요. [여러 Gateway](/ko/gateway/multiple-gateways)를 참조하세요.
- 먼저 loopback: Gateway WS 기본값은 `ws://127.0.0.1:18789`입니다. 마법사는 기본적으로 공유 비밀 인증을 생성하며, loopback만 사용할 때도 보통 토큰을 생성합니다. loopback이 아닌 접근에는 유효한 gateway 인증 경로를 사용하세요. 즉, 공유 비밀 토큰/비밀번호 인증 또는 올바르게 구성된 non-loopback `trusted-proxy` 배포입니다. tailnet/모바일 설정은 일반적으로 원시 tailnet `ws://`보다 Tailscale Serve 또는 다른 `wss://` 엔드포인트를 통해 더 잘 동작합니다.
- node는 필요에 따라 LAN, tailnet, 또는 SSH를 통해 Gateway WS에 연결합니다.
  레거시 TCP bridge는 제거되었습니다.
- canvas host는 Gateway와 **같은 포트**(기본값 `18789`)의 Gateway HTTP 서버에서 제공됩니다.
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    `gateway.auth`가 구성되어 있고 Gateway가 loopback 너머에 바인딩되어 있으면, 이 경로들은 Gateway 인증으로 보호됩니다. node 클라이언트는 활성 WS 세션에 연결된 node 범위 capability URL을 사용합니다. [Gateway configuration](/ko/gateway/configuration)의 `canvasHost`, `gateway`를 참조하세요.
- 원격 사용은 일반적으로 SSH 터널 또는 tailnet VPN입니다. [원격 액세스](/ko/gateway/remote) 및 [Discovery](/ko/gateway/discovery)를 참조하세요.

## 관련 항목

- [원격 액세스](/ko/gateway/remote)
- [trusted proxy 인증](/ko/gateway/trusted-proxy-auth)
- [Gateway 프로토콜](/ko/gateway/protocol)
