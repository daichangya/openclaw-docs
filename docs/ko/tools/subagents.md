---
read_when:
    - 에이전트를 통해 백그라운드/병렬 작업을 원합니다
    - '`sessions_spawn` 또는 하위 에이전트 도구 정책을 변경하고 있습니다'
    - 스레드 바인딩된 하위 에이전트 세션을 구현하거나 문제를 해결하고 있습니다
summary: '하위 에이전트: 격리된 에이전트 실행을 생성하고 결과를 요청자 채팅에 다시 알리기'
title: 하위 에이전트
x-i18n:
    generated_at: "2026-04-24T06:41:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23202b1761e372e547b02183cb68056043aed04b5620db8b222cbfc7e6cd97ab
    source_path: tools/subagents.md
    workflow: 15
---

하위 에이전트는 기존 에이전트 실행에서 생성되는 백그라운드 에이전트 실행입니다. 이들은 자체 세션(`agent:<agentId>:subagent:<uuid>`)에서 실행되며, 완료되면 결과를 요청자 채팅 채널에 다시 **announce**합니다. 각 하위 에이전트 실행은 [백그라운드 작업](/ko/automation/tasks)으로 추적됩니다.

## 슬래시 명령

현재 세션의 하위 에이전트 실행을 확인하거나 제어하려면 `/subagents`를 사용하세요:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

스레드 바인딩 제어:

