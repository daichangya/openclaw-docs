---
read_when:
    - ACP를 통해 코딩 harness를 실행하는 경우
    - 메시징 채널에서 대화 바인딩 ACP 세션을 설정하는 경우
    - 메시지 채널 대화를 영구적인 ACP 세션에 바인딩하는 경우
    - ACP 백엔드 및 plugin 배선을 문제 해결하는 경우
    - 채팅에서 /acp 명령을 운영하는 경우
summary: Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP 및 기타 harness agent에 ACP 런타임 세션 사용
title: ACP Agents
x-i18n:
    generated_at: "2026-04-07T06:03:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb651ab39b05e537398623ee06cb952a5a07730fc75d3f7e0de20dd3128e72c6
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP agent

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 세션을 사용하면 OpenClaw가 ACP 백엔드 plugin을 통해 외부 코딩 harness(예: Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI 및 기타 지원되는 ACPX harness)를 실행할 수 있습니다.

OpenClaw에 자연어로 "Codex에서 이걸 실행해" 또는 "스레드에서 Claude Code를 시작해"라고 요청하면, OpenClaw는 해당 요청을 ACP 런타임으로 라우팅해야 합니다(네이티브 sub-agent 런타임이 아님). 각 ACP 세션 생성은 [백그라운드 작업](/ko/automation/tasks)으로 추적됩니다.

Codex 또는 Claude Code가 기존 OpenClaw 채널 대화에 외부 MCP 클라이언트로 직접 연결되게 하려면
ACP 대신 [`openclaw mcp serve`](/cli/mcp)를 사용하세요.

## 어떤 페이지를 봐야 하나요?

가까운 곳에 서로 헷갈리기 쉬운 세 가지 관련 표면이 있습니다.

| 원하는 작업...                                                                     | 사용할 항목                              | 참고                                                                                                       |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| OpenClaw를 _통해_ Codex, Claude Code, Gemini CLI 또는 다른 외부 harness 실행 | 이 페이지: ACP agent                 | 채팅 바인딩 세션, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, 백그라운드 작업, 런타임 제어 |
| OpenClaw Gateway 세션을 편집기나 클라이언트를 위한 ACP 서버로 _노출_      | [`openclaw acp`](/cli/acp)            | 브리지 모드. IDE/클라이언트가 stdio/WebSocket을 통해 OpenClaw와 ACP로 통신                                          |
| 로컬 AI CLI를 텍스트 전용 대체 모델로 재사용                                 | [CLI 백엔드](/ko/gateway/cli-backends) | ACP 아님. OpenClaw 도구 없음, ACP 제어 없음, harness 런타임 없음                                             |

## 기본 상태로 바로 작동하나요?

보통은 그렇습니다.

- 새 설치에는 이제 번들된 `acpx` 런타임 plugin이 기본적으로 활성화되어 제공됩니다.
- 번들된 `acpx` plugin은 plugin 로컬에 고정된 `acpx` 바이너리를 우선 사용합니다.
- 시작 시 OpenClaw는 해당 바이너리를 검사하고 필요하면 자체 복구합니다.
- 빠른 준비 상태 확인을 원하면 `/acp doctor`부터 시작하세요.

처음 사용할 때 여전히 일어날 수 있는 일:

- 대상 harness 어댑터는 해당 harness를 처음 사용할 때 `npx`로 주문형 가져오기될 수 있습니다.
- 해당 harness에 대한 벤더 인증은 여전히 호스트에 존재해야 합니다.
- 호스트에 npm/네트워크 액세스가 없으면, 캐시를 미리 예열하거나 다른 방식으로 어댑터를 설치할 때까지 첫 실행 어댑터 가져오기가 실패할 수 있습니다.

예시:

- `/acp spawn codex`: OpenClaw는 `acpx` 부트스트랩 준비가 되어 있어야 하지만, Codex ACP 어댑터는 여전히 첫 실행 가져오기가 필요할 수 있습니다.
- `/acp spawn claude`: Claude ACP 어댑터도 마찬가지이며, 해당 호스트에서 Claude 측 인증도 필요합니다.

## 빠른 운영자 흐름

실용적인 `/acp` 운영 절차가 필요하다면 이것을 사용하세요.

1. 세션 생성:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. 바인딩된 대화 또는 스레드에서 작업합니다(또는 해당 세션 키를 명시적으로 지정).
3. 런타임 상태 확인:
   - `/acp status`
4. 필요에 따라 런타임 옵션 조정:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. 컨텍스트를 교체하지 않고 활성 세션에 지시 추가:
   - `/acp steer tighten logging and continue`
6. 작업 중지:
   - `/acp cancel`(현재 턴 중지), 또는
   - `/acp close`(세션 종료 + 바인딩 제거)

## 사람을 위한 빠른 시작

자연어 요청 예시:

- "이 Discord 채널을 Codex에 바인딩해."
- "여기 스레드에서 영구 Codex 세션을 시작하고 집중 상태를 유지해."
- "이걸 일회성 Claude Code ACP 세션으로 실행하고 결과를 요약해."
- "이 iMessage 채팅을 Codex에 바인딩하고 후속 작업을 같은 workspace에서 유지해."
- "이 작업에는 Gemini CLI를 스레드에서 사용하고, 후속 작업도 같은 스레드에서 계속해."

OpenClaw가 해야 할 일:

1. `runtime: "acp"`를 선택합니다.
2. 요청된 harness 대상(`agentId`, 예: `codex`)을 확인합니다.
3. 현재 대화 바인딩이 요청되었고 활성 채널이 이를 지원하면 ACP 세션을 해당 대화에 바인딩합니다.
4. 그렇지 않고 스레드 바인딩이 요청되었으며 현재 채널이 이를 지원하면 ACP 세션을 해당 스레드에 바인딩합니다.
5. 초점 해제/종료/만료될 때까지 후속 바인딩 메시지를 같은 ACP 세션으로 라우팅합니다.

## ACP와 sub-agent 비교

외부 harness 런타임이 필요하면 ACP를 사용하세요. OpenClaw 네이티브 위임 실행이 필요하면 sub-agent를 사용하세요.

| 영역          | ACP 세션                           | Sub-agent 실행                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| 런타임       | ACP 백엔드 plugin(예: acpx) | OpenClaw 네이티브 sub-agent 런타임  |
| 세션 키   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 주요 명령 | `/acp ...`                            | `/subagents ...`                   |
| 생성 도구    | `runtime:"acp"`를 사용하는 `sessions_spawn` | `sessions_spawn`(기본 런타임) |

참고: [Sub-agents](/ko/tools/subagents)

## ACP가 Claude Code를 실행하는 방법

ACP를 통한 Claude Code의 스택은 다음과 같습니다.

1. OpenClaw ACP 세션 제어 플레인
2. 번들된 `acpx` 런타임 plugin
3. Claude ACP 어댑터
4. Claude 측 런타임/세션 메커니즘

중요한 차이점:

- ACP Claude는 ACP 제어, 세션 재개, 백그라운드 작업 추적, 선택적인 대화/스레드 바인딩을 갖는 harness 세션입니다.
- CLI 백엔드는 별도의 텍스트 전용 로컬 대체 런타임입니다. [CLI 백엔드](/ko/gateway/cli-backends)를 참고하세요.

운영자를 위한 실용적인 규칙:

- `/acp spawn`, 바인딩 가능한 세션, 런타임 제어 또는 영구적인 harness 작업이 필요하면: ACP 사용
- 원시 CLI를 통한 간단한 로컬 텍스트 대체가 필요하면: CLI 백엔드 사용

## 바인딩된 세션

### 현재 대화 바인딩

하위 스레드를 만들지 않고 현재 대화를 내구성 있는 ACP workspace로 만들고 싶다면 `/acp spawn <harness> --bind here`를 사용하세요.

동작:

- OpenClaw는 계속 채널 전송, 인증, 안전, 전달을 소유합니다.
- 현재 대화는 생성된 ACP 세션 키에 고정됩니다.
- 해당 대화의 후속 메시지는 같은 ACP 세션으로 라우팅됩니다.
- `/new`와 `/reset`은 같은 바인딩된 ACP 세션을 그 자리에서 재설정합니다.
- `/acp close`는 세션을 닫고 현재 대화 바인딩을 제거합니다.

실제로 의미하는 것:

- `--bind here`는 같은 채팅 표면을 유지합니다. Discord에서는 현재 채널이 그대로 현재 채널로 유지됩니다.
- `--bind here`는 새 작업을 생성하는 경우 여전히 새 ACP 세션을 만들 수 있습니다. 바인딩은 그 세션을 현재 대화에 연결합니다.
- `--bind here`는 자체적으로 하위 Discord 스레드나 Telegram topic을 만들지 않습니다.
- ACP 런타임은 여전히 자체 작업 디렉터리(`cwd`) 또는 백엔드가 관리하는 디스크상의 workspace를 가질 수 있습니다. 그 런타임 workspace는 채팅 표면과 별개이며 새 메시징 스레드를 의미하지 않습니다.
- 다른 ACP agent로 생성하고 `--cwd`를 전달하지 않으면 OpenClaw는 기본적으로 요청자의 workspace가 아니라 **대상 agent의** workspace를 상속합니다.
- 상속된 workspace 경로가 없으면(`ENOENT`/`ENOTDIR`) OpenClaw는 잘못된 트리를 조용히 재사용하는 대신 백엔드 기본 cwd로 대체합니다.
- 상속된 workspace가 존재하지만 액세스할 수 없으면(예: `EACCES`) 생성 시 `cwd`를 버리지 않고 실제 액세스 오류를 반환합니다.

개념 모델:

- 채팅 표면: 사람들이 계속 대화하는 곳(`Discord channel`, `Telegram topic`, `iMessage chat`)
- ACP 세션: OpenClaw가 라우팅하는 내구성 있는 Codex/Claude/Gemini 런타임 상태
- 하위 스레드/topic: `--thread ...`로만 생성되는 선택적 추가 메시징 표면
- 런타임 workspace: harness가 실행되는 파일시스템 위치(`cwd`, 저장소 체크아웃, 백엔드 workspace)

예시:

- `/acp spawn codex --bind here`: 이 채팅을 유지하고, Codex ACP 세션을 생성하거나 연결하며, 여기의 향후 메시지를 그 세션으로 라우팅
- `/acp spawn codex --thread auto`: OpenClaw가 하위 스레드/topic을 만들고 거기에 ACP 세션을 바인딩할 수 있음
- `/acp spawn codex --bind here --cwd /workspace/repo`: 위와 같은 채팅 바인딩이지만 Codex는 `/workspace/repo`에서 실행됨

현재 대화 바인딩 지원:

- 현재 대화 바인딩 지원을 알리는 채팅/메시지 채널은 공유 대화 바인딩 경로를 통해 `--bind here`를 사용할 수 있습니다.
- 커스텀 스레드/topic 의미 체계를 가진 채널도 동일한 공유 인터페이스 뒤에서 채널별 정규화를 제공할 수 있습니다.
- `--bind here`는 항상 "현재 대화를 그 자리에서 바인딩"을 의미합니다.
- 일반 현재 대화 바인딩은 공유 OpenClaw 바인딩 저장소를 사용하며 일반적인 gateway 재시작 후에도 유지됩니다.

참고:

- `/acp spawn`에서 `--bind here`와 `--thread ...`는 함께 사용할 수 없습니다.
- Discord에서 `--bind here`는 현재 채널 또는 스레드를 그 자리에서 바인딩합니다. `spawnAcpSessions`는 OpenClaw가 `--thread auto|here`를 위해 하위 스레드를 생성해야 할 때만 필요합니다.
- 활성 채널이 현재 대화 ACP 바인딩을 노출하지 않으면 OpenClaw는 명확한 미지원 메시지를 반환합니다.
- `resume` 및 "새 세션" 관련 질문은 채널 질문이 아니라 ACP 세션 질문입니다. 현재 채팅 표면을 바꾸지 않고 런타임 상태를 재사용하거나 교체할 수 있습니다.

### 스레드 바인딩 세션

채널 어댑터에서 스레드 바인딩이 활성화되면 ACP 세션을 스레드에 바인딩할 수 있습니다.

- OpenClaw는 스레드를 대상 ACP 세션에 바인딩합니다.
- 해당 스레드의 후속 메시지는 바인딩된 ACP 세션으로 라우팅됩니다.
- ACP 출력은 같은 스레드로 다시 전달됩니다.
- 초점 해제/종료/보관/유휴 시간 초과 또는 최대 수명 만료 시 바인딩이 제거됩니다.

스레드 바인딩 지원은 어댑터별입니다. 활성 채널 어댑터가 스레드 바인딩을 지원하지 않으면 OpenClaw는 명확한 미지원/사용 불가 메시지를 반환합니다.

스레드 바인딩 ACP에 필요한 기능 플래그:

- `acp.enabled=true`
- `acp.dispatch.enabled`는 기본적으로 켜져 있습니다(`false`로 설정하면 ACP 디스패치를 일시 중지)
- 채널 어댑터 ACP 스레드 생성 플래그 활성화(어댑터별)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### 스레드를 지원하는 채널

- 세션/스레드 바인딩 기능을 노출하는 모든 채널 어댑터
- 현재 기본 제공 지원:
  - Discord 스레드/채널
  - Telegram topic(그룹/슈퍼그룹의 forum topic 및 DM topic)
- Plugin 채널도 동일한 바인딩 인터페이스를 통해 지원을 추가할 수 있습니다.

## 채널별 설정

비임시 워크플로의 경우 최상위 `bindings[]` 항목에서 영구 ACP 바인딩을 구성하세요.

### 바인딩 모델

- `bindings[].type="acp"`는 영구 ACP 대화 바인딩을 표시합니다.
- `bindings[].match`는 대상 대화를 식별합니다.
  - Discord 채널 또는 스레드: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum topic: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/그룹 채팅: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    안정적인 그룹 바인딩에는 `chat_id:*` 또는 `chat_identifier:*`를 권장합니다.
  - iMessage DM/그룹 채팅: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    안정적인 그룹 바인딩에는 `chat_id:*`를 권장합니다.
