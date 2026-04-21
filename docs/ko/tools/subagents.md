---
read_when:
    - 에이전트를 통해 백그라운드/병렬 작업을 원합니다
    - '`sessions_spawn` 또는 서브 에이전트 도구 정책을 변경하고 있습니다'
    - 스레드에 바인딩된 서브 에이전트 세션을 구현하거나 문제를 해결하고 있습니다
summary: '서브 에이전트: 결과를 요청자 채팅에 다시 알려주는 격리된 에이전트 실행'
title: 서브 에이전트
x-i18n:
    generated_at: "2026-04-21T19:20:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 218913f0db88d40e1b5fdb0201b8d23e7af23df572c86ff4be2637cb62498281
    source_path: tools/subagents.md
    workflow: 15
---

# 서브 에이전트

서브 에이전트는 기존 에이전트 실행에서 생성되는 백그라운드 에이전트 실행입니다. 이들은 자체 세션(`agent:<agentId>:subagent:<uuid>`)에서 실행되며, 완료되면 결과를 요청자 채팅 채널에 다시 **알립니다**. 각 서브 에이전트 실행은 [백그라운드 작업](/ko/automation/tasks)으로 추적됩니다.

## 슬래시 명령어

현재 세션의 서브 에이전트 실행을 확인하거나 제어하려면 `/subagents`를 사용하세요.

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

스레드 바인딩 제어:

이 명령어들은 영구적인 스레드 바인딩을 지원하는 채널에서 동작합니다. 아래의 **스레드 지원 채널**을 참조하세요.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info`는 실행 메타데이터(상태, 타임스탬프, 세션 id, transcript 경로, 정리 여부)를 표시합니다.
제한되고 안전 필터링된 회상 보기를 위해 `sessions_history`를 사용하세요. 원시 전체 transcript가 필요하면 디스크의 transcript 경로를 확인하세요.

### 생성 동작

`/subagents spawn`은 내부 릴레이가 아니라 사용자 명령으로 백그라운드 서브 에이전트를 시작하며, 실행이 끝나면 요청자 채팅으로 최종 완료 업데이트 하나를 보냅니다.

- 생성 명령은 논블로킹입니다. 즉시 실행 id를 반환합니다.
- 완료 시 서브 에이전트는 요약/결과 메시지를 요청자 채팅 채널에 다시 알립니다.
- 완료 알림은 푸시 기반입니다. 한 번 생성한 뒤에는 완료를 기다리기 위해 `/subagents list`, `sessions_list`, `sessions_history`를 루프로 폴링하지 마세요. 상태 확인은 디버깅이나 개입이 필요할 때만 요청 시 수행하세요.
- 완료 시 OpenClaw는 해당 서브 에이전트 세션이 연 추적된 브라우저 탭/프로세스를 알림 정리 흐름이 계속되기 전에 best-effort 방식으로 닫습니다.
- 수동 생성의 경우 전달은 복원력이 있습니다.
  - OpenClaw는 먼저 안정적인 멱등성 키로 직접 `agent` 전달을 시도합니다.
  - 직접 전달에 실패하면 큐 라우팅으로 대체합니다.
  - 큐 라우팅도 여전히 사용할 수 없으면 최종 포기 전 짧은 지수 백오프로 알림 전달을 재시도합니다.
- 완료 전달은 확인된 요청자 라우트를 유지합니다.
  - 가능한 경우 스레드 바인딩 또는 대화 바인딩 완료 라우트가 우선합니다.
  - 완료 출처가 채널만 제공하는 경우 OpenClaw는 요청자 세션의 확인된 라우트(`lastChannel` / `lastTo` / `lastAccountId`)에서 누락된 target/account를 채워 직접 전달이 계속 작동하도록 합니다.
- 요청자 세션으로의 완료 핸드오프는 런타임에서 생성된 내부 컨텍스트이며, 사용자 작성 텍스트가 아닙니다. 여기에는 다음이 포함됩니다.
  - `Result`(가장 최근에 표시된 `assistant` 응답 텍스트, 없으면 정제된 최신 tool/toolResult 텍스트. 종료된 실패 실행은 캡처된 응답 텍스트를 재사용하지 않음)
  - `Status`(`completed successfully` / `failed` / `timed out` / `unknown`)
  - 간결한 런타임/토큰 통계
  - 요청자 에이전트가 원시 내부 메타데이터를 전달하지 않고 일반 assistant 목소리로 다시 작성하도록 지시하는 전달 지침
- `--model`과 `--thinking`은 해당 실행에 한해 기본값을 재정의합니다.
- 완료 후 세부 정보와 출력을 확인하려면 `info`/`log`를 사용하세요.
- `/subagents spawn`은 일회성 모드(`mode: "run"`)입니다. 영구적인 스레드 바인딩 세션에는 `thread: true`와 `mode: "session"`을 사용해 `sessions_spawn`을 사용하세요.
- ACP 하네스 세션(Codex, Claude Code, Gemini CLI)의 경우 `runtime: "acp"`와 함께 `sessions_spawn`을 사용하고 [ACP Agents](/ko/tools/acp-agents)를 참조하세요.

주요 목표:

- 메인 실행을 막지 않고 "조사 / 장기 작업 / 느린 도구" 작업을 병렬화합니다.
- 기본적으로 서브 에이전트를 격리된 상태로 유지합니다(세션 분리 + 선택적 샌드박싱).
- 도구 표면을 오용하기 어렵게 유지합니다. 서브 에이전트에는 기본적으로 세션 도구가 제공되지 않습니다.
- 오케스트레이터 패턴을 위한 구성 가능한 중첩 깊이를 지원합니다.

비용 참고: 각 서브 에이전트는 **자체적인** 컨텍스트와 토큰 사용량을 가집니다. 무겁거나 반복적인 작업의 경우 서브 에이전트에는 더 저렴한 모델을 설정하고 메인 에이전트는 더 높은 품질의 모델로 유지하세요.
이 값은 `agents.defaults.subagents.model` 또는 에이전트별 재정의를 통해 구성할 수 있습니다.

## 도구

`sessions_spawn`을 사용하세요.

- 서브 에이전트 실행을 시작합니다(`deliver: false`, 전역 lane: `subagent`)
- 그런 다음 알림 단계를 실행하고 알림 응답을 요청자 채팅 채널에 게시합니다.
- 기본 model: 호출자를 상속합니다. 단, `agents.defaults.subagents.model`(또는 에이전트별 `agents.list[].subagents.model`)을 설정한 경우는 예외입니다. 명시적인 `sessions_spawn.model`이 있으면 그것이 여전히 우선합니다.
- 기본 thinking: 호출자를 상속합니다. 단, `agents.defaults.subagents.thinking`(또는 에이전트별 `agents.list[].subagents.thinking`)을 설정한 경우는 예외입니다. 명시적인 `sessions_spawn.thinking`이 있으면 그것이 여전히 우선합니다.
- 기본 실행 timeout: `sessions_spawn.runTimeoutSeconds`가 생략되면 OpenClaw는 설정된 경우 `agents.defaults.subagents.runTimeoutSeconds`를 사용하고, 그렇지 않으면 `0`(timeout 없음)으로 대체합니다.

도구 파라미터:

- `task`(필수)
- `label?`(선택 사항)
- `agentId?`(선택 사항, 허용되는 경우 다른 에이전트 id 아래에서 생성)
- `model?`(선택 사항, 서브 에이전트 model 재정의. 유효하지 않은 값은 건너뛰며, 서브 에이전트는 기본 model로 실행되고 경고가 tool result에 표시됨)
- `thinking?`(선택 사항, 서브 에이전트 실행의 thinking 수준 재정의)
- `runTimeoutSeconds?`(설정된 경우 `agents.defaults.subagents.runTimeoutSeconds`를 기본값으로 사용하고, 그렇지 않으면 `0`; 설정 시 서브 에이전트 실행은 N초 후 중단됨)
- `thread?`(기본값 `false`; `true`일 때 이 서브 에이전트 세션에 대한 채널 스레드 바인딩을 요청)
- `mode?`(`run|session`)
  - 기본값은 `run`
  - `thread: true`이고 `mode`가 생략되면 기본값은 `session`
  - `mode: "session"`은 `thread: true`가 필요함
- `cleanup?`(`delete|keep`, 기본값 `keep`)
- `sandbox?`(`inherit|require`, 기본값 `inherit`; `require`는 대상 하위 런타임이 샌드박스되지 않은 경우 생성을 거부함)
- `sessions_spawn`은 채널 전달 파라미터(`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`)를 받지 않습니다. 전달에는 생성된 실행에서 `message`/`sessions_send`를 사용하세요.

## 스레드 바인딩 세션

채널에서 스레드 바인딩이 활성화되면, 서브 에이전트는 스레드에 계속 바인딩된 상태를 유지할 수 있으며 해당 스레드의 후속 사용자 메시지는 계속 같은 서브 에이전트 세션으로 라우팅됩니다.

### 스레드 지원 채널

- Discord(현재 유일한 지원 채널): 영구적인 스레드 바인딩 서브 에이전트 세션(`thread: true`를 사용한 `sessions_spawn`), 수동 스레드 제어(`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), 그리고 어댑터 키 `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`, `channels.discord.threadBindings.spawnSubagentSessions`를 지원합니다.