이 명령은 영속적인 스레드 바인딩을 지원하는 채널에서 동작합니다. 아래의 **스레드를 지원하는 채널**을 참조하세요.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info`는 실행 메타데이터(상태, 타임스탬프, 세션 id, transcript 경로, cleanup)를 표시합니다.
제한되고 안전 필터링된 회상 보기에는 `sessions_history`를 사용하고,
원시 전체 transcript가 필요하면 디스크의 transcript 경로를 확인하세요.

### 생성 동작

`/subagents spawn`은 내부 relay가 아니라 사용자 명령으로 백그라운드 하위 에이전트를 시작하며, 실행이 끝나면 요청자 채팅으로 하나의 최종 완료 업데이트를 보냅니다.

- spawn 명령은 논블로킹이며, 즉시 실행 id를 반환합니다.
- 완료 시 하위 에이전트는 요청자 채팅 채널에 요약/결과 메시지를 announce합니다.
- 완료는 푸시 기반입니다. 한 번 생성되면 완료를 기다리기 위해 `/subagents list`,
  `sessions_list`, `sessions_history`를 루프로 폴링하지 마세요.
  상태 확인은 디버깅이나 개입이 필요할 때만 요청 시 수행하세요.
- 완료 시 OpenClaw는 announce cleanup 흐름이 계속되기 전에 해당 하위 에이전트 세션이 연 추적된 브라우저 탭/프로세스를 best-effort로 닫습니다.
- 수동 생성의 경우 전달은 복원력이 있습니다:
  - OpenClaw는 먼저 안정적인 idempotency 키로 직접 `agent` 전달을 시도합니다.
  - 직접 전달이 실패하면 큐 라우팅으로 폴백합니다.
  - 큐 라우팅도 여전히 사용할 수 없으면 최종 포기 전 짧은 지수 백오프로 announce를 재시도합니다.
- 완료 전달은 확인된 요청자 라우트를 유지합니다:
  - 사용 가능한 경우 스레드 바인딩 또는 대화 바인딩 완료 라우트가 우선합니다
  - 완료 원점이 채널만 제공하면 OpenClaw는 요청자 세션의 확인된 라우트(`lastChannel` / `lastTo` / `lastAccountId`)에서 누락된 target/account를 채워 직접 전달이 계속 동작하게 합니다
- 요청자 세션으로의 완료 handoff는 런타임에서 생성된 내부 컨텍스트(사용자가 작성한 텍스트 아님)이며 다음을 포함합니다:
  - `Result` (가장 최근에 보인 `assistant` 응답 텍스트, 없으면 정제된 최신 tool/toolResult 텍스트; 최종 실패 실행은 캡처된 응답 텍스트를 재사용하지 않음)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - 간결한 런타임/토큰 통계
  - 요청자 에이전트가 원시 내부 메타데이터를 그대로 전달하지 않고 일반 어시스턴트 음성으로 다시 쓰도록 지시하는 전달 지침
- `--model`과 `--thinking`은 해당 실행에 대해서만 기본값을 재정의합니다.
- 완료 후 세부 정보와 출력을 확인하려면 `info`/`log`를 사용하세요.
- `/subagents spawn`은 원샷 모드(`mode: "run"`)입니다. 영속적인 스레드 바인딩 세션에는 `thread: true` 및 `mode: "session"`과 함께 `sessions_spawn`을 사용하세요.
- ACP 하네스 세션(Codex, Claude Code, Gemini CLI)에는 `runtime: "acp"`와 함께 `sessions_spawn`을 사용하고, 완료나 에이전트 간 루프를 디버깅할 때는 특히 [ACP 에이전트](/ko/tools/acp-agents)의 [ACP 전달 모델](/ko/tools/acp-agents#delivery-model)을 참조하세요.

주요 목표:

- 메인 실행을 막지 않고 "리서치 / 장기 작업 / 느린 도구" 작업을 병렬화
- 하위 에이전트를 기본적으로 격리 상태로 유지(세션 분리 + 선택적 샌드박싱)
- 도구 표면을 오용하기 어렵게 유지: 하위 에이전트는 기본적으로 세션 도구를 갖지 않음
- 오케스트레이터 패턴을 위한 구성 가능한 중첩 깊이 지원

비용 참고: 각 하위 에이전트는 기본적으로 **자체** 컨텍스트와 토큰 사용량을 가집니다. 무겁거나
반복적인 작업의 경우, 하위 에이전트에는 더 저렴한 모델을 설정하고 메인 에이전트는
더 높은 품질의 모델에 두세요. 이는 `agents.defaults.subagents.model` 또는 에이전트별
재정의로 구성할 수 있습니다. 자식이 정말로 요청자의 현재 transcript를 필요로 할 때는
해당 spawn에 `context: "fork"`를 요청할 수 있습니다.

## 도구

`sessions_spawn` 사용:

- 하위 에이전트 실행 시작 (`deliver: false`, 전역 lane: `subagent`)
- 그런 다음 announce 단계를 실행하고 요청자 채팅 채널에 announce 응답 게시
- 기본 모델: `agents.defaults.subagents.model`(또는 에이전트별 `agents.list[].subagents.model`)을 설정하지 않으면 호출자를 상속; 명시적인 `sessions_spawn.model`이 여전히 우선
- 기본 thinking: `agents.defaults.subagents.thinking`(또는 에이전트별 `agents.list[].subagents.thinking`)을 설정하지 않으면 호출자를 상속; 명시적인 `sessions_spawn.thinking`이 여전히 우선
- 기본 실행 timeout: `sessions_spawn.runTimeoutSeconds`가 생략되면 OpenClaw는 설정된 경우 `agents.defaults.subagents.runTimeoutSeconds`를 사용하고, 그렇지 않으면 `0`(timeout 없음)으로 폴백

도구 매개변수:

- `task` (필수)
- `label?` (선택 사항)
- `agentId?` (선택 사항; 허용되면 다른 에이전트 id 아래에서 생성)
- `model?` (선택 사항; 하위 에이전트 모델 재정의; 유효하지 않은 값은 건너뛰고 하위 에이전트는 도구 결과의 경고와 함께 기본 모델로 실행됨)
- `thinking?` (선택 사항; 하위 에이전트 실행의 thinking 수준 재정의)
- `runTimeoutSeconds?` (설정된 경우 기본값은 `agents.defaults.subagents.runTimeoutSeconds`, 아니면 `0`; 설정하면 N초 후 하위 에이전트 실행 중단)
- `thread?` (기본값 `false`; `true`이면 이 하위 에이전트 세션에 대한 채널 스레드 바인딩 요청)
- `mode?` (`run|session`)
  - 기본값은 `run`
  - `thread: true`이고 `mode`를 생략하면 기본값이 `session`이 됨
  - `mode: "session"`은 `thread: true`가 필요
- `cleanup?` (`delete|keep`, 기본값 `keep`)
- `sandbox?` (`inherit|require`, 기본값 `inherit`; `require`는 대상 자식 런타임이 샌드박스 상태가 아니면 생성을 거부)
- `context?` (`isolated|fork`, 기본값 `isolated`; 네이티브 하위 에이전트 전용)
  - `isolated`는 깨끗한 자식 transcript를 만들며 기본값입니다.
  - `fork`는 요청자의 현재 transcript를 자식 세션으로 분기하므로 자식이 동일한 대화 컨텍스트로 시작합니다.
  - 자식이 현재 transcript를 필요로 할 때만 `fork`를 사용하세요. 범위가 제한된 작업에는 `context`를 생략하세요.
- `sessions_spawn`은 채널 전달 매개변수(`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`)를 받지 **않습니다**. 전달에는 생성된 실행에서 `message`/`sessions_send`를 사용하세요.

## 스레드 바인딩 세션

채널에서 스레드 바인딩이 활성화되면, 하위 에이전트는 스레드에 바인딩된 상태를 유지할 수 있으므로 해당 스레드의 후속 사용자 메시지가 계속 같은 하위 에이전트 세션으로 라우팅됩니다.

### 스레드를 지원하는 채널

- Discord(현재 유일한 지원 채널): 영속적인 스레드 바인딩 하위 에이전트 세션(`thread: true`와 함께 `sessions_spawn`), 수동 스레드 제어(` /focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), 어댑터 키 `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`, `channels.discord.threadBindings.spawnSubagentSessions`를 지원합니다.

