---
read_when:
    - 외부 CLI 통합 추가 또는 변경하기
    - RPC 어댑터 디버깅(`signal-cli`, `imsg`)
summary: 외부 CLI용 RPC 어댑터(`signal-cli`, 레거시 `imsg`) 및 Gateway 패턴
title: RPC 어댑터
x-i18n:
    generated_at: "2026-04-24T06:34:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e35a08831db5317071aea6fc39dbf2407a7254710b2d1b751a9cc8dc4cc0d307
    source_path: reference/rpc.md
    workflow: 15
---

OpenClaw는 JSON-RPC를 통해 외부 CLI를 통합합니다. 현재는 두 가지 패턴을 사용합니다.

## 패턴 A: HTTP 데몬 (`signal-cli`)

- `signal-cli`는 HTTP 위의 JSON-RPC를 사용하는 데몬으로 실행됩니다.
- 이벤트 스트림은 SSE (`/api/v1/events`)입니다.
- 상태 프로브: `/api/v1/check`.
- `channels.signal.autoStart=true`일 때 OpenClaw가 수명 주기를 소유합니다.

설정과 엔드포인트는 [Signal](/ko/channels/signal)을 참고하세요.

## 패턴 B: stdio 자식 프로세스 (레거시: `imsg`)

> **Note:** 새 iMessage 설정에는 [BlueBubbles](/ko/channels/bluebubbles)를 사용하세요.

- OpenClaw는 `imsg rpc`를 자식 프로세스로 생성합니다(레거시 iMessage 통합).
- JSON-RPC는 stdin/stdout을 통한 줄 구분 형식입니다(줄마다 JSON 객체 하나).
- TCP 포트도 데몬도 필요하지 않습니다.

사용되는 핵심 메서드:

- `watch.subscribe` → 알림 (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (프로브/진단)

레거시 설정과 주소 지정(`chat_id` 권장)은 [iMessage](/ko/channels/imessage)를 참고하세요.

## 어댑터 가이드라인

- Gateway가 프로세스를 소유해야 합니다(시작/중지는 Provider 수명 주기에 연결됨).
- RPC 클라이언트는 복원력을 갖추어야 합니다: 타임아웃, 종료 시 재시작.
- 표시 문자열보다 안정적인 ID(예: `chat_id`)를 우선하세요.

## 관련 문서

- [Gateway 프로토콜](/ko/gateway/protocol)