빠른 흐름:

1. `thread: true`(선택적으로 `mode: "session"`도 포함)를 사용해 `sessions_spawn`으로 생성합니다.
2. OpenClaw가 활성 채널에서 해당 세션 대상에 대한 스레드를 생성하거나 바인딩합니다.
3. 해당 스레드의 응답과 후속 메시지는 바인딩된 세션으로 라우팅됩니다.
4. 비활성 자동 언포커스를 확인/업데이트하려면 `/session idle`을 사용하고, 하드 한도를 제어하려면 `/session max-age`를 사용하세요.
5. 수동으로 분리하려면 `/unfocus`를 사용하세요.

수동 제어:

- `/focus <target>`은 현재 스레드를 서브 에이전트/세션 대상에 바인딩하거나 스레드를 새로 만듭니다.
- `/unfocus`는 현재 바인딩된 스레드의 바인딩을 제거합니다.
- `/agents`는 활성 실행과 바인딩 상태(`thread:<id>` 또는 `unbound`)를 나열합니다.
- `/session idle` 및 `/session max-age`는 포커스된 바인딩 스레드에서만 동작합니다.

구성 스위치:

- 전역 기본값: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- 채널 재정의 및 생성 자동 바인드 키는 어댑터별입니다. 위의 **스레드 지원 채널**을 참조하세요.

현재 어댑터 세부 사항은 [Configuration Reference](/ko/gateway/configuration-reference) 및 [Slash commands](/ko/tools/slash-commands)를 참조하세요.

허용 목록:

- `agents.list[].subagents.allowAgents`: `agentId`를 통해 대상으로 지정할 수 있는 에이전트 id 목록(`["*"]`는 아무거나 허용). 기본값: 요청자 에이전트만.
- `agents.defaults.subagents.allowAgents`: 요청자 에이전트가 자체 `subagents.allowAgents`를 설정하지 않은 경우 사용되는 기본 대상 에이전트 허용 목록.
- 샌드박스 상속 가드: 요청자 세션이 샌드박스된 경우, `sessions_spawn`은 샌드박스 없이 실행될 대상을 거부합니다.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: true이면 `agentId`를 생략한 `sessions_spawn` 호출을 차단합니다(명시적 프로필 선택 강제). 기본값: false.

검색:

- 현재 `sessions_spawn`에 허용된 에이전트 id를 보려면 `agents_list`를 사용하세요.

자동 보관:

- 서브 에이전트 세션은 `agents.defaults.subagents.archiveAfterMinutes` 이후 자동으로 보관됩니다(기본값: 60).
- 보관은 `sessions.delete`를 사용하며 transcript를 `*.deleted.<timestamp>`로 같은 폴더에 이름 변경합니다.
- `cleanup: "delete"`는 알림 직후 즉시 보관합니다(transcript는 이름 변경을 통해 계속 유지됨).
- 자동 보관은 best-effort입니다. 게이트웨이가 재시작되면 대기 중인 타이머는 사라집니다.
- `runTimeoutSeconds`는 자동 보관하지 않습니다. 실행만 중지할 뿐입니다. 세션은 자동 보관까지 유지됩니다.
- 자동 보관은 depth-1과 depth-2 세션에 동일하게 적용됩니다.
- 브라우저 정리는 보관 정리와 별개입니다. transcript/세션 레코드를 유지하더라도, 추적된 브라우저 탭/프로세스는 실행이 끝날 때 best-effort 방식으로 닫힙니다.