빠른 흐름:

1. `thread: true`(선택적으로 `mode: "session"`도 포함)로 `sessions_spawn`을 사용해 생성합니다.
2. OpenClaw는 활성 채널에서 해당 세션 대상에 스레드를 생성하거나 바인딩합니다.
3. 해당 스레드의 응답과 후속 메시지는 바인딩된 세션으로 라우팅됩니다.
4. 비활동 자동 unfocus를 확인/업데이트하려면 `/session idle`을, 하드 캡을 제어하려면 `/session max-age`를 사용하세요.
5. 수동으로 분리하려면 `/unfocus`를 사용하세요.

수동 제어:

- `/focus <target>`은 현재 스레드를 하위 에이전트/세션 대상에 바인딩합니다(또는 생성).
- `/unfocus`는 현재 바인딩된 스레드의 바인딩을 제거합니다.
- `/agents`는 활성 실행과 바인딩 상태(`thread:<id>` 또는 `unbound`)를 나열합니다.
- `/session idle` 및 `/session max-age`는 focus된 바인딩 스레드에서만 동작합니다.

구성 스위치:

- 전역 기본값: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- 채널 재정의와 spawn 자동 바인딩 키는 어댑터별입니다. 위의 **스레드를 지원하는 채널**을 참조하세요.

현재 어댑터 세부 사항은 [구성 참조](/ko/gateway/configuration-reference)와 [슬래시 명령](/ko/tools/slash-commands)을 참조하세요.

allowlist:

- `agents.list[].subagents.allowAgents`: `agentId`를 통해 대상으로 지정할 수 있는 에이전트 id 목록 (`["*"]`면 모두 허용). 기본값: 요청자 에이전트만.
- `agents.defaults.subagents.allowAgents`: 요청자 에이전트가 자체 `subagents.allowAgents`를 설정하지 않은 경우 사용되는 기본 대상 에이전트 allowlist.
- 샌드박스 상속 가드: 요청자 세션이 샌드박스 상태이면 `sessions_spawn`은 샌드박스 없이 실행될 대상을 거부합니다.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: true이면 `agentId`를 생략한 `sessions_spawn` 호출을 차단합니다(명시적 프로필 선택 강제). 기본값: false.

탐색:

- 현재 `sessions_spawn`에 허용된 에이전트 id를 보려면 `agents_list`를 사용하세요.

자동 아카이브:

- 하위 에이전트 세션은 `agents.defaults.subagents.archiveAfterMinutes` 후 자동으로 아카이브됩니다(기본값: 60).
- 아카이브는 `sessions.delete`를 사용하며 transcript 이름을 `*.deleted.<timestamp>`로 바꿉니다(같은 폴더).
- `cleanup: "delete"`는 announce 직후 즉시 아카이브합니다(그래도 transcript는 이름 변경으로 유지됨).
- 자동 아카이브는 best-effort이며, Gateway가 재시작되면 대기 중 타이머는 손실됩니다.
- `runTimeoutSeconds`는 자동 아카이브를 수행하지 않으며, 실행만 중지합니다. 세션은 자동 아카이브 전까지 유지됩니다.
- 자동 아카이브는 depth-1 및 depth-2 세션에 동일하게 적용됩니다.
- 브라우저 cleanup은 아카이브 cleanup과 별개입니다. transcript/세션 레코드가 유지되더라도 추적된 브라우저 탭/프로세스는 실행 완료 시 best-effort로 닫힙니다.

## 중첩 하위 에이전트

기본적으로 하위 에이전트는 자신의 하위 에이전트를 생성할 수 없습니다(`maxSpawnDepth: 1`). `maxSpawnDepth: 2`를 설정하면 한 단계의 중첩을 활성화할 수 있으며, 이는 **오케스트레이터 패턴**을 허용합니다: main → 오케스트레이터 하위 에이전트 → 작업자 하위-하위 에이전트.

