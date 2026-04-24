---
read_when:
    - Bonjour 검색/광고를 구현하거나 변경하는 중입니다.
    - 원격 연결 모드(direct vs SSH)를 조정하는 중입니다.
    - 원격 Node를 위한 Node 검색 + 페어링을 설계하는 중입니다.
summary: gateway를 찾기 위한 Node 검색 및 전송(Bonjour, Tailscale, SSH)
title: 검색 및 전송
x-i18n:
    generated_at: "2026-04-24T06:14:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 684e5aeb1f74a90bf8689f8b25830be2c9e497fcdeda390d98f204d7cb4134b8
    source_path: gateway/discovery.md
    workflow: 15
---

# 검색 및 전송

OpenClaw에는 겉으로 보면 비슷해 보이지만 실제로는 서로 다른 두 가지 문제가 있습니다.

1. **운영자 원격 제어**: macOS 메뉴 막대 앱이 다른 곳에서 실행 중인 gateway를 제어하는 경우
2. **Node 페어링**: iOS/Android(및 향후 Node)가 gateway를 찾고 안전하게 페어링하는 경우

설계 목표는 모든 네트워크 검색/광고를 **Node Gateway**(`openclaw gateway`)에 유지하고, 클라이언트(mac 앱, iOS)는 이를 소비하는 구조로 두는 것입니다.

## 용어

- **Gateway**: 상태(세션, 페어링, Node 레지스트리)를 소유하고 채널을 실행하는 단일 장기 실행 gateway 프로세스입니다. 대부분의 설정은 호스트당 하나를 사용하지만, 격리된 멀티-gateway 설정도 가능합니다.
- **Gateway WS (control plane)**: 기본적으로 `127.0.0.1:18789`에 있는 WebSocket 엔드포인트이며, `gateway.bind`를 통해 LAN/tailnet에 바인딩할 수 있습니다.
- **Direct WS transport**: LAN/tailnet을 향하는 Gateway WS 엔드포인트(SSH 없음)
- **SSH transport (fallback)**: SSH를 통해 `127.0.0.1:18789`를 포워딩하여 원격 제어
- **Legacy TCP bridge (removed)**: 이전 Node 전송([Bridge protocol](/ko/gateway/bridge-protocol) 참조)이며, 더 이상 검색 대상으로 광고되지 않고 현재 빌드에도 포함되지 않습니다.

프로토콜 세부 정보:

- [Gateway protocol](/ko/gateway/protocol)
- [Bridge protocol (legacy)](/ko/gateway/bridge-protocol)

## 왜 "direct"와 SSH를 모두 유지하는가

- **Direct WS**는 동일 네트워크와 tailnet 내에서 가장 좋은 UX를 제공합니다.
  - Bonjour를 통한 LAN 자동 검색
  - gateway가 소유하는 페어링 토큰 + ACL
  - 셸 액세스가 필요 없고, 프로토콜 표면을 좁고 감사 가능하게 유지 가능
- **SSH**는 여전히 범용 대체 경로입니다.
  - SSH 액세스가 있는 어디서나 동작(서로 무관한 네트워크 간에도 가능)
  - 멀티캐스트/mDNS 문제를 회피
  - SSH 외에 새로운 인바운드 포트가 필요 없음

## 검색 입력(클라이언트가 gateway 위치를 학습하는 방식)

### 1) Bonjour / DNS-SD 검색

멀티캐스트 Bonjour는 best-effort 방식이며 네트워크를 넘지 못합니다. OpenClaw는 구성된 광역 DNS-SD 도메인을 통해 같은 gateway 비콘도 탐색할 수 있으므로, 검색 범위는 다음을 포함할 수 있습니다.

- 동일 LAN의 `local.`
- 네트워크 간 검색을 위한 구성된 유니캐스트 DNS-SD 도메인

대상 방향:

- **gateway**는 자신의 WS 엔드포인트를 Bonjour로 광고합니다.
- 클라이언트는 이를 탐색해 “gateway 선택” 목록을 보여주고, 선택된 엔드포인트를 저장합니다.

문제 해결 및 비콘 세부 정보: [Bonjour](/ko/gateway/bonjour)

#### 서비스 비콘 세부 정보

- 서비스 유형:
  - `_openclaw-gw._tcp` (gateway transport 비콘)
- TXT 키(비밀 정보 아님):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (운영자가 구성한 표시 이름)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (TLS가 활성화된 경우에만)
  - `gatewayTlsSha256=<sha256>` (TLS가 활성화되고 지문을 사용할 수 있는 경우에만)
  - `canvasPort=<port>` (canvas 호스트 포트, 현재는 canvas 호스트가 활성화되면 `gatewayPort`와 동일)
  - `tailnetDns=<magicdns>` (선택적 힌트, Tailscale 사용 가능 시 자동 감지)
  - `sshPort=<port>` (mDNS full 모드에서만, 광역 DNS-SD는 이를 생략할 수 있으며 이 경우 SSH 기본값은 `22`)
  - `cliPath=<path>` (mDNS full 모드에서만, 광역 DNS-SD에서도 원격 설치 힌트로 기록됨)