## 중첩된 서브 에이전트

기본적으로 서브 에이전트는 자신의 서브 에이전트를 생성할 수 없습니다(`maxSpawnDepth: 1`). `maxSpawnDepth: 2`로 설정하면 한 단계의 중첩을 활성화할 수 있으며, 이를 통해 **오케스트레이터 패턴**을 사용할 수 있습니다: 메인 → 오케스트레이터 서브 에이전트 → 작업자 서브-서브-에이전트.

### 활성화 방법

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 서브 에이전트가 하위 항목을 생성할 수 있도록 허용(기본값: 1)
        maxChildrenPerAgent: 5, // 에이전트 세션당 최대 활성 하위 항목 수(기본값: 5)
        maxConcurrent: 8, // 전역 동시성 lane 상한(기본값: 8)
        runTimeoutSeconds: 900, // 생략 시 sessions_spawn의 기본 timeout(0 = timeout 없음)
      },
    },
  },
}
```

### 깊이 수준

| Depth | 세션 키 형태                               | 역할                                          | 생성 가능 여부                |
| ----- | ------------------------------------------ | --------------------------------------------- | ----------------------------- |
| 0     | `agent:<id>:main`                          | 메인 에이전트                                 | 항상 가능                     |
| 1     | `agent:<id>:subagent:<uuid>`               | 서브 에이전트(depth 2 허용 시 오케스트레이터) | `maxSpawnDepth >= 2`일 때만 가능 |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 서브-서브-에이전트(리프 작업자)               | 불가                          |

### 알림 체인

결과는 체인을 따라 위로 흐릅니다.

1. depth-2 작업자가 완료됨 → 부모(depth-1 오케스트레이터)에게 알림
2. depth-1 오케스트레이터가 알림을 받아 결과를 종합하고 완료됨 → 메인에 알림
3. 메인 에이전트가 알림을 받아 사용자에게 전달

각 단계는 자신의 직속 하위 항목에서 오는 알림만 볼 수 있습니다.

운영 지침:

- 하위 작업은 한 번 시작하고 완료 이벤트를 기다리세요. `sessions_list`, `sessions_history`, `/subagents list`, 또는 `exec` sleep 명령을 둘러싼 폴링 루프를 만들지 마세요.
- 하위 완료 이벤트가 최종 답변을 이미 보낸 뒤에 도착하면, 올바른 후속 응답은 정확히 무음 토큰 `NO_REPLY` / `no_reply`입니다.

### 깊이별 도구 정책

- 역할과 제어 범위는 생성 시 세션 메타데이터에 기록됩니다. 이렇게 하면 평면화되었거나 복원된 세션 키가 실수로 오케스트레이터 권한을 다시 얻는 일을 방지할 수 있습니다.
- **Depth 1(오케스트레이터, `maxSpawnDepth >= 2`인 경우)**: 자신의 하위 항목을 관리할 수 있도록 `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`를 받습니다. 그 외 세션/시스템 도구는 계속 거부됩니다.
- **Depth 1(리프, `maxSpawnDepth == 1`인 경우)**: 세션 도구가 없습니다(현재 기본 동작).
- **Depth 2(리프 작업자)**: 세션 도구가 없습니다 — depth 2에서는 `sessions_spawn`이 항상 거부됩니다. 더 깊은 하위 항목은 생성할 수 없습니다.

### 에이전트별 생성 제한

각 에이전트 세션은(어떤 깊이이든) 동시에 최대 `maxChildrenPerAgent`(기본값: 5)개의 활성 하위 항목만 가질 수 있습니다. 이는 단일 오케스트레이터에서 통제되지 않은 팬아웃이 발생하는 것을 방지합니다.

### 연쇄 중지

depth-1 오케스트레이터를 중지하면 모든 depth-2 하위 항목도 자동으로 중지됩니다.

- 메인 채팅에서 `/stop`을 사용하면 모든 depth-1 에이전트가 중지되며, 그들의 depth-2 하위 항목에도 연쇄 적용됩니다.
- `/subagents kill <id>`는 특정 서브 에이전트를 중지하며, 그 하위 항목에도 연쇄 적용됩니다.
- `/subagents kill all`은 요청자의 모든 서브 에이전트를 중지하며 연쇄 적용됩니다.

## 인증

서브 에이전트 인증은 세션 유형이 아니라 **agent id**로 확인됩니다.

- 서브 에이전트 세션 키는 `agent:<agentId>:subagent:<uuid>`입니다.
- 인증 저장소는 해당 에이전트의 `agentDir`에서 로드됩니다.
- 메인 에이전트의 인증 프로필은 **폴백**으로 병합되며, 충돌 시 에이전트 프로필이 메인 프로필을 덮어씁니다.

참고: 병합은 추가 방식이므로 메인 프로필은 항상 폴백으로 사용할 수 있습니다. 에이전트별로 완전히 격리된 인증은 아직 지원되지 않습니다.

## 알림

서브 에이전트는 알림 단계를 통해 다시 보고합니다.

- 알림 단계는 요청자 세션이 아니라 서브 에이전트 세션 내부에서 실행됩니다.
- 서브 에이전트가 정확히 `ANNOUNCE_SKIP`으로 응답하면 아무것도 게시되지 않습니다.
- 최신 assistant 텍스트가 정확히 무음 토큰 `NO_REPLY` / `no_reply`이면, 이전에 표시된 진행 상황이 있었더라도 알림 출력은 억제됩니다.
- 그 외에는 요청자 깊이에 따라 전달 방식이 달라집니다.
  - 최상위 요청자 세션은 외부 전달(`deliver=true`)이 있는 후속 `agent` 호출을 사용합니다.
  - 중첩된 요청자 서브 에이전트 세션은 오케스트레이터가 세션 내에서 하위 결과를 종합할 수 있도록 내부 후속 주입(`deliver=false`)을 받습니다.
  - 중첩된 요청자 서브 에이전트 세션이 더 이상 없으면, OpenClaw는 가능한 경우 해당 세션의 요청자로 폴백합니다.
- 최상위 요청자 세션의 경우, 완료 모드 직접 전달은 먼저 바인딩된 대화/스레드 라우트와 hook 재정의를 확인한 뒤, 요청자 세션의 저장된 라우트에서 누락된 채널 대상 필드를 채웁니다. 이렇게 하면 완료 출처가 채널만 식별하더라도 완료가 올바른 채팅/토픽에 유지됩니다.
- 중첩 완료 결과를 빌드할 때 하위 완료 집계는 현재 요청자 실행 범위로 제한되므로, 이전 실행의 오래된 하위 출력이 현재 알림에 섞여 들어가는 일을 방지합니다.
- 알림 응답은 채널 어댑터에서 가능한 경우 스레드/토픽 라우팅을 유지합니다.
- 알림 컨텍스트는 안정적인 내부 이벤트 블록으로 정규화됩니다.
  - 소스(`subagent` 또는 `cron`)
  - 하위 세션 키/id
  - 알림 유형 + 작업 레이블
  - 런타임 결과(`success`, `error`, `timeout`, `unknown`)에서 도출된 상태 줄
  - 최신 표시 assistant 텍스트에서 선택한 결과 콘텐츠, 없으면 정제된 최신 tool/toolResult 텍스트. 종료된 실패 실행은 캡처된 응답 텍스트를 재생하지 않고 실패 상태를 보고합니다.
  - 응답할지 무응답으로 있을지 설명하는 후속 지침
- `Status`는 모델 출력에서 추론되지 않습니다. 런타임 결과 신호에서 가져옵니다.
- timeout 시 하위 항목이 tool 호출까지만 진행된 경우, 알림은 원시 tool 출력을 재생하는 대신 해당 이력을 짧은 부분 진행 요약으로 축약할 수 있습니다.

알림 페이로드에는 마지막에 통계 줄이 포함됩니다(래핑된 경우에도 포함).

- Runtime(예: `runtime 5m12s`)
- 토큰 사용량(input/output/total)
- 모델 가격이 구성된 경우 추정 비용(`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId`, transcript 경로(메인 에이전트가 `sessions_history`로 이력을 가져오거나 디스크의 파일을 직접 확인할 수 있도록)
- 내부 메타데이터는 오케스트레이션 전용입니다. 사용자 대상 응답은 일반 assistant 목소리로 다시 작성해야 합니다.

`sessions_history`는 더 안전한 오케스트레이션 경로입니다.

- assistant 회상은 먼저 정규화됩니다.
  - thinking 태그는 제거됩니다.
  - `<relevant-memories>` / `<relevant_memories>` 스캐폴딩 블록은 제거됩니다.
  - `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` 같은 일반 텍스트 tool-call XML 페이로드 블록은 제거되며, 정상적으로 닫히지 않은 잘린 페이로드도 포함됩니다.
  - 다운그레이드된 tool-call/result 스캐폴딩과 historical-context 마커는 제거됩니다.
  - `<|assistant|>` 같은 유출된 모델 제어 토큰, 기타 ASCII `<|...|>` 토큰, 전각 `<｜...｜>` 변형은 제거됩니다.
  - 잘못된 MiniMax tool-call XML은 제거됩니다.
- credential/token과 유사한 텍스트는 마스킹됩니다.
- 긴 블록은 잘릴 수 있습니다.
- 매우 큰 이력은 오래된 행이 제거되거나, 지나치게 큰 행이 `[sessions_history omitted: message too large]`로 대체될 수 있습니다.
- 바이트 단위로 정확한 전체 transcript가 필요하면 원시 디스크 transcript 확인이 폴백입니다.

## 도구 정책(서브 에이전트 도구)

기본적으로 서브 에이전트는 세션 도구와 시스템 도구를 제외한 **모든 도구**를 받습니다.

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

여기서도 `sessions_history`는 제한되고 정제된 회상 보기로 유지되며, 원시 transcript 덤프가 아닙니다.

`maxSpawnDepth >= 2`인 경우, depth-1 오케스트레이터 서브 에이전트는 자신의 하위 항목을 관리할 수 있도록 추가로 `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`를 받습니다.

구성으로 재정의할 수 있습니다.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny가 우선
        deny: ["gateway", "cron"],
        // allow가 설정되면 allow 전용이 됨(그래도 deny가 우선)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## 동시성

서브 에이전트는 전용 인프로세스 큐 lane을 사용합니다.

- lane 이름: `subagent`
- 동시성: `agents.defaults.subagents.maxConcurrent`(기본값 `8`)

## 중지

- 요청자 채팅에서 `/stop`을 보내면 요청자 세션이 중단되고, 그 세션에서 생성된 모든 활성 서브 에이전트 실행이 중지되며, 중첩된 하위 항목까지 연쇄 적용됩니다.
- `/subagents kill <id>`는 특정 서브 에이전트를 중지하며, 그 하위 항목에도 연쇄 적용됩니다.

## 제한 사항

- 서브 에이전트 알림은 **best-effort**입니다. 게이트웨이가 재시작되면 대기 중인 "다시 알리기" 작업은 손실됩니다.
- 서브 에이전트는 여전히 같은 게이트웨이 프로세스 리소스를 공유하므로, `maxConcurrent`를 안전장치로 취급해야 합니다.
- `sessions_spawn`은 항상 논블로킹입니다. 즉시 `{ status: "accepted", runId, childSessionKey }`를 반환합니다.
- 서브 에이전트 컨텍스트에는 `AGENTS.md` + `TOOLS.md`만 주입됩니다(`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`는 없음).
- 최대 중첩 깊이는 5입니다(`maxSpawnDepth` 범위: 1–5). 대부분의 사용 사례에는 depth 2를 권장합니다.
- `maxChildrenPerAgent`는 세션당 활성 하위 항목 수를 제한합니다(기본값: 5, 범위: 1–20).