### 활성화 방법

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 하위 에이전트가 자식을 생성하도록 허용(기본값: 1)
        maxChildrenPerAgent: 5, // 에이전트 세션당 최대 활성 자식 수(기본값: 5)
        maxConcurrent: 8, // 전역 동시성 lane 상한(기본값: 8)
        runTimeoutSeconds: 900, // sessions_spawn 생략 시 기본 timeout (0 = timeout 없음)
      },
    },
  },
}
```

### 깊이 수준

| 깊이 | 세션 키 형태                                 | 역할                                            | 생성 가능 여부                |
| ---- | -------------------------------------------- | ----------------------------------------------- | ----------------------------- |
| 0    | `agent:<id>:main`                            | 메인 에이전트                                   | 항상 가능                     |
| 1    | `agent:<id>:subagent:<uuid>`                 | 하위 에이전트 (`depth 2` 허용 시 오케스트레이터) | `maxSpawnDepth >= 2`일 때만 |
| 2    | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 하위-하위 에이전트(말단 작업자)                  | 절대 불가                     |

### announce 체인

결과는 체인을 따라 위로 흐릅니다:

1. depth-2 작업자가 완료 → 부모(depth-1 오케스트레이터)에게 announce
2. depth-1 오케스트레이터가 announce를 수신하고 결과를 종합한 뒤 완료 → main에 announce
3. 메인 에이전트가 announce를 수신하고 사용자에게 전달

각 수준은 자신의 직접 자식으로부터의 announce만 볼 수 있습니다.

운영 지침:

- `sessions_list`, `sessions_history`, `/subagents list`, 또는
  `exec` sleep 명령을 중심으로 폴링 루프를 만들지 말고, 자식 작업은 한 번 시작한 뒤 완료 이벤트를 기다리세요.
- 최종 답변을 이미 보낸 뒤 자식 완료 이벤트가 도착하면,
  올바른 후속 응답은 정확한 무응답 토큰 `NO_REPLY` / `no_reply`입니다.

### 깊이별 도구 정책

- 역할과 제어 범위는 생성 시점에 세션 메타데이터에 기록됩니다. 이렇게 하면 평탄화되거나 복원된 세션 키가 실수로 오케스트레이터 권한을 되찾지 않게 됩니다.
- **Depth 1 (오케스트레이터, `maxSpawnDepth >= 2`일 때)**: 자식을 관리할 수 있도록 `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`를 받습니다. 다른 세션/시스템 도구는 계속 거부됩니다.
- **Depth 1 (리프, `maxSpawnDepth == 1`일 때)**: 세션 도구 없음(현재 기본 동작).
- **Depth 2 (리프 작업자)**: 세션 도구 없음 — depth 2에서는 `sessions_spawn`이 항상 거부됩니다. 더 이상의 자식을 생성할 수 없습니다.

### 에이전트별 생성 한도

각 에이전트 세션(어느 깊이든)은 한 번에 최대 `maxChildrenPerAgent`(기본값: 5)개의 활성 자식을 가질 수 있습니다. 이는 단일 오케스트레이터에서 제어되지 않는 fan-out을 방지합니다.

### 연쇄 중지

depth-1 오케스트레이터를 중지하면 모든 depth-2 자식도 자동으로 중지됩니다:

- 메인 채팅에서 `/stop`을 보내면 모든 depth-1 에이전트가 중지되고 그 depth-2 자식까지 연쇄 중지됩니다.
- `/subagents kill <id>`는 특정 하위 에이전트를 중지하고 그 자식까지 연쇄 중지합니다.
- `/subagents kill all`은 요청자의 모든 하위 에이전트를 중지하고 연쇄 중지합니다.

## 인증

하위 에이전트 인증은 세션 유형이 아니라 **에이전트 id**로 확인됩니다:

- 하위 에이전트 세션 키는 `agent:<agentId>:subagent:<uuid>`입니다.
- 인증 저장소는 해당 에이전트의 `agentDir`에서 로드됩니다.
- 메인 에이전트의 인증 프로필은 **폴백**으로 병합되며, 충돌 시 에이전트 프로필이 메인 프로필보다 우선합니다.

참고: 병합은 additive이므로 메인 프로필은 항상 폴백으로 사용 가능합니다. 에이전트별로 완전히 격리된 인증은 아직 지원되지 않습니다.

## Announce

하위 에이전트는 announce 단계를 통해 다시 보고합니다:

- announce 단계는 요청자 세션이 아니라 하위 에이전트 세션 내부에서 실행됩니다.
- 하위 에이전트가 정확히 `ANNOUNCE_SKIP`로 응답하면 아무것도 게시되지 않습니다.
- 가장 최근 assistant 텍스트가 정확한 무응답 토큰 `NO_REPLY` / `no_reply`이면,
  이전에 보이는 진행 상황이 있었더라도 announce 출력은 억제됩니다.
- 그 외의 경우 전달은 요청자 깊이에 따라 달라집니다:
  - 최상위 요청자 세션은 외부 전달이 있는 후속 `agent` 호출을 사용합니다(`deliver=true`)
  - 중첩된 요청자 하위 에이전트 세션은 오케스트레이터가 세션 안에서 자식 결과를 종합할 수 있도록 내부 후속 주입을 받습니다(`deliver=false`)
  - 중첩된 요청자 하위 에이전트 세션이 사라졌으면, 가능한 경우 OpenClaw는 해당 세션의 요청자로 폴백합니다
- 최상위 요청자 세션의 경우, completion 모드 직접 전달은 먼저 모든 바인딩된 대화/스레드 라우트와 hook 재정의를 확인한 다음, 요청자 세션에 저장된 라우트에서 누락된 채널 대상 필드를 채웁니다. 이렇게 하면 완료 원점이 채널만 식별하더라도 완료가 올바른 채팅/토픽으로 유지됩니다.
- 중첩 완료 결과를 만들 때 자식 완료 집계는 현재 요청자 실행 범위로 제한되어, 이전 실행의 오래된 자식 출력이 현재 announce로 새어 들어가지 않게 합니다.
- announce 응답은 채널 어댑터에서 사용 가능한 경우 스레드/토픽 라우팅을 유지합니다.
- announce 컨텍스트는 안정적인 내부 이벤트 블록으로 정규화됩니다:
  - 소스 (`subagent` 또는 `cron`)
  - 자식 세션 키/id
  - announce 유형 + 작업 레이블
  - 런타임 결과(`success`, `error`, `timeout`, 또는 `unknown`)에서 도출된 상태 줄
  - 가장 최근에 보인 assistant 텍스트에서 선택한 결과 콘텐츠, 없으면 정제된 최신 tool/toolResult 텍스트; 최종 실패 실행은 캡처된 응답 텍스트를 재생하지 않고 실패 상태를 보고
  - 응답해야 할지 무응답을 유지해야 할지 설명하는 후속 지침
- `Status`는 모델 출력에서 추론되지 않으며, 런타임 결과 신호에서 나옵니다.
- timeout 시, 자식이 tool 호출까지만 진행했다면 announce는 원시 tool 출력을 재생하는 대신 그 기록을 짧은 부분 진행 요약으로 축약할 수 있습니다.

announce payload는 끝에 통계 줄을 포함합니다(래핑된 경우에도 동일):

- Runtime (예: `runtime 5m12s`)
- 토큰 사용량 (입력/출력/총합)
- 모델 가격 구성이 되어 있으면 예상 비용 (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId`, transcript 경로(메인 에이전트가 `sessions_history`로 기록을 가져오거나 디스크의 파일을 검사할 수 있도록)
- 내부 메타데이터는 오케스트레이션 전용이며, 사용자 대상 응답은 일반 어시스턴트 음성으로 다시 작성해야 합니다.

