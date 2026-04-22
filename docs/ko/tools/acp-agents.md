---
read_when:
    - ACP를 통해 코딩 harness 실행하기
    - 메시징 채널에서 대화에 바인딩된 ACP 세션 설정하기
    - 메시지 채널 대화를 영구적인 ACP 세션에 바인딩하기
    - ACP 백엔드 및 Plugin 연결 문제 해결하기
    - ACP 완료 전송 또는 agent 간 루프 디버깅하기
    - 채팅에서 /acp 명령 운영하기
summary: Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP 및 기타 harness agent에 ACP 런타임 세션 사용하기
title: ACP 에이전트
x-i18n:
    generated_at: "2026-04-22T04:27:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71ae74200cb7581a68c4593fd7e510378267daaf7acbcd7667cde56335ebadea
    source_path: tools/acp-agents.md
    workflow: 15
---

ACP bound 세션의 재정의 우선순위:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. 전역 ACP 기본값(예: `acp.backend`)

예시:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

동작:

- OpenClaw는 사용 전에 구성된 ACP 세션이 존재하도록 보장합니다.
- 해당 채널 또는 topic의 메시지는 구성된 ACP 세션으로 라우팅됩니다.
- 바인딩된 대화에서는 `/new`와 `/reset`이 같은 ACP 세션 키를 제자리에서 재설정합니다.
- 임시 런타임 바인딩(예: thread-focus 흐름에서 생성된 것)은 존재하는 경우 계속 적용됩니다.
- 명시적인 `cwd` 없이 agent 간 ACP spawn을 수행하면, OpenClaw는 agent config에서 대상 agent 워크스페이스를 상속합니다.
- 상속된 워크스페이스 경로가 없으면 백엔드 기본 cwd로 대체되며, 실제 접근 실패는 spawn 오류로 표시됩니다.

## ACP 세션 시작(인터페이스)

### `sessions_spawn`에서

agent 턴 또는 tool call에서 ACP 세션을 시작하려면 `runtime: "acp"`를 사용하세요.

