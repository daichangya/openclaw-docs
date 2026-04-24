---
read_when:
    - IPC 계약 또는 메뉴 막대 app IPC 편집하기
summary: OpenClaw app, Gateway node transport, PeekabooBridge를 위한 macOS IPC 아키텍처
title: macOS IPC
x-i18n:
    generated_at: "2026-04-24T06:24:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 359a33f1a4f5854bd18355f588b4465b5627d9c8fa10a37c884995375da32cac
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# OpenClaw macOS IPC 아키텍처

**현재 모델:** 로컬 Unix socket이 **node host service**를 **macOS app**에 연결하여 exec 승인과 `system.run`을 처리합니다. 검색/연결 확인용 `openclaw-mac` 디버그 CLI가 있으며, 에이전트 작업은 계속 Gateway WebSocket과 `node.invoke`를 통해 흐릅니다. UI 자동화는 PeekabooBridge를 사용합니다.

## 목표

- 모든 TCC 관련 작업(알림, 화면 녹화, 마이크, 음성, AppleScript)을 담당하는 단일 GUI app 인스턴스
- 자동화를 위한 작은 표면: Gateway + node 명령, 그리고 UI 자동화를 위한 PeekabooBridge
- 예측 가능한 권한: 항상 동일한 서명된 번들 ID를 사용하고 launchd로 실행되어 TCC 권한 부여가 유지됨

## 작동 방식

### Gateway + node transport

- app은 Gateway를 실행하고(로컬 모드) node로서 여기에 연결합니다.
- 에이전트 작업은 `node.invoke`를 통해 수행됩니다(예: `system.run`, `system.notify`, `canvas.*`).

### Node service + app IPC

- 헤드리스 node host service가 Gateway WebSocket에 연결합니다.
- `system.run` 요청은 로컬 Unix socket을 통해 macOS app으로 전달됩니다.
- app이 UI 컨텍스트에서 exec를 수행하고, 필요하면 프롬프트를 표시한 뒤, 출력을 반환합니다.

다이어그램(SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (UI 자동화)

- UI 자동화는 `bridge.sock`이라는 별도의 UNIX socket과 PeekabooBridge JSON 프로토콜을 사용합니다.
- 호스트 기본 설정 순서(클라이언트 측): Peekaboo.app → Claude.app → OpenClaw.app → 로컬 실행
- 보안: bridge 호스트는 허용된 TeamID가 필요합니다. DEBUG 전용 same-UID 예외 경로는 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`로 보호됩니다(Peekaboo 관례).
- 자세한 내용은 [PeekabooBridge 사용법](/ko/platforms/mac/peekaboo)을 참조하세요.

## 운영 흐름

- 재시작/재빌드: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - 기존 인스턴스 종료
  - Swift 빌드 + 패키징
  - LaunchAgent 작성/부트스트랩/킥스타트
- 단일 인스턴스: 동일한 번들 ID를 가진 다른 인스턴스가 실행 중이면 app이 조기에 종료됩니다.

## 하드닝 참고 사항

- 모든 권한 있는 표면에서 TeamID 일치를 요구하는 방식을 선호합니다.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`(DEBUG 전용)은 로컬 개발을 위해 same-UID 호출자를 허용할 수 있습니다.
- 모든 통신은 로컬 전용으로 유지되며, 네트워크 socket은 노출되지 않습니다.
- TCC 프롬프트는 GUI app 번들에서만 발생합니다. 재빌드 간에도 서명된 번들 ID를 안정적으로 유지하세요.
- IPC 하드닝: socket 모드 `0600`, token, peer-UID 검사, HMAC challenge/response, 짧은 TTL

## 관련 항목

- [macOS app](/ko/platforms/macos)
- [macOS IPC 흐름(Exec 승인)](/ko/tools/exec-approvals-advanced#macos-ipc-flow)