`sessions_history`는 더 안전한 오케스트레이션 경로입니다:

- assistant recall이 먼저 정규화됩니다:
  - thinking 태그 제거
  - `<relevant-memories>` / `<relevant_memories>` 스캐폴딩 블록 제거
  - `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` 같은 일반 텍스트 tool-call XML payload 블록 제거,
    깔끔하게 닫히지 않는 잘린 payload도 포함
  - 강등된 tool-call/result 스캐폴딩과 historical-context 마커 제거
  - `<|assistant|>` 같은 누출된 모델 제어 토큰, 기타 ASCII
    `<|...|>` 토큰, 전체 폭 변형 `<｜...｜>` 제거
  - 잘못된 형식의 MiniMax tool-call XML 제거
- 자격 증명/토큰 유사 텍스트는 redaction 처리
- 긴 블록은 잘릴 수 있음
- 매우 큰 기록은 오래된 행을 제거하거나 너무 큰 행을
  `[sessions_history omitted: message too large]`로 대체할 수 있음
- 바이트 단위로 완전한 transcript가 필요하면 원시 디스크 transcript 검사가 폴백 경로입니다

## 도구 정책 (하위 에이전트 도구)

기본적으로 하위 에이전트는 **세션 도구**와 시스템 도구를 제외한 **모든 도구**를 받습니다:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

여기서도 `sessions_history`는 제한되고 정제된 recall 보기이며,
원시 transcript 덤프가 아닙니다.

`maxSpawnDepth >= 2`일 때 depth-1 오케스트레이터 하위 에이전트는 자식을 관리할 수 있도록 `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`를 추가로 받습니다.

구성으로 재정의:

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
        // allow가 설정되면 allow-only가 됨 (그래도 deny가 우선)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## 동시성

하위 에이전트는 전용 인프로세스 큐 lane을 사용합니다:

- Lane 이름: `subagent`
- 동시성: `agents.defaults.subagents.maxConcurrent` (기본값 `8`)

## 중지

- 요청자 채팅에서 `/stop`을 보내면 요청자 세션이 중단되고, 그 세션에서 생성된 활성 하위 에이전트 실행도 중지되며, 중첩 자식에게까지 연쇄 중지됩니다.
- `/subagents kill <id>`는 특정 하위 에이전트를 중지하고 그 자식에게까지 연쇄 중지합니다.

## 제한 사항

- 하위 에이전트 announce는 **best-effort**입니다. Gateway가 재시작되면 대기 중인 "announce back" 작업은 손실됩니다.
- 하위 에이전트는 여전히 동일한 Gateway 프로세스 자원을 공유하므로, `maxConcurrent`는 안전 밸브로 취급하세요.
- `sessions_spawn`은 항상 논블로킹입니다: 즉시 `{ status: "accepted", runId, childSessionKey }`를 반환합니다.
- 하위 에이전트 컨텍스트는 `AGENTS.md` + `TOOLS.md`만 주입합니다(`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`는 없음).
- 최대 중첩 깊이는 5입니다(`maxSpawnDepth` 범위: 1–5). 대부분의 사용 사례에는 depth 2가 권장됩니다.
- `maxChildrenPerAgent`는 세션당 활성 자식 수를 제한합니다(기본값: 5, 범위: 1–20).

## 관련

- [ACP 에이전트](/ko/tools/acp-agents)
- [다중 에이전트 샌드박스 도구](/ko/tools/multi-agent-sandbox-tools)
- [에이전트 전송](/ko/tools/agent-send)