```json
{
  "task": "저장소를 열고 실패하는 테스트를 요약해 줘",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

참고:

- `runtime`의 기본값은 `subagent`이므로, ACP 세션에는 `runtime: "acp"`를 명시적으로 설정하세요.
- `agentId`를 생략하면, 구성된 경우 OpenClaw는 `acp.defaultAgent`를 사용합니다.
- `mode: "session"`은 영구적인 바인딩 대화를 유지하려면 `thread: true`가 필요합니다.

인터페이스 세부 정보:

- `task`(필수): ACP 세션에 전송되는 초기 프롬프트.
- `runtime`(ACP에 필수): 반드시 `"acp"`여야 합니다.
- `agentId`(선택 사항): ACP 대상 harness ID. 설정된 경우 `acp.defaultAgent`로 대체됩니다.
- `thread`(선택 사항, 기본값 `false`): 지원되는 경우 thread 바인딩 흐름 요청.
- `mode`(선택 사항): `run`(일회성) 또는 `session`(영구적).
  - 기본값은 `run`
  - `thread: true`이고 mode가 생략되면, OpenClaw는 런타임 경로에 따라 기본적으로 persistent 동작을 선택할 수 있습니다
  - `mode: "session"`은 `thread: true`가 필요합니다
- `cwd`(선택 사항): 요청된 런타임 작업 디렉터리(백엔드/런타임 정책에 따라 검증됨). 생략하면 ACP spawn은 구성된 경우 대상 agent 워크스페이스를 상속합니다. 상속된 경로가 없으면 백엔드 기본값으로 대체되며, 실제 접근 오류는 그대로 반환됩니다.
- `label`(선택 사항): 세션/배너 텍스트에 사용되는 운영자용 레이블.
- `resumeSessionId`(선택 사항): 새 세션을 만드는 대신 기존 ACP 세션을 재개합니다. agent는 `session/load`를 통해 대화 기록을 다시 재생합니다. `runtime: "acp"`가 필요합니다.
- `streamTo`(선택 사항): `"parent"`는 초기 ACP 실행 진행 요약을 시스템 event로 요청자 세션에 다시 스트리밍합니다.
  - 가능한 경우, 수락된 응답에는 전체 relay 기록을 tail할 수 있는 세션 범위 JSONL 로그(`<sessionId>.acp-stream.jsonl`)를 가리키는 `streamLogPath`가 포함됩니다.

## 전달 모델

ACP 세션은 대화형 워크스페이스일 수도 있고 부모 소유의 백그라운드 작업일 수도 있습니다. 전달 경로는 그 형태에 따라 달라집니다.

### 대화형 ACP 세션

대화형 세션은 보이는 채팅 표면에서 계속 대화하기 위한 것입니다:

- `/acp spawn ... --bind here`는 현재 대화를 ACP 세션에 바인딩합니다.
- `/acp spawn ... --thread ...`는 채널 thread/topic을 ACP 세션에 바인딩합니다.
- 영구적으로 구성된 `bindings[].type="acp"`는 일치하는 대화를 같은 ACP 세션으로 라우팅합니다.

바인딩된 대화의 후속 메시지는 해당 ACP 세션으로 직접 라우팅되며, ACP 출력은 동일한 채널/thread/topic으로 다시 전달됩니다.

### 부모 소유 일회성 ACP 세션

다른 agent 실행에 의해 생성된 일회성 ACP 세션은 sub-agent와 비슷한 백그라운드 자식으로 실행됩니다:

- 부모가 `sessions_spawn({ runtime: "acp", mode: "run" })`로 작업을 요청합니다.
- 자식은 자체 ACP harness 세션에서 실행됩니다.
- 완료는 내부 task-completion announce 경로를 통해 보고됩니다.
- 사용자에게 보여줄 응답이 유용할 때 부모는 자식 결과를 일반 assistant 음성으로 다시 작성합니다.

이 경로를 부모와 자식 간의 peer-to-peer 채팅으로 취급하지 마세요. 자식은 이미 부모로 되돌아가는 완료 채널을 가지고 있습니다.

### `sessions_send`와 A2A 전달

`sessions_send`는 spawn 후 다른 세션을 대상으로 할 수 있습니다. 일반 peer 세션의 경우, OpenClaw는 메시지를 주입한 후 agent-to-agent(A2A) 후속 경로를 사용합니다:

- 대상 세션의 응답을 기다림
- 선택적으로 요청자와 대상이 제한된 횟수의 후속 턴을 교환하도록 허용
- 대상에게 announce 메시지 생성을 요청
- 해당 announce를 보이는 채널 또는 thread에 전달

이 A2A 경로는 발신자가 보이는 후속 응답이 필요한 peer 전송을 위한 대체 경로입니다. 예를 들어 넓은 `tools.sessions.visibility` 설정 아래에서 관련 없는 세션이 ACP 대상 세션을 보고 메시지를 보낼 수 있는 경우처럼, 이 경로는 계속 활성화됩니다.

OpenClaw는 요청자가 부모 소유의 일회성 ACP 자식의 부모인 경우에만 A2A 후속 경로를 건너뜁니다. 이 경우 task completion 위에 A2A를 추가로 실행하면 자식 결과로 부모를 깨우고, 부모의 응답을 다시 자식에게 전달해 부모/자식 echo 루프를 만들 수 있습니다. `sessions_send` 결과는 소유된 자식의 경우 `delivery.status="skipped"`를 보고합니다. 완료 경로가 이미 그 결과를 담당하기 때문입니다.

### 기존 세션 재개

새로 시작하는 대신 이전 ACP 세션을 계속하려면 `resumeSessionId`를 사용하세요. agent는 `session/load`를 통해 대화 기록을 다시 재생하므로, 이전 문맥을 모두 유지한 채 이어서 작업합니다.

```json
{
  "task": "중단한 지점부터 계속해 — 남은 테스트 실패를 수정해",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

일반적인 사용 사례:

- 노트북에서 휴대폰으로 Codex 세션을 넘기기 — agent에게 중단한 지점부터 이어서 하라고 지시
- CLI에서 대화형으로 시작한 코딩 세션을 이제 agent를 통해 headless 방식으로 계속하기
- gateway 재시작이나 idle timeout으로 중단된 작업 다시 이어가기

참고:

- `resumeSessionId`는 `runtime: "acp"`가 필요합니다 — sub-agent 런타임과 함께 사용하면 오류를 반환합니다.
- `resumeSessionId`는 업스트림 ACP 대화 기록을 복원합니다. `thread`와 `mode`는 여전히 새로 생성하는 OpenClaw 세션에 정상적으로 적용되므로, `mode: "session"`에는 여전히 `thread: true`가 필요합니다.
- 대상 agent는 `session/load`를 지원해야 합니다(Codex와 Claude Code는 지원함).
- 세션 ID를 찾을 수 없으면 spawn은 명확한 오류와 함께 실패합니다 — 새 세션으로 조용히 대체되지 않습니다.

### 운영자 smoke test

gateway 배포 후 ACP spawn이
단순히 단위 테스트를 통과하는 수준이 아니라 실제로 종단 간 동작하는지 빠르게 실시간으로 확인하고 싶을 때 사용하세요.

권장 게이트:

1. 대상 호스트에서 배포된 gateway 버전/커밋을 확인합니다.
2. 배포된 소스에 `src/gateway/sessions-patch.ts`의 ACP 계보 허용
   (`subagent:* or acp:* sessions`)이 포함되어 있는지 확인합니다.
3. 실제 agent(예:
   `jpclawhq`의 `razor(main)`)에 임시 ACPX bridge 세션을 엽니다.
4. 해당 agent에게 다음으로 `sessions_spawn`을 호출하도록 요청합니다:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. agent가 다음을 보고하는지 확인합니다:
   - `accepted=yes`
   - 실제 `childSessionKey`
   - validator 오류 없음
6. 임시 ACPX bridge 세션을 정리합니다.

실시간 agent에 보낼 예시 프롬프트:

```text
지금 sessions_spawn 도구를 runtime: "acp", agentId: "codex", mode: "run"으로 사용해.
task는 다음으로 설정해: "Reply with exactly LIVE-ACP-SPAWN-OK".
그다음 다음 형식으로만 보고해: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

참고:

- thread에 바인딩된 persistent ACP 세션을 의도적으로 테스트하는 경우가 아니라면,
  이 smoke test는 `mode: "run"`으로 유지하세요.
- 기본 게이트에는 `streamTo: "parent"`를 요구하지 마세요. 이 경로는
  요청자/세션 기능에 의존하며 별도의 통합 검사입니다.
- thread에 바인딩된 `mode: "session"` 테스트는 실제 Discord thread 또는 Telegram topic에서 수행하는
  두 번째, 더 풍부한 통합 패스로 취급하세요.

## Sandbox 호환성

ACP 세션은 현재 OpenClaw sandbox 내부가 아니라 호스트 런타임에서 실행됩니다.

현재 제한 사항:

- 요청자 세션이 sandbox된 경우, `sessions_spawn({ runtime: "acp" })`와 `/acp spawn` 모두에서 ACP spawn이 차단됩니다.
  - 오류: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `runtime: "acp"`를 사용하는 `sessions_spawn`은 `sandbox: "require"`를 지원하지 않습니다.
  - 오류: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

sandbox 강제 실행이 필요하면 `runtime: "subagent"`를 사용하세요.

### `/acp` 명령에서

필요할 때 채팅에서 명시적으로 운영자 제어를 하려면 `/acp spawn`을 사용하세요.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

주요 플래그:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

[Slash Commands](/ko/tools/slash-commands)를 참조하세요.

## 세션 대상 해석

대부분의 `/acp` 동작은 선택적인 세션 대상(`session-key`, `session-id`, 또는 `session-label`)을 받습니다.

해석 순서:

1. 명시적 대상 인수(또는 `/acp steer`의 `--session`)
   - 먼저 key 시도
   - 그다음 UUID 형태의 session id 시도
   - 그다음 label 시도
2. 현재 thread 바인딩(이 대화/thread가 ACP 세션에 바인딩된 경우)
3. 현재 요청자 세션 대체값

현재 대화 바인딩과 thread 바인딩은 모두 2단계에 참여합니다.

대상을 해석할 수 없으면, OpenClaw는 명확한 오류를 반환합니다(`Unable to resolve session target: ...`).

## Spawn bind 모드

`/acp spawn`은 `--bind here|off`를 지원합니다.

| 모드   | 동작                                                              |
| ------ | ----------------------------------------------------------------- |
| `here` | 현재 활성 대화를 제자리에서 바인딩합니다. 활성 대화가 없으면 실패합니다. |
| `off`  | 현재 대화 바인딩을 생성하지 않습니다.                             |

참고:

- `--bind here`는 "이 채널이나 채팅을 Codex 기반으로 만들기" 위한 가장 간단한 운영자 경로입니다.
- `--bind here`는 하위 thread를 생성하지 않습니다.
- `--bind here`는 현재 대화 바인딩 지원을 제공하는 채널에서만 사용할 수 있습니다.
- `--bind`와 `--thread`는 같은 `/acp spawn` 호출에서 함께 사용할 수 없습니다.

## Spawn thread 모드

`/acp spawn`은 `--thread auto|here|off`를 지원합니다.

| 모드   | 동작                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------- |
| `auto` | 활성 thread 안에서는 해당 thread를 바인딩합니다. thread 밖에서는 지원되는 경우 하위 thread를 생성/바인딩합니다. |
| `here` | 현재 활성 thread를 요구합니다. thread 안이 아니면 실패합니다.                                     |
| `off`  | 바인딩하지 않습니다. 세션은 바인딩되지 않은 상태로 시작됩니다.                                     |

참고:

- thread 바인딩이 없는 표면에서는 기본 동작이 사실상 `off`입니다.
- thread 바인딩 spawn에는 채널 정책 지원이 필요합니다:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- 하위 thread를 만들지 않고 현재 대화를 고정하려면 `--bind here`를 사용하세요.

## ACP 제어

사용 가능한 명령 계열:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status`는 유효한 런타임 옵션과, 가능한 경우 런타임 수준 및 백엔드 수준 세션 식별자를 모두 보여줍니다.

일부 제어는 백엔드 기능에 따라 달라집니다. 백엔드가 특정 제어를 지원하지 않으면, OpenClaw는 명확한 unsupported-control 오류를 반환합니다.

## ACP 명령 cookbook

| 명령                 | 동작                                                        | 예시                                                          |
| -------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP 세션 생성, 선택적으로 현재 바인딩 또는 thread 바인딩.   | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 대상 세션의 진행 중인 턴을 취소.                            | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 실행 중인 세션에 조정 지시 전송.                            | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 세션을 닫고 thread 대상 바인딩 해제.                        | `/acp close`                                                  |
| `/acp status`        | 백엔드, 모드, 상태, 런타임 옵션, 기능 표시.                 | `/acp status`                                                 |
| `/acp set-mode`      | 대상 세션의 런타임 모드 설정.                               | `/acp set-mode plan`                                          |
| `/acp set`           | 일반 런타임 config 옵션 쓰기.                               | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 런타임 작업 디렉터리 재정의 설정.                           | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 승인 정책 프로필 설정.                                      | `/acp permissions strict`                                     |
| `/acp timeout`       | 런타임 timeout(초) 설정.                                    | `/acp timeout 120`                                            |
| `/acp model`         | 런타임 모델 재정의 설정.                                    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 세션 런타임 옵션 재정의 제거.                               | `/acp reset-options`                                          |
| `/acp sessions`      | 저장소의 최근 ACP 세션 목록 표시.                           | `/acp sessions`                                               |
| `/acp doctor`        | 백엔드 상태, 기능, 실행 가능한 수정 안내.                   | `/acp doctor`                                                 |
| `/acp install`       | 결정론적 설치 및 활성화 단계 출력.                          | `/acp install`                                                |

`/acp sessions`는 현재 바인딩된 세션 또는 요청자 세션의 저장소를 읽습니다. `session-key`, `session-id`, `session-label` 토큰을 받는 명령은 사용자 지정 agent별 `session.store` 루트를 포함한 gateway 세션 검색을 통해 대상을 해석합니다.

## 런타임 옵션 매핑

`/acp`는 편의 명령과 일반 setter를 제공합니다.

동등한 작업:

- `/acp model <id>`는 런타임 config 키 `model`에 매핑됩니다.
- `/acp permissions <profile>`은 런타임 config 키 `approval_policy`에 매핑됩니다.
- `/acp timeout <seconds>`는 런타임 config 키 `timeout`에 매핑됩니다.
- `/acp cwd <path>`는 런타임 cwd 재정의를 직접 업데이트합니다.
- `/acp set <key> <value>`는 일반 경로입니다.
  - 특수 사례: `key=cwd`는 cwd 재정의 경로를 사용합니다.
- `/acp reset-options`는 대상 세션의 모든 런타임 재정의를 지웁니다.

## acpx harness 지원(현재)

현재 acpx 내장 harness 별칭:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

OpenClaw가 acpx 백엔드를 사용할 때는, acpx config에 사용자 지정 agent 별칭이 정의되어 있지 않다면 `agentId`에 이 값들을 사용하는 것이 좋습니다.
로컬 Cursor 설치가 아직 ACP를 `agent acp`로 노출한다면, 내장 기본값을 변경하지 말고 acpx config에서 `cursor` agent 명령을 재정의하세요.

직접 acpx CLI를 사용할 때는 `--agent <command>`로 임의의 adapter를 대상으로 할 수도 있지만, 이 raw escape hatch는 acpx CLI 기능이지 일반적인 OpenClaw `agentId` 경로가 아닙니다.

## 필수 config

핵심 ACP 기본 구성:

```json5
{
  acp: {
    enabled: true,
    // 선택 사항. 기본값은 true이며, /acp 제어는 유지한 채 ACP dispatch를 일시 중지하려면 false로 설정합니다.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

thread 바인딩 config는 채널 adapter별입니다. Discord 예시:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

thread에 바인딩된 ACP spawn이 동작하지 않으면, 먼저 adapter 기능 플래그를 확인하세요:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

현재 대화 바인딩은 하위 thread 생성을 요구하지 않습니다. 활성 대화 컨텍스트와 ACP 대화 바인딩을 노출하는 채널 adapter가 필요합니다.

[Configuration Reference](/ko/gateway/configuration-reference)를 참조하세요.

## acpx 백엔드용 Plugin 설정

새 설치에는 번들된 `acpx` 런타임 Plugin이 기본적으로 활성화되어 있으므로, ACP는
보통 수동 Plugin 설치 단계 없이 동작합니다.

다음으로 시작하세요:

```text
/acp doctor
```

`acpx`를 비활성화했거나, `plugins.allow` / `plugins.deny`로 차단했거나,
로컬 개발 체크아웃으로 전환하려면 명시적인 Plugin 경로를 사용하세요:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

개발 중 로컬 워크스페이스 설치:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

그런 다음 백엔드 상태를 확인하세요:

```text
/acp doctor
```

### acpx 명령 및 버전 config

기본적으로 번들된 acpx 백엔드 Plugin(`acpx`)은 Plugin 로컬에 고정된 바이너리를 사용합니다:

1. 명령은 기본적으로 ACPX Plugin 패키지 내부의 Plugin 로컬 `node_modules/.bin/acpx`입니다.
2. 예상 버전은 기본적으로 extension pin입니다.
3. 시작 시 ACP 백엔드를 즉시 not-ready 상태로 등록합니다.
4. 백그라운드 ensure 작업이 `acpx --version`을 검증합니다.
5. Plugin 로컬 바이너리가 없거나 버전이 맞지 않으면 다음을 실행합니다:
   `npm install --omit=dev --no-save acpx@<pinned>` 후 다시 검증합니다.

Plugin config에서 명령/버전을 재정의할 수 있습니다:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

참고:

- `command`는 절대 경로, 상대 경로, 또는 명령 이름(`acpx`)을 받을 수 있습니다.
- 상대 경로는 OpenClaw 워크스페이스 디렉터리에서 해석됩니다.
- `expectedVersion: "any"`는 엄격한 버전 일치를 비활성화합니다.
- `command`가 사용자 지정 바이너리/경로를 가리키면 Plugin 로컬 자동 설치는 비활성화됩니다.
- 백엔드 상태 검사가 실행되는 동안에도 OpenClaw 시작은 non-blocking으로 유지됩니다.

[Plugins](/ko/tools/plugin)를 참조하세요.

### 자동 의존성 설치

`npm install -g openclaw`로 OpenClaw를 전역 설치하면, acpx
런타임 의존성(플랫폼별 바이너리)은 postinstall hook을 통해 자동으로
설치됩니다. 자동 설치가 실패하더라도 gateway는 정상적으로 시작되며,
누락된 의존성은 `openclaw acp doctor`를 통해 보고됩니다.

### Plugin 도구 MCP bridge

기본적으로 ACPX 세션은 OpenClaw에 Plugin으로 등록된 도구를
ACP harness에 노출하지 **않습니다**.

Codex나 Claude Code 같은 ACP agent가 설치된
OpenClaw Plugin 도구(예: memory recall/store)를 호출하게 하려면, 전용 bridge를 활성화하세요:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

이 설정이 하는 일:

- `openclaw-plugin-tools`라는 이름의 내장 MCP 서버를 ACPX 세션
  부트스트랩에 주입합니다.
- 설치되고 활성화된 OpenClaw
  Plugin이 이미 등록한 Plugin 도구를 노출합니다.
- 기능을 명시적이고 기본값은 off로 유지합니다.

보안 및 신뢰 참고:

- 이는 ACP harness의 도구 표면을 확장합니다.
- ACP agent는 gateway에서 이미 활성화된 Plugin 도구에만 접근합니다.
- 이를 해당 Plugin이
  OpenClaw 자체에서 실행되도록 허용하는 것과 같은 신뢰 경계로 취급하세요.
- 활성화하기 전에 설치된 Plugin을 검토하세요.

사용자 지정 `mcpServers`는 이전과 동일하게 계속 동작합니다. 내장 plugin-tools bridge는
추가적인 옵트인 편의 기능이지, 일반 MCP 서버 config를 대체하는 것이 아닙니다.

### 런타임 timeout config

번들된 `acpx` Plugin은 임베디드 런타임 턴의 기본 timeout을 120초로
설정합니다. 이렇게 하면 Gemini CLI 같은 느린 harness도 ACP 시작과 초기화를
완료할 수 있습니다. 호스트에 다른 런타임 제한이 필요하다면 재정의하세요:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

이 값을 변경한 후 gateway를 다시 시작하세요.

### 상태 프로브 agent config

번들된 `acpx` Plugin은 임베디드 런타임 백엔드의 준비 상태를 판단하는 동안
하나의 harness agent를 프로브합니다. 기본값은 `codex`입니다. 배포에서 다른 기본 ACP agent를
사용한다면, 프로브 agent를 같은 ID로 설정하세요:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

이 값을 변경한 후 gateway를 다시 시작하세요.

## 권한 config

ACP 세션은 non-interactive로 실행됩니다 — 파일 쓰기 및 셸 실행 권한 프롬프트를 승인하거나 거부할 TTY가 없습니다. acpx Plugin은 권한 처리 방식을 제어하는 두 개의 config 키를 제공합니다:

이 ACPX harness 권한은 OpenClaw exec 승인과 별개이며, Claude CLI `--permission-mode bypassPermissions` 같은 CLI 백엔드 공급자 우회 플래그와도 별개입니다. ACPX `approve-all`은 ACP 세션을 위한 harness 수준의 긴급 대응 스위치입니다.

### `permissionMode`

harness agent가 프롬프트 없이 수행할 수 있는 작업을 제어합니다.

| 값              | 동작                                                           |
| --------------- | -------------------------------------------------------------- |
| `approve-all`   | 모든 파일 쓰기와 셸 명령을 자동 승인합니다.                    |
| `approve-reads` | 읽기만 자동 승인합니다. 쓰기와 exec는 프롬프트가 필요합니다.   |
| `deny-all`      | 모든 권한 프롬프트를 거부합니다.                               |

### `nonInteractivePermissions`

권한 프롬프트가 표시되어야 하지만 대화형 TTY를 사용할 수 없는 경우(ACP 세션에서는 항상 해당) 어떤 동작을 할지 제어합니다.

| 값     | 동작                                                              |
| ------ | ----------------------------------------------------------------- |
| `fail` | `AcpRuntimeError`와 함께 세션을 중단합니다. **(기본값)**          |
| `deny` | 권한을 조용히 거부하고 계속 진행합니다(점진적 성능 저하).         |

### 구성

Plugin config를 통해 설정합니다:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

이 값을 변경한 후 gateway를 다시 시작하세요.

> **중요:** OpenClaw는 현재 기본값으로 `permissionMode=approve-reads`와 `nonInteractivePermissions=fail`을 사용합니다. 비대화형 ACP 세션에서는 권한 프롬프트를 발생시키는 모든 쓰기 또는 exec가 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`와 함께 실패할 수 있습니다.
>
> 권한을 제한해야 한다면 `nonInteractivePermissions`를 `deny`로 설정해 세션이 종료되는 대신 점진적으로 성능이 저하되도록 하세요.

## 문제 해결

| 증상                                                                        | 가능한 원인                                                                    | 해결 방법                                                                                                                                                           |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | 백엔드 Plugin이 없거나 비활성화됨.                                            | 백엔드 Plugin을 설치하고 활성화한 뒤 `/acp doctor`를 실행하세요.                                                                                                   |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP가 전역적으로 비활성화됨.                                                  | `acp.enabled=true`로 설정하세요.                                                                                                                                     |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 일반 thread 메시지에서의 dispatch가 비활성화됨.                               | `acp.dispatch.enabled=true`로 설정하세요.                                                                                                                            |
| `ACP agent "<id>" is not allowed by policy`                                 | agent가 allowlist에 없음.                                                     | 허용된 `agentId`를 사용하거나 `acp.allowedAgents`를 업데이트하세요.                                                                                                  |
| `Unable to resolve session target: ...`                                     | 잘못된 key/id/label 토큰.                                                     | `/acp sessions`를 실행하고 정확한 key/label을 복사한 뒤 다시 시도하세요.                                                                                             |
| `--bind here requires running /acp spawn inside an active ... conversation` | 활성화된 바인딩 가능한 대화 없이 `--bind here`를 사용함.                      | 대상 채팅/채널로 이동한 뒤 다시 시도하거나, 바인딩 없는 spawn을 사용하세요.                                                                                          |
| `Conversation bindings are unavailable for <channel>.`                      | adapter에 현재 대화 ACP 바인딩 기능이 없음.                                   | 지원되는 경우 `/acp spawn ... --thread ...`를 사용하거나, 최상위 `bindings[]`를 구성하거나, 지원되는 채널로 이동하세요.                                             |
| `--thread here requires running /acp spawn inside an active ... thread`     | thread 컨텍스트 밖에서 `--thread here`를 사용함.                              | 대상 thread로 이동하거나 `--thread auto`/`off`를 사용하세요.                                                                                                        |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 다른 사용자가 현재 바인딩 대상을 소유하고 있음.                               | 소유자로 다시 바인딩하거나 다른 대화 또는 thread를 사용하세요.                                                                                                      |
| `Thread bindings are unavailable for <channel>.`                            | adapter에 thread 바인딩 기능이 없음.                                          | `--thread off`를 사용하거나 지원되는 adapter/채널로 이동하세요.                                                                                                     |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP 런타임은 호스트 측에서 실행되며, 요청자 세션은 sandbox 상태임.            | sandbox된 세션에서는 `runtime="subagent"`를 사용하거나, sandbox되지 않은 세션에서 ACP spawn을 실행하세요.                                                           |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP 런타임에 대해 `sandbox="require"`가 요청됨.                               | 필수 샌드박싱이 필요하면 `runtime="subagent"`를 사용하거나, sandbox되지 않은 세션에서 ACP를 `sandbox="inherit"`와 함께 사용하세요.                                   |
| bound 세션의 ACP 메타데이터가 없음                                          | 오래되었거나 삭제된 ACP 세션 메타데이터.                                      | `/acp spawn`으로 다시 생성한 뒤 thread를 다시 바인딩/focus하세요.                                                                                                   |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode`가 비대화형 ACP 세션의 쓰기/exec를 차단함.                    | `plugins.entries.acpx.config.permissionMode`를 `approve-all`로 설정하고 gateway를 다시 시작하세요. [권한 구성](#permission-configuration)을 참조하세요.            |
| ACP 세션이 출력이 거의 없이 초기에 실패함                                   | 권한 프롬프트가 `permissionMode`/`nonInteractivePermissions`에 의해 차단됨.   | `AcpRuntimeError`가 있는지 gateway 로그를 확인하세요. 전체 권한이 필요하면 `permissionMode=approve-all`로, 점진적 성능 저하를 원하면 `nonInteractivePermissions=deny`로 설정하세요. |
| 작업 완료 후 ACP 세션이 무기한 멈춰 있음                                    | harness 프로세스는 끝났지만 ACP 세션이 완료를 보고하지 않음.                  | `ps aux \| grep acpx`로 모니터링하고, 오래된 프로세스를 수동으로 종료하세요.                                                                                        |
