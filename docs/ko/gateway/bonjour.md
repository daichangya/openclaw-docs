---
read_when:
    - macOS/iOS에서 Bonjour 검색 문제 디버깅
    - mDNS 서비스 유형, TXT 레코드 또는 검색 UX 변경
summary: Bonjour/mDNS 검색 및 디버깅(Gateway 비콘, 클라이언트, 일반적인 실패 모드)
title: Bonjour 검색
x-i18n:
    generated_at: "2026-04-24T06:12:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5d9099ce178aca1e6e443281133928f886de965245ad0fb02ce91a27aad3989
    source_path: gateway/bonjour.md
    workflow: 15
---

# Bonjour / mDNS 검색

OpenClaw는 활성 Gateway(WebSocket 엔드포인트)를 검색하기 위해 Bonjour(mDNS / DNS‑SD)를 사용합니다.
멀티캐스트 `local.` 탐색은 **LAN 전용 편의 기능**입니다. 네트워크 간 검색을 위해
동일한 비콘을 구성된 광역 DNS-SD 도메인을 통해 게시할 수도 있습니다. 검색은
여전히 best-effort이며 SSH 또는 Tailnet 기반 연결을 **대체하지 않습니다**.

## Tailscale을 통한 광역 Bonjour(Unicast DNS-SD)

노드와 Gateway가 서로 다른 네트워크에 있으면 멀티캐스트 mDNS는 그 경계를
넘지 못합니다. 이 경우 Tailscale을 통한 **unicast DNS‑SD**
("Wide‑Area Bonjour")로 전환해 동일한 검색 UX를 유지할 수 있습니다.

상위 수준 단계:

1. Gateway 호스트에서 DNS 서버를 실행합니다(Tailnet을 통해 도달 가능해야 함).
2. 전용 존 아래에 `_openclaw-gw._tcp`용 DNS‑SD 레코드를 게시합니다
   (예: `openclaw.internal.`).
3. 선택한 도메인이 해당
   DNS 서버를 통해 확인되도록 Tailscale **split DNS**를 구성합니다(iOS 포함 클라이언트 대상).

OpenClaw는 어떤 검색 도메인이든 지원하며, `openclaw.internal.`은 예시일 뿐입니다.
iOS/Android 노드는 `local.`과 구성된 광역 도메인을 모두 탐색합니다.

### Gateway 구성(권장)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet 전용(권장)
  discovery: { wideArea: { enabled: true } }, // 광역 DNS-SD 게시 활성화
}
```

### 1회성 DNS 서버 설정(Gateway 호스트)

```bash
openclaw dns setup --apply
```

이 명령은 CoreDNS를 설치하고 다음과 같이 구성합니다.

- Gateway의 Tailscale 인터페이스에서만 포트 53 수신
- 선택한 도메인(예: `openclaw.internal.`)을 `~/.openclaw/dns/<domain>.db`에서 제공

Tailnet에 연결된 머신에서 검증:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 설정

Tailscale 관리자 콘솔에서:

- Gateway의 tailnet IP(UDP/TCP 53)를 가리키는 네임서버를 추가합니다.
- 검색 도메인이 해당 네임서버를 사용하도록 split DNS를 추가합니다.

클라이언트가 tailnet DNS를 수락하면 iOS 노드와 CLI 검색은
멀티캐스트 없이도 검색 도메인에서 `_openclaw-gw._tcp`를 탐색할 수 있습니다.

### Gateway 리스너 보안(권장)

Gateway WS 포트(기본값 `18789`)는 기본적으로 loopback에 바인딩됩니다. LAN/tailnet
액세스를 위해서는 명시적으로 바인딩하고 인증을 활성화된 상태로 유지하세요.

tailnet 전용 설정의 경우:

- `~/.openclaw/openclaw.json`에서 `gateway.bind: "tailnet"`을 설정합니다.
- Gateway를 재시작합니다(또는 macOS 메뉴바 앱을 재시작합니다).

## 무엇이 광고되는가

오직 Gateway만 `_openclaw-gw._tcp`를 광고합니다.

## 서비스 유형

- `_openclaw-gw._tcp` — Gateway 전송 비콘(macOS/iOS/Android 노드에서 사용).

## TXT 키(비밀이 아닌 힌트)

Gateway는 UI 흐름을 편리하게 만들기 위해 작은 비밀이 아닌 힌트를 광고합니다.

- `role=gateway`
- `displayName=<친숙한 이름>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (TLS가 활성화된 경우에만)
- `gatewayTlsSha256=<sha256>` (TLS가 활성화되어 있고 지문을 사용할 수 있는 경우에만)
- `canvasPort=<port>` (canvas 호스트가 활성화된 경우에만, 현재는 `gatewayPort`와 동일)
- `transport=gateway`
- `tailnetDns=<magicdns>` (Tailnet을 사용할 수 있을 때의 선택적 힌트)
- `sshPort=<port>` (mDNS full 모드에서만, 광역 DNS-SD에서는 생략될 수 있음)
- `cliPath=<path>` (mDNS full 모드에서만, 광역 DNS-SD에서도 원격 설치 힌트로 계속 기록됨)

