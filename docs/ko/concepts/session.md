---
read_when:
    - 세션 라우팅과 격리를 이해하고자 하는 경우
    - 다중 사용자 환경에서 DM 범위를 구성하고자 하는 경우
summary: OpenClaw가 대화 세션을 관리하는 방법
title: 세션 관리
x-i18n:
    generated_at: "2026-04-23T06:02:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: d099ef7f3b484cf0fa45ddbf5648a7497d6509209e4de08c8484102eca073a2b
    source_path: concepts/session.md
    workflow: 15
---

# 세션 관리

OpenClaw는 대화를 **세션**으로 구성합니다. 각 메시지는 DM, 그룹 채팅, Cron 작업 등 어디에서 왔는지에 따라 세션으로 라우팅됩니다.

## 메시지가 라우팅되는 방식

| Source          | 동작 |
| --------------- | ---- |
| Direct messages | 기본적으로 공유 세션 |
| Group chats     | 그룹별로 격리 |
| Rooms/channels  | 룸별로 격리 |
| Cron jobs       | 실행마다 새 세션 |
| Webhooks        | hook별로 격리 |

## DM 격리

기본적으로 모든 DM은 연속성을 위해 하나의 세션을 공유합니다. 이는 단일 사용자 환경에서는 괜찮습니다.

<Warning>
여러 사람이 agent에 메시지를 보낼 수 있다면 DM 격리를 활성화하세요. 그렇지 않으면 모든 사용자가 같은 대화 컨텍스트를 공유하게 되며, Alice의 비공개 메시지가 Bob에게 보이게 됩니다.
</Warning>

**해결 방법:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // 채널 + 발신자 기준으로 격리
  },
}
```

다른 옵션:

- `main` (기본값) -- 모든 DM이 하나의 세션을 공유합니다.
- `per-peer` -- 발신자별로 격리합니다(채널 간).
- `per-channel-peer` -- 채널 + 발신자 기준으로 격리합니다(권장).
- `per-account-channel-peer` -- 계정 + 채널 + 발신자 기준으로 격리합니다.

<Tip>
같은 사람이 여러 채널에서 연락하는 경우, `session.identityLinks`를 사용해 해당 신원을 연결하면 하나의 세션을 공유할 수 있습니다.
</Tip>

`openclaw security audit`로 구성을 확인하세요.

## 세션 수명 주기

세션은 만료될 때까지 재사용됩니다.

- **일일 초기화**(기본값) -- gateway 호스트의 로컬 시간 기준 오전 4:00에 새 세션을 생성합니다.
- **유휴 초기화**(선택 사항) -- 일정 시간 동안 활동이 없으면 새 세션을 생성합니다. `session.reset.idleMinutes`를 설정하세요.
- **수동 초기화** -- 채팅에서 `/new` 또는 `/reset`을 입력합니다. `/new <model>`은 모델도 전환합니다.

일일 초기화와 유휴 초기화가 모두 구성된 경우, 먼저 만료되는 쪽이 적용됩니다.

활성 provider 소유 CLI 세션이 있는 세션은 암시적인 일일 기본값에 의해 끊기지 않습니다. 이런 세션도 타이머에 따라 만료되어야 한다면 `/reset`을 사용하거나 `session.reset`을 명시적으로 구성하세요.

## 상태가 저장되는 위치

모든 세션 상태는 **gateway**가 소유합니다. UI 클라이언트는 세션 데이터를 위해 gateway를 조회합니다.

- **저장소:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **대화 기록:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## 세션 유지 관리

OpenClaw는 시간이 지나면서 세션 저장소 크기를 자동으로 제한합니다. 기본적으로는 `warn` 모드로 실행되며(정리될 항목을 보고만 함), 자동 정리를 원하면 `session.maintenance.mode`를 `"enforce"`로 설정하세요.

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

`openclaw sessions cleanup --dry-run`으로 미리 확인할 수 있습니다.

## 세션 검사

- `openclaw status` -- 세션 저장소 경로와 최근 활동
- `openclaw sessions --json` -- 모든 세션(`--active <minutes>`로 필터링 가능)
- 채팅에서 `/status` -- 컨텍스트 사용량, 모델, 토글
- `/context list` -- 시스템 프롬프트에 포함된 항목

## 추가 읽을거리

- [Session Pruning](/ko/concepts/session-pruning) -- 도구 결과 다듬기
- [Compaction](/ko/concepts/compaction) -- 긴 대화 요약하기
- [Session Tools](/ko/concepts/session-tool) -- 세션 간 작업을 위한 agent 도구
- [Session Management Deep Dive](/ko/reference/session-management-compaction) --
  저장소 스키마, 대화 기록, 전송 정책, 출처 메타데이터, 고급 구성
- [Multi-Agent](/ko/concepts/multi-agent) — agent 간 라우팅 및 세션 격리
- [Background Tasks](/ko/automation/tasks) — 분리된 작업이 세션 참조가 있는 작업 레코드를 만드는 방식
- [Channel Routing](/ko/channels/channel-routing) — 수신 메시지가 세션으로 라우팅되는 방식
