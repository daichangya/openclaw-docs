---
read_when:
    - Cron 작업을 만들지 않고 시스템 이벤트를 큐에 넣으려고 합니다
    - Heartbeat를 활성화하거나 비활성화해야 합니다
    - 시스템 presence 항목을 검사하려고 합니다
summary: '`openclaw system`용 CLI 참조(시스템 이벤트, Heartbeat, presence)'
title: 시스템
x-i18n:
    generated_at: "2026-04-24T06:09:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f4be30b0b2d18ee5653071d6375cebeb9fc94733e30bdb7b89a19c286df880b
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Gateway용 시스템 수준 헬퍼: 시스템 이벤트 큐잉, Heartbeat 제어, presence 보기.

모든 `system` 하위 명령은 Gateway RPC를 사용하며 공유 클라이언트 플래그를 받습니다:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## 공통 명령

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

**main** 세션에 시스템 이벤트를 큐에 넣습니다. 다음 Heartbeat가 이를 프롬프트의 `System:` 줄로 주입합니다. Heartbeat를 즉시 트리거하려면 `--mode now`를 사용하세요. `next-heartbeat`는 다음 예약 틱까지 기다립니다.

플래그:

- `--text <text>`: 필수 시스템 이벤트 텍스트.
- `--mode <mode>`: `now` 또는 `next-heartbeat`(기본값).
- `--json`: 기계 판독 가능한 출력.
- `--url`, `--token`, `--timeout`, `--expect-final`: 공유 Gateway RPC 플래그.

## `system heartbeat last|enable|disable`

Heartbeat 제어:

- `last`: 마지막 Heartbeat 이벤트를 표시합니다.
- `enable`: Heartbeat를 다시 켭니다(비활성화된 경우 사용).
- `disable`: Heartbeat를 일시 중지합니다.

플래그:

- `--json`: 기계 판독 가능한 출력.
- `--url`, `--token`, `--timeout`, `--expect-final`: 공유 Gateway RPC 플래그.

## `system presence`

Gateway가 알고 있는 현재 시스템 presence 항목(Node, 인스턴스 및 유사한 상태 줄)을 나열합니다.

플래그:

- `--json`: 기계 판독 가능한 출력.
- `--url`, `--token`, `--timeout`, `--expect-final`: 공유 Gateway RPC 플래그.

## 참고

- 현재 구성(로컬 또는 원격)으로 접근 가능한 실행 중 Gateway가 필요합니다.
- 시스템 이벤트는 일시적이며 재시작 후에는 유지되지 않습니다.

## 관련 문서

- [CLI 참조](/ko/cli)