보안 참고:

- Bonjour/mDNS TXT 레코드는 **인증되지 않습니다**. 클라이언트는 TXT를 권위 있는 라우팅 정보로 취급해서는 안 됩니다.
- 클라이언트는 확인된 서비스 엔드포인트(SRV + A/AAAA)를 사용해 라우팅해야 합니다. `lanHost`, `tailnetDns`, `gatewayPort`, `gatewayTlsSha256`는 힌트로만 취급하세요.
- SSH 자동 대상 지정도 마찬가지로 TXT 전용 힌트가 아니라 확인된 서비스 호스트를 사용해야 합니다.
- TLS pinning에서는 광고된 `gatewayTlsSha256`이 이전에 저장된 핀을 덮어쓰도록 허용해서는 안 됩니다.
- iOS/Android 노드는 검색 기반 직접 연결을 **TLS 전용**으로 취급해야 하며, 처음 보는 지문을 신뢰하기 전에 명시적인 사용자 확인을 요구해야 합니다.

## macOS에서 디버깅

유용한 내장 도구:

- 인스턴스 탐색:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 특정 인스턴스 확인(`<instance>` 교체):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

탐색은 되지만 확인이 실패한다면, 보통 LAN 정책 또는
mDNS 확인자 문제입니다.

## Gateway 로그에서 디버깅

Gateway는 순환 로그 파일을 기록합니다(시작 시
`gateway log file: ...`로 출력됨). 특히 다음과 같은 `bonjour:` 줄을 확인하세요.

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## iOS 노드에서 디버깅

iOS 노드는 `NWBrowser`를 사용해 `_openclaw-gw._tcp`를 검색합니다.

로그를 수집하려면:

- 설정 → Gateway → 고급 → **검색 디버그 로그**
- 설정 → Gateway → 고급 → **검색 로그** → 재현 → **복사**

로그에는 브라우저 상태 전환과 결과 집합 변경 내용이 포함됩니다.

## 일반적인 실패 모드

- **Bonjour는 네트워크를 넘지 못함**: Tailnet 또는 SSH를 사용하세요.
- **멀티캐스트 차단됨**: 일부 Wi‑Fi 네트워크는 mDNS를 비활성화합니다.
- **절전 / 인터페이스 변동**: macOS가 일시적으로 mDNS 결과를 놓칠 수 있으니 다시 시도하세요.
- **탐색은 되지만 확인이 실패함**: 머신 이름은 단순하게 유지하세요(이모지 또는
  문장부호 피하기). 그런 다음 Gateway를 재시작하세요. 서비스 인스턴스 이름은
  호스트 이름에서 파생되므로, 너무 복잡한 이름은 일부 확인자를 혼란스럽게 만들 수 있습니다.

## 이스케이프된 인스턴스 이름(`\032`)

Bonjour/DNS‑SD는 서비스 인스턴스 이름의 바이트를 종종 10진수 `\DDD`
시퀀스로 이스케이프합니다(예: 공백은 `\032`가 됨).

- 이는 프로토콜 수준에서 정상입니다.
- UI는 표시용으로 이를 디코딩해야 합니다(iOS는 `BonjourEscapes.decode` 사용).

## 비활성화 / 구성

- `OPENCLAW_DISABLE_BONJOUR=1`은 광고를 비활성화합니다(레거시: `OPENCLAW_DISABLE_BONJOUR`).
- `~/.openclaw/openclaw.json`의 `gateway.bind`는 Gateway 바인드 모드를 제어합니다.
- `OPENCLAW_SSH_PORT`는 `sshPort`가 광고될 때 SSH 포트를 재정의합니다(레거시: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS`는 TXT에 MagicDNS 힌트를 게시합니다(레거시: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH`는 광고되는 CLI 경로를 재정의합니다(레거시: `OPENCLAW_CLI_PATH`).

## 관련 문서

- 검색 정책 및 전송 선택: [검색](/ko/gateway/discovery)
- 노드 페어링 + 승인: [Gateway 페어링](/ko/gateway/pairing)