보안 참고:

- Bonjour/mDNS TXT 레코드는 **인증되지 않습니다**. 클라이언트는 TXT 값을 UX 힌트로만 취급해야 합니다.
- 라우팅(호스트/포트)은 TXT로 제공된 `lanHost`, `tailnetDns`, `gatewayPort`보다 **확인된 서비스 엔드포인트**(SRV + A/AAAA)를 우선해야 합니다.
- TLS pinning에서는 광고된 `gatewayTlsSha256`가 기존 저장된 pin을 절대 덮어쓰지 못해야 합니다.
- iOS/Android Node는 선택한 경로가 secure/TLS 기반일 때, 최초 pin 저장 전에 명시적인 “이 지문을 신뢰함” 확인(대역 외 검증)을 요구해야 합니다.

비활성화/재정의:

- `OPENCLAW_DISABLE_BONJOUR=1`은 광고를 비활성화합니다.
- `~/.openclaw/openclaw.json`의 `gateway.bind`는 Gateway 바인드 모드를 제어합니다.
- `OPENCLAW_SSH_PORT`는 `sshPort`가 출력될 때 광고되는 SSH 포트를 재정의합니다.
- `OPENCLAW_TAILNET_DNS`는 `tailnetDns` 힌트(MagicDNS)를 게시합니다.
- `OPENCLAW_CLI_PATH`는 광고되는 CLI 경로를 재정의합니다.

### 2) Tailnet(네트워크 간)

런던/비엔나 스타일 설정에서는 Bonjour가 도움이 되지 않습니다. 권장되는 “direct” 대상은 다음과 같습니다.

- Tailscale MagicDNS 이름(권장) 또는 안정적인 tailnet IP

gateway가 Tailscale 아래에서 실행 중임을 감지할 수 있으면, 클라이언트를 위한 선택적 힌트로 `tailnetDns`를 게시합니다(광역 비콘 포함).

macOS 앱은 이제 gateway 검색 시 원시 Tailscale IP보다 MagicDNS 이름을 우선합니다. 이렇게 하면 tailnet IP가 변경될 때(예: Node 재시작 또는 CGNAT 재할당 후) MagicDNS 이름이 자동으로 현재 IP를 확인하므로 신뢰성이 향상됩니다.

모바일 Node 페어링의 경우, 검색 힌트는 tailnet/공용 경로에서 전송 보안을 완화하지 않습니다.

- iOS/Android는 여전히 첫 tailnet/공용 연결에 대해 secure 경로(`wss://` 또는 Tailscale Serve/Funnel)를 요구합니다.
- 검색된 원시 tailnet IP는 라우팅 힌트일 뿐이며, 평문 원격 `ws://`를 사용할 수 있다는 허용이 아닙니다.
- 비공개 LAN direct-connect `ws://`는 계속 지원됩니다.
- 모바일 Node에서 가장 단순한 Tailscale 경로를 원한다면, 검색과 설정 코드가 동일한 secure MagicDNS 엔드포인트를 확인하도록 Tailscale Serve를 사용하세요.

### 3) 수동 / SSH 대상

direct 경로가 없거나(direct 비활성화 포함) 사용할 수 없으면, 클라이언트는 언제나 loopback gateway 포트를 포워딩하여 SSH를 통해 연결할 수 있습니다.

자세한 내용은 [원격 액세스](/ko/gateway/remote)를 참조하세요.

## 전송 선택(클라이언트 정책)

권장되는 클라이언트 동작:

1. 페어링된 direct 엔드포인트가 구성되어 있고 도달 가능하면 그것을 사용
2. 그렇지 않고 검색에서 `local.` 또는 구성된 광역 도메인의 gateway를 찾으면, 원탭 “이 gateway 사용” 선택지를 제공하고 direct 엔드포인트로 저장
3. 그렇지 않고 tailnet DNS/IP가 구성되어 있으면 direct 시도  
   tailnet/공용 경로의 모바일 Node에서 direct는 평문 원격 `ws://`가 아니라 secure 엔드포인트를 의미함
4. 그렇지 않으면 SSH로 대체

## 페어링 + 인증(direct transport)

gateway는 Node/클라이언트 허용의 진실 공급원입니다.

- 페어링 요청은 gateway에서 생성/승인/거부됩니다([Gateway pairing](/ko/gateway/pairing) 참조).
- gateway는 다음을 강제합니다.
  - 인증(token / keypair)
  - 범위/ACL(gateway는 모든 메서드에 대한 원시 프록시가 아님)
  - 속도 제한

## 구성 요소별 책임

- **Gateway**: 검색 비콘을 광고하고, 페어링 결정을 소유하며, WS 엔드포인트를 호스팅
- **macOS 앱**: gateway 선택을 돕고, 페어링 프롬프트를 표시하며, SSH는 대체 경로로만 사용
- **iOS/Android Node**: 편의 기능으로 Bonjour를 탐색하고, 페어링된 Gateway WS에 연결

## 관련 항목

- [원격 액세스](/ko/gateway/remote)
- [Tailscale](/ko/gateway/tailscale)
- [Bonjour 검색](/ko/gateway/bonjour)
