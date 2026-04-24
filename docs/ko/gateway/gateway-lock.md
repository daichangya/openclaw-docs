---
read_when:
    - Gateway 프로세스 실행 또는 디버깅하기
    - 단일 인스턴스 강제 적용 조사하기
summary: WebSocket 리스너 바인드를 사용하는 Gateway 싱글턴 가드
title: Gateway 잠금
x-i18n:
    generated_at: "2026-04-24T06:14:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f52405d1891470592cb2f9328421dc910c15f4fdc4d34d57c1fec8b322c753f
    source_path: gateway/gateway-lock.md
    workflow: 15
---

## 이유

- 같은 호스트에서 기본 포트별로 Gateway 인스턴스가 하나만 실행되도록 보장합니다. 추가 Gateway는 격리된 프로필과 고유 포트를 사용해야 합니다.
- 충돌/SIGKILL 이후에도 오래된 잠금 파일이 남지 않도록 합니다.
- control 포트가 이미 사용 중이면 명확한 오류와 함께 빠르게 실패합니다.

## 메커니즘

- Gateway는 시작 직후 전용 TCP 리스너를 사용해 WebSocket 리스너(기본값 `ws://127.0.0.1:18789`)를 즉시 바인드합니다.
- 바인드가 `EADDRINUSE`로 실패하면 시작 과정에서 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`를 던집니다.
- OS는 충돌과 SIGKILL을 포함한 어떤 프로세스 종료에서도 리스너를 자동으로 해제하므로, 별도의 잠금 파일이나 정리 단계가 필요하지 않습니다.
- 종료 시 Gateway는 포트를 신속히 해제하기 위해 WebSocket 서버와 하위 HTTP 서버를 닫습니다.

## 오류 표면

- 다른 프로세스가 해당 포트를 점유하고 있으면, 시작 시 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`를 던집니다.
- 그 외 바인드 실패는 `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`로 표시됩니다.

## 운영 참고 사항

- 포트를 _다른_ 프로세스가 점유하고 있는 경우에도 오류는 동일합니다. 포트를 비우거나 `openclaw gateway --port <port>`로 다른 포트를 선택하세요.
- macOS 앱은 Gateway를 생성하기 전에 여전히 자체적인 경량 PID 가드를 유지하지만, 런타임 잠금은 WebSocket 바인드로 강제됩니다.

## 관련

- [여러 Gateway](/ko/gateway/multiple-gateways) — 고유 포트로 여러 인스턴스 실행하기
- [문제 해결](/ko/gateway/troubleshooting) — `EADDRINUSE` 및 포트 충돌 진단