- `bindings[].agentId`는 소유 OpenClaw agent id입니다.
- 선택적 ACP 재정의는 `bindings[].acp` 아래에 있습니다.
  - `mode`(`persistent` 또는 `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### agent별 런타임 기본값

agent별로 ACP 기본값을 한 번 정의하려면 `agents.list[].runtime`을 사용하세요.

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`(harness id, 예: `codex` 또는 `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACP 바인딩 세션의 재정의 우선순위:

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
- 바인딩된 대화에서 `/new`와 `/reset`은 같은 ACP 세션 키를 그 자리에서 재설정합니다.
- 임시 런타임 바인딩(예: 스레드 초점 흐름에서 생성된 것)은 존재하는 곳에 계속 적용됩니다.
- 명시적인 `cwd` 없이 agent 간 ACP 생성이 이루어지면 OpenClaw는 agent 구성에서 대상 agent workspace를 상속합니다.
- 누락된 상속 workspace 경로는 백엔드 기본 cwd로 대체되며, 실제 액세스 실패는 생성 오류로 표시됩니다.

## ACP 세션 시작(인터페이스)

### `sessions_spawn`에서

agent 턴 또는 도구 호출에서 ACP 세션을 시작하려면 `runtime: "acp"`를 사용하세요.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

참고:

- `runtime`의 기본값은 `subagent`이므로 ACP 세션에는 `runtime: "acp"`를 명시적으로 설정하세요.
- `agentId`를 생략하면 OpenClaw는 구성된 경우 `acp.defaultAgent`를 사용합니다.
- `mode: "session"`은 영구 바인딩 대화를 유지하려면 `thread: true`가 필요합니다.

인터페이스 세부 정보:

- `task`(필수): ACP 세션으로 전송되는 초기 프롬프트입니다.
- `runtime`(ACP에 필수): 반드시 `"acp"`여야 합니다.
- `agentId`(선택): ACP 대상 harness id입니다. 설정된 경우 `acp.defaultAgent`로 대체됩니다.
- `thread`(선택, 기본값 `false`): 지원되는 경우 스레드 바인딩 흐름을 요청합니다.
- `mode`(선택): `run`(일회성) 또는 `session`(영구).
  - 기본값은 `run`
  - `thread: true`이고 mode를 생략한 경우 OpenClaw는 런타임 경로별로 영구 동작을 기본값으로 둘 수 있습니다.
  - `mode: "session"`은 `thread: true`가 필요합니다.
- `cwd`(선택): 요청된 런타임 작업 디렉터리입니다(백엔드/런타임 정책에 의해 검증됨). 생략하면 ACP 생성은 구성된 경우 대상 agent workspace를 상속합니다. 누락된 상속 경로는 백엔드 기본값으로 대체되며 실제 액세스 오류는 반환됩니다.
- `label`(선택): 세션/배너 텍스트에 사용되는 운영자용 레이블입니다.
- `resumeSessionId`(선택): 새 세션을 만드는 대신 기존 ACP 세션을 재개합니다. agent는 `session/load`를 통해 대화 기록을 다시 재생합니다. `runtime: "acp"`가 필요합니다.
- `streamTo`(선택): `"parent"`는 초기 ACP 실행 진행 요약을 시스템 이벤트로 요청자 세션에 다시 스트리밍합니다.
  - 사용 가능한 경우 허용된 응답에 전체 릴레이 기록을 tail할 수 있는 세션 범위 JSONL 로그(`<sessionId>.acp-stream.jsonl`)를 가리키는 `streamLogPath`가 포함됩니다.

### 기존 세션 재개

새로 시작하는 대신 이전 ACP 세션을 계속하려면 `resumeSessionId`를 사용하세요. agent는 `session/load`를 통해 대화 기록을 다시 재생하므로 이전 맥락 전체를 이어받아 계속합니다.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

일반적인 사용 사례:

- 노트북에서 휴대폰으로 Codex 세션을 넘기기 — agent에게 중단한 지점부터 이어서 하라고 지시
- CLI에서 대화형으로 시작한 코딩 세션을 이제 agent를 통해 헤드리스로 계속하기
- gateway 재시작 또는 유휴 시간 초과로 중단된 작업 이어가기

참고:

- `resumeSessionId`는 `runtime: "acp"`가 필요합니다 — sub-agent 런타임과 함께 사용하면 오류를 반환합니다.
- `resumeSessionId`는 상위 ACP 대화 기록을 복원합니다. `thread`와 `mode`는 여전히 새로 만드는 OpenClaw 세션에 정상 적용되므로 `mode: "session"`은 여전히 `thread: true`가 필요합니다.
- 대상 agent는 `session/load`를 지원해야 합니다(Codex와 Claude Code는 지원함).
- 세션 ID를 찾을 수 없으면 생성은 명확한 오류와 함께 실패합니다 — 새 세션으로의 조용한 대체는 없습니다.

### 운영자 스모크 테스트

gateway 배포 후 ACP 생성이
단위 테스트만 통과하는 것이 아니라 실제로 엔드투엔드로 작동하는지 빠르게 실시간 확인하고 싶다면 이것을 사용하세요.

권장 게이트:

1. 대상 호스트에서 배포된 gateway 버전/커밋을 확인합니다.
2. 배포된 소스에
   `src/gateway/sessions-patch.ts`의 ACP 계보 허용
   (`subagent:* or acp:* sessions`)이 포함되어 있는지 확인합니다.
3. 실제 agent에 임시 ACPX 브리지 세션을 엽니다(예:
   `jpclawhq`의 `razor(main)`).
4. 해당 agent에게 다음과 함께 `sessions_spawn`을 호출하라고 요청합니다.
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - 작업: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. agent가 다음을 보고하는지 확인합니다.
   - `accepted=yes`
   - 실제 `childSessionKey`
   - validator 오류 없음
6. 임시 ACPX 브리지 세션을 정리합니다.

실시간 agent에 보낼 예시 프롬프트:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

참고:

- 의도적으로
  스레드 바인딩 영구 ACP 세션을 테스트하는 경우가 아니라면 이 스모크 테스트는 `mode: "run"`으로 유지하세요.
- 기본 게이트에는 `streamTo: "parent"`를 요구하지 마세요. 이 경로는
  요청자/세션 기능에 따라 달라지며 별도의 통합 확인 항목입니다.
- 스레드 바인딩 `mode: "session"` 테스트는 실제 Discord 스레드 또는 Telegram topic에서 수행하는 두 번째, 더 풍부한 통합
  단계로 취급하세요.

## sandbox 호환성

ACP 세션은 현재 OpenClaw sandbox 내부가 아니라 호스트 런타임에서 실행됩니다.

현재 제한 사항:

- 요청자 세션이 sandboxed 상태이면 `sessions_spawn({ runtime: "acp" })`와 `/acp spawn` 모두에서 ACP 생성이 차단됩니다.
  - 오류: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `runtime: "acp"`를 사용하는 `sessions_spawn`은 `sandbox: "require"`를 지원하지 않습니다.
  - 오류: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

sandbox로 강제된 실행이 필요하면 `runtime: "subagent"`를 사용하세요.

### `/acp` 명령에서

채팅에서 명시적인 운영자 제어가 필요하면 `/acp spawn`을 사용하세요.

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

참고: [Slash Commands](/ko/tools/slash-commands)

## 세션 대상 확인

대부분의 `/acp` 작업은 선택적 세션 대상(`session-key`, `session-id`, 또는 `session-label`)을 받습니다.

확인 순서:

1. 명시적 대상 인수(`/acp steer`의 경우 `--session`)
   - 먼저 키 시도
   - 그다음 UUID 형태의 세션 id
   - 그다음 label
2. 현재 스레드 바인딩(이 대화/스레드가 ACP 세션에 바인딩된 경우)
3. 현재 요청자 세션 대체

현재 대화 바인딩과 스레드 바인딩은 모두 2단계에 참여합니다.

대상을 확인할 수 없으면 OpenClaw는 명확한 오류를 반환합니다(`Unable to resolve session target: ...`).

## 생성 바인딩 모드

`/acp spawn`은 `--bind here|off`를 지원합니다.

| 모드   | 동작                                                               |
| ------ | ---------------------------------------------------------------------- |
| `here` | 현재 활성 대화를 그 자리에서 바인딩합니다. 활성 대화가 없으면 실패합니다. |
| `off`  | 현재 대화 바인딩을 만들지 않습니다.                          |

참고:

- `--bind here`는 "이 채널 또는 채팅을 Codex 기반으로 만들기"를 위한 가장 간단한 운영자 경로입니다.
- `--bind here`는 하위 스레드를 만들지 않습니다.
- `--bind here`는 현재 대화 바인딩 지원을 노출하는 채널에서만 사용할 수 있습니다.
- `--bind`와 `--thread`는 같은 `/acp spawn` 호출에서 함께 사용할 수 없습니다.

## 생성 스레드 모드

`/acp spawn`은 `--thread auto|here|off`를 지원합니다.

| 모드   | 동작                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | 활성 스레드 안에서는 해당 스레드를 바인딩합니다. 스레드 밖에서는 지원되는 경우 하위 스레드를 생성/바인딩합니다. |
| `here` | 현재 활성 스레드가 필요합니다. 스레드 안이 아니면 실패합니다.                                                  |
| `off`  | 바인딩 없음. 세션은 바인딩되지 않은 상태로 시작됩니다.                                                                 |

참고:

- 스레드 바인딩이 아닌 표면에서는 기본 동작이 사실상 `off`입니다.
- 스레드 바인딩 생성에는 채널 정책 지원이 필요합니다.
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- 하위 스레드를 만들지 않고 현재 대화를 고정하려면 `--bind here`를 사용하세요.

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

`/acp status`는 유효한 런타임 옵션을 보여주며, 가능한 경우 런타임 수준과 백엔드 수준 세션 식별자도 모두 표시합니다.

일부 제어는 백엔드 기능에 따라 다릅니다. 백엔드가 특정 제어를 지원하지 않으면 OpenClaw는 명확한 미지원 제어 오류를 반환합니다.

## ACP 명령 요리책

| 명령              | 기능                                              | 예시                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP 세션 생성, 선택적 현재 바인딩 또는 스레드 바인딩. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 대상 세션의 진행 중인 턴을 취소합니다.                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 실행 중인 세션에 조정 지시를 보냅니다.                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 세션을 닫고 스레드 대상 바인딩을 해제합니다.                  | `/acp close`                                                  |
| `/acp status`        | 백엔드, 모드, 상태, 런타임 옵션, 기능을 표시합니다. | `/acp status`                                                 |
| `/acp set-mode`      | 대상 세션의 런타임 모드를 설정합니다.                      | `/acp set-mode plan`                                          |
| `/acp set`           | 일반 런타임 구성 옵션 쓰기.                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 런타임 작업 디렉터리 재정의를 설정합니다.                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 승인 정책 프로필을 설정합니다.                              | `/acp permissions strict`                                     |
| `/acp timeout`       | 런타임 시간 초과(초)를 설정합니다.                            | `/acp timeout 120`                                            |
| `/acp model`         | 런타임 모델 재정의를 설정합니다.                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 세션 런타임 옵션 재정의를 제거합니다.                  | `/acp reset-options`                                          |
| `/acp sessions`      | 저장소의 최근 ACP 세션을 나열합니다.                      | `/acp sessions`                                               |
| `/acp doctor`        | 백엔드 상태, 기능, 실행 가능한 수정 사항.           | `/acp doctor`                                                 |
| `/acp install`       | 결정적인 설치 및 활성화 단계를 출력합니다.             | `/acp install`                                                |

`/acp sessions`는 현재 바인딩된 세션 또는 요청자 세션의 저장소를 읽습니다. `session-key`, `session-id`, 또는 `session-label` 토큰을 받는 명령은 사용자 지정 agent별 `session.store` 루트를 포함한 gateway 세션 탐색을 통해 대상을 확인합니다.

## 런타임 옵션 매핑

`/acp`에는 편의 명령과 일반 setter가 있습니다.

동등한 작업:

- `/acp model <id>`는 런타임 구성 키 `model`에 매핑됩니다.
- `/acp permissions <profile>`는 런타임 구성 키 `approval_policy`에 매핑됩니다.
- `/acp timeout <seconds>`는 런타임 구성 키 `timeout`에 매핑됩니다.
- `/acp cwd <path>`는 런타임 cwd 재정의를 직접 업데이트합니다.
- `/acp set <key> <value>`는 일반 경로입니다.
  - 특수 사례: `key=cwd`는 cwd 재정의 경로를 사용합니다.
- `/acp reset-options`는 대상 세션의 모든 런타임 재정의를 지웁니다.

## acpx harness 지원(현재)

현재 acpx 기본 제공 harness 별칭:

- `claude`
- `codex`
- `copilot`
- `cursor`(Cursor CLI: `cursor-agent acp`)
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

OpenClaw가 acpx 백엔드를 사용할 때는 acpx 구성에서 사용자 지정 agent 별칭을 정의하지 않은 한 `agentId`에 이 값들을 우선 사용하세요.
로컬 Cursor 설치가 여전히 ACP를 `agent acp`로 노출한다면, 기본 제공 기본값을 바꾸는 대신 acpx 구성에서 `cursor` agent 명령을 재정의하세요.

직접 acpx CLI 사용은 `--agent <command>`를 통해 임의 어댑터도 대상으로 지정할 수 있지만, 그 원시 이스케이프 해치는 acpx CLI 기능이며(일반적인 OpenClaw `agentId` 경로가 아님) 참고용입니다.

## 필수 구성

핵심 ACP 기준선:

```json5
{
  acp: {
    enabled: true,
    // 선택 사항. 기본값은 true이며, /acp 제어를 유지한 채 ACP 디스패치를 일시 중지하려면 false로 설정합니다.
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

스레드 바인딩 구성은 채널 어댑터별입니다. Discord 예시:

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

스레드 바인딩 ACP 생성이 작동하지 않으면 먼저 어댑터 기능 플래그를 확인하세요.

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

현재 대화 바인딩은 하위 스레드 생성이 필요하지 않습니다. 활성 대화 컨텍스트와 ACP 대화 바인딩을 노출하는 채널 어댑터가 필요합니다.

참고: [구성 참조](/ko/gateway/configuration-reference)

## acpx 백엔드용 plugin 설정

새 설치에는 번들된 `acpx` 런타임 plugin이 기본적으로 활성화되어 제공되므로 ACP는
보통 수동 plugin 설치 단계 없이 작동합니다.

다음으로 시작하세요.

```text
/acp doctor
```

`acpx`를 비활성화했거나, `plugins.allow` / `plugins.deny`로 거부했거나,
로컬 개발 체크아웃으로 전환하려면 명시적인 plugin 경로를 사용하세요.

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

개발 중 로컬 workspace 설치:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

그다음 백엔드 상태를 확인하세요.

```text
/acp doctor
```

### acpx 명령 및 버전 구성

기본적으로 번들된 acpx 백엔드 plugin(`acpx`)은 plugin 로컬에 고정된 바이너리를 사용합니다.

1. 명령은 ACPX plugin 패키지 내부의 plugin 로컬 `node_modules/.bin/acpx`가 기본값입니다.
2. 기대 버전은 extension pin이 기본값입니다.
3. 시작 시 ACP 백엔드는 즉시 준비되지 않은 상태로 등록됩니다.
4. 백그라운드 ensure 작업이 `acpx --version`을 확인합니다.
5. plugin 로컬 바이너리가 없거나 버전이 맞지 않으면 다음을 실행합니다.
   `npm install --omit=dev --no-save acpx@<pinned>` 그리고 다시 검증합니다.

plugin 구성에서 명령/버전을 재정의할 수 있습니다.

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

- `command`는 절대 경로, 상대 경로 또는 명령 이름(`acpx`)을 받을 수 있습니다.
- 상대 경로는 OpenClaw workspace 디렉터리 기준으로 확인됩니다.
- `expectedVersion: "any"`는 엄격한 버전 일치를 비활성화합니다.
- `command`가 사용자 지정 바이너리/경로를 가리키면 plugin 로컬 자동 설치는 비활성화됩니다.
- 백엔드 상태 확인이 실행되는 동안 OpenClaw 시작은 계속 비차단 방식으로 유지됩니다.

참고: [Plugins](/ko/tools/plugin)

### 자동 의존성 설치

`npm install -g openclaw`로 OpenClaw를 전역 설치하면 acpx
런타임 의존성(플랫폼별 바이너리)은 postinstall 훅을 통해 자동으로
설치됩니다. 자동 설치에 실패하더라도 gateway는 여전히 정상적으로 시작되며
누락된 의존성을 `openclaw acp doctor`를 통해 보고합니다.

### Plugin 도구 MCP 브리지

기본적으로 ACPX 세션은 OpenClaw plugin에 등록된 도구를
ACP harness에 노출하지 않습니다.

Codex나 Claude Code 같은 ACP agent가 memory recall/store 같은 설치된
OpenClaw plugin 도구를 호출하게 하려면 전용 브리지를 활성화하세요.

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

이 설정이 하는 일:

- ACPX 세션
  부트스트랩에 `openclaw-plugin-tools`라는 기본 제공 MCP 서버를 주입합니다.
- 설치 및 활성화된 OpenClaw
  plugin이 이미 등록한 plugin 도구를 노출합니다.
- 이 기능을 명시적이고 기본 비활성화 상태로 유지합니다.

보안 및 신뢰 관련 참고:

- 이는 ACP harness 도구 표면을 확장합니다.
- ACP agent는 gateway에서 이미 활성화된 plugin 도구에만 액세스할 수 있습니다.
- 이는 해당 plugin을
  OpenClaw 자체에서 실행하도록 허용하는 것과 동일한 신뢰 경계로 취급하세요.
- 활성화하기 전에 설치된 plugin을 검토하세요.

사용자 지정 `mcpServers`는 이전과 동일하게 계속 작동합니다. 기본 제공 plugin-tools 브리지는
일반 MCP 서버 구성의 대체가 아니라 추가적인 옵트인 편의 기능입니다.

## 권한 구성

ACP 세션은 비대화형으로 실행됩니다. 파일 쓰기와 셸 실행 권한 프롬프트를 승인하거나 거부할 TTY가 없습니다. acpx plugin은 권한 처리 방식을 제어하는 두 가지 구성 키를 제공합니다.

이 ACPX harness 권한은 OpenClaw exec 승인과는 별개이며, Claude CLI `--permission-mode bypassPermissions` 같은 CLI 백엔드 벤더 우회 플래그와도 별개입니다. ACPX `approve-all`은 ACP 세션을 위한 harness 수준 브레이크글라스 스위치입니다.

### `permissionMode`

harness agent가 프롬프트 없이 수행할 수 있는 작업을 제어합니다.

| 값           | 동작                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | 모든 파일 쓰기와 셸 명령을 자동 승인합니다.          |
| `approve-reads` | 읽기만 자동 승인하며, 쓰기와 실행은 프롬프트가 필요합니다. |
| `deny-all`      | 모든 권한 프롬프트를 거부합니다.                              |

### `nonInteractivePermissions`

권한 프롬프트가 표시되어야 하지만 대화형 TTY를 사용할 수 없을 때(ACP 세션에서는 항상 해당됨) 어떻게 할지를 제어합니다.

| 값  | 동작                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | `AcpRuntimeError`와 함께 세션을 중단합니다. **(기본값)**           |
| `deny` | 권한을 조용히 거부하고 계속합니다(점진적 성능 저하). |

### 구성

plugin 구성으로 설정:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

이 값을 변경한 후 gateway를 재시작하세요.

> **중요:** OpenClaw는 현재 기본값으로 `permissionMode=approve-reads`와 `nonInteractivePermissions=fail`을 사용합니다. 비대화형 ACP 세션에서는 권한 프롬프트를 트리거하는 쓰기나 실행 작업이 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`와 함께 실패할 수 있습니다.
>
> 권한을 제한해야 한다면 세션이 충돌하는 대신 점진적으로 성능 저하되도록 `nonInteractivePermissions`를 `deny`로 설정하세요.

## 문제 해결

| 증상                                                                     | 가능한 원인                                                                    | 해결 방법                                                                                                                                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | 백엔드 plugin이 없거나 비활성화됨.                                             | 백엔드 plugin을 설치하고 활성화한 다음 `/acp doctor`를 실행하세요.                                                                                                        |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP가 전역적으로 비활성화됨.                                                          | `acp.enabled=true`로 설정하세요.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 일반 스레드 메시지에서의 디스패치가 비활성화됨.                                  | `acp.dispatch.enabled=true`로 설정하세요.                                                                                                                                  |
| `ACP agent "<id>" is not allowed by policy`                                 | agent가 허용 목록에 없음.                                                         | 허용된 `agentId`를 사용하거나 `acp.allowedAgents`를 업데이트하세요.                                                                                                              |
| `Unable to resolve session target: ...`                                     | 잘못된 key/id/label 토큰.                                                         | `/acp sessions`를 실행하고 정확한 key/label을 복사한 뒤 다시 시도하세요.                                                                                                                 |
| `--bind here requires running /acp spawn inside an active ... conversation` | 활성 바인딩 가능한 대화 없이 `--bind here`를 사용함.                     | 대상 채팅/채널로 이동해 다시 시도하거나 바인딩 없이 생성하세요.                                                                                                  |
| `Conversation bindings are unavailable for <channel>.`                      | 어댑터에 현재 대화 ACP 바인딩 기능이 없음.                      | 지원되는 경우 `/acp spawn ... --thread ...`를 사용하거나, 최상위 `bindings[]`를 구성하거나, 지원되는 채널로 이동하세요.                                              |
| `--thread here requires running /acp spawn inside an active ... thread`     | 스레드 컨텍스트 밖에서 `--thread here`를 사용함.                                  | 대상 스레드로 이동하거나 `--thread auto`/`off`를 사용하세요.                                                                                                               |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 다른 사용자가 활성 바인딩 대상을 소유함.                                    | 소유자로 다시 바인딩하거나 다른 대화 또는 스레드를 사용하세요.                                                                                                        |
| `Thread bindings are unavailable for <channel>.`                            | 어댑터에 스레드 바인딩 기능이 없음.                                        | `--thread off`를 사용하거나 지원되는 어댑터/채널로 이동하세요.                                                                                                          |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP 런타임은 호스트 측이며 요청자 세션은 sandboxed 상태임.                       | sandboxed 세션에서는 `runtime="subagent"`를 사용하거나, sandbox가 아닌 세션에서 ACP 생성을 실행하세요.                                                                  |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP 런타임에 대해 `sandbox="require"`가 요청됨.                                  | 필수 sandboxing에는 `runtime="subagent"`를 사용하거나, sandbox가 아닌 세션에서 `sandbox="inherit"`와 함께 ACP를 사용하세요.                                               |
| 바인딩된 세션의 ACP 메타데이터 누락                                      | 오래되었거나 삭제된 ACP 세션 메타데이터.                                             | `/acp spawn`으로 다시 생성한 다음 스레드를 다시 바인딩/집중하세요.                                                                                                             |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode`가 비대화형 ACP 세션에서 쓰기/실행을 차단함.             | `plugins.entries.acpx.config.permissionMode`를 `approve-all`로 설정하고 gateway를 재시작하세요. [권한 구성](#permission-configuration)을 참고하세요.                 |
| ACP 세션이 출력이 거의 없이 초기에 실패함                                  | 권한 프롬프트가 `permissionMode`/`nonInteractivePermissions`에 의해 차단됨. | gateway 로그에서 `AcpRuntimeError`를 확인하세요. 전체 권한이 필요하면 `permissionMode=approve-all`로 설정하고, 점진적 성능 저하를 원하면 `nonInteractivePermissions=deny`로 설정하세요. |
| ACP 세션이 작업 완료 후에도 무기한 멈춤                       | harness 프로세스는 종료되었지만 ACP 세션이 완료를 보고하지 않음.             | `ps aux \| grep acpx`로 모니터링하고 오래된 프로세스를 수동으로 종료하세요.                                                                                                |
