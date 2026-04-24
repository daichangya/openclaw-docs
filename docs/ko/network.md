---
read_when:
    - 네트워크 아키텍처 + 보안 개요가 필요합니다
    - 로컬 vs tailnet 접근 또는 페어링을 디버깅하고 있습니다
    - 네트워킹 문서의 정식 목록이 필요합니다
summary: '네트워크 허브: gateway 표면, 페어링, 검색, 보안'
title: 네트워크
x-i18n:
    generated_at: "2026-04-24T06:22:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 663f372555f044146a5d381566371e9a38185e7f295243bfd61314f12e3a4f06
    source_path: network.md
    workflow: 15
---

# 네트워크 허브

이 허브는 OpenClaw가 localhost, LAN, tailnet 전반에서 device를 어떻게 연결하고, 페어링하고, 보호하는지에 대한 핵심 문서를 연결합니다.

## 핵심 모델

대부분의 작업은 채널 연결과 WebSocket 제어 플레인을 소유하는 단일 장기 실행 프로세스인 Gateway(`openclaw gateway`)를 통해 흐릅니다.

- **먼저 loopback**: Gateway WS 기본값은 `ws://127.0.0.1:18789`입니다.
  loopback이 아닌 바인드에는 유효한 gateway 인증 경로가 필요합니다. 즉, 공유 비밀
  토큰/비밀번호 인증 또는 올바르게 구성된 non-loopback
  `trusted-proxy` 배포입니다.
- **호스트당 하나의 Gateway**를 권장합니다. 격리가 필요하다면 격리된 profile과 포트로 여러 gateway를 실행하세요([여러 Gateway](/ko/gateway/multiple-gateways)).
- **canvas host**는 Gateway와 같은 포트에서 제공됩니다(`/**__openclaw__**/canvas/`, `/__openclaw__/a2ui/`). loopback 너머로 바인드될 때는 Gateway 인증으로 보호됩니다.
- **원격 접근**은 보통 SSH 터널 또는 Tailscale VPN입니다([원격 액세스](/ko/gateway/remote)).

핵심 참조:

- [Gateway 아키텍처](/ko/concepts/architecture)
- [Gateway 프로토콜](/ko/gateway/protocol)
- [Gateway runbook](/ko/gateway)
- [웹 표면 + 바인드 모드](/ko/web)

## 페어링 + ID

- [페어링 개요(DM + node)](/ko/channels/pairing)
- [Gateway 소유 node 페어링](/ko/gateway/pairing)
- [Devices CLI(페어링 + 토큰 순환)](/ko/cli/devices)
- [Pairing CLI(DM 승인)](/ko/cli/pairing)

로컬 신뢰:

- 직접적인 로컬 loopback 연결은 같은 호스트 UX를 매끄럽게 유지하기 위해 페어링이 자동 승인될 수 있습니다.
- OpenClaw는 신뢰된 공유 비밀 도우미 흐름을 위한 좁은 범위의 backend/container-local self-connect 경로도 가지고 있습니다.
- 같은 호스트의 tailnet 바인드를 포함한 tailnet 및 LAN 클라이언트는 여전히 명시적 페어링 승인이 필요합니다.

## 검색 + 전송

- [검색 및 전송](/ko/gateway/discovery)
- [Bonjour / mDNS](/ko/gateway/bonjour)
- [원격 액세스(SSH)](/ko/gateway/remote)
- [Tailscale](/ko/gateway/tailscale)

## Nodes + 전송

- [Nodes 개요](/ko/nodes)
- [Bridge 프로토콜(레거시 node, 역사적)](/ko/gateway/bridge-protocol)
- [Node runbook: iOS](/ko/platforms/ios)
- [Node runbook: Android](/ko/platforms/android)

## 보안

- [보안 개요](/ko/gateway/security)
- [Gateway config 참조](/ko/gateway/configuration)
- [문제 해결](/ko/gateway/troubleshooting)
- [Doctor](/ko/gateway/doctor)

## 관련 항목

- [Gateway 네트워크 모델](/ko/gateway/network-model)
- [원격 액세스](/ko/gateway/remote)
