---
read_when:
    - ACP를 통해 코딩 하네스 실행하기
    - 메시징 채널에서 대화 바인딩된 ACP 세션 설정하기
    - 메시지 채널 대화를 영속적인 ACP 세션에 바인딩하기
    - ACP 백엔드 및 Plugin 연결 문제 해결하기
    - ACP 완료 전달 또는 에이전트 간 루프 디버깅하기
    - 채팅에서 /acp 명령 운영하기
summary: Claude Code, Cursor, Gemini CLI, 명시적 Codex ACP 폴백, OpenClaw ACP 및 기타 하네스 에이전트에 ACP 런타임 세션 사용하기
title: ACP 에이전트
x-i18n:
    generated_at: "2026-04-24T06:38:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d59c5aa858e7888c9188ec9fc7dd5bcb9c8a5458f40d6458a5157ebc16332c2
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 세션을 사용하면 OpenClaw가 ACP 백엔드 Plugin을 통해 외부 코딩 하네스(예: Pi, Claude Code, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI 및 기타 지원되는 ACPX 하네스)를 실행할 수 있습니다.

현재 대화에서 Codex를 바인딩하거나 제어해 달라고 OpenClaw에 자연어로 요청하면, OpenClaw는 네이티브 Codex app-server Plugin(`/codex bind`, `/codex threads`, `/codex resume`)을 사용해야 합니다. `/acp`, ACP, acpx 또는 Codex 백그라운드 자식 세션을 요청하면, OpenClaw는 여전히 Codex를 ACP로 라우팅할 수 있습니다. 각 ACP 세션 생성은 [백그라운드 작업](/ko/automation/tasks)으로 추적됩니다.

OpenClaw에 “Claude Code를 스레드에서 시작해” 또는 다른 외부 하네스를 사용하라고 자연어로 요청하면, OpenClaw는 그 요청을 네이티브 하위 에이전트 런타임이 아니라 ACP 런타임으로 라우팅해야 합니다.

Codex나 Claude Code가 외부 MCP 클라이언트로서 기존 OpenClaw 채널 대화에 직접 연결되게 하고 싶다면, ACP 대신 [`openclaw mcp serve`](/ko/cli/mcp)를 사용하세요.

## 어떤 페이지를 봐야 하나요?

헷갈리기 쉬운 인접한 표면이 세 가지 있습니다:

| 하고 싶은 일                                                                                     | 사용해야 할 것                        | 참고                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 현재 대화에서 Codex를 바인딩하거나 제어                                                          | `/codex bind`, `/codex threads`       | 네이티브 Codex app-server 경로. 바인딩된 채팅 응답, 이미지 전달, 모델/fast/permissions, stop, steer 제어 포함. ACP는 명시적 폴백입니다                         |
| Claude Code, Gemini CLI, 명시적 Codex ACP 또는 다른 외부 하네스를 OpenClaw를 _통해_ 실행        | 이 페이지: ACP 에이전트               | 채팅 바인딩 세션, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, 백그라운드 작업, 런타임 제어                                                              |
| 에디터나 클라이언트를 위해 OpenClaw Gateway 세션을 ACP 서버 _로서_ 노출                          | [`openclaw acp`](/ko/cli/acp)            | 브리지 모드. IDE/클라이언트가 stdio/WebSocket을 통해 OpenClaw와 ACP로 통신                                                                                      |
| 로컬 AI CLI를 텍스트 전용 폴백 모델로 재사용                                                     | [CLI 백엔드](/ko/gateway/cli-backends)   | ACP 아님. OpenClaw 도구 없음, ACP 제어 없음, 하네스 런타임 없음                                                                                                 |

## 바로 동작하나요?

보통은 그렇습니다. 새 설치에는 번들된 `acpx` 런타임 Plugin이 기본적으로 활성화된 상태로 포함되며, OpenClaw는 Plugin 로컬에 고정된 `acpx` 바이너리를 시작 시 probe하고 self-repair합니다. 준비 상태 확인에는 `/acp doctor`를 실행하세요.

첫 실행 시 주의할 점:

- 대상 하네스 어댑터(Codex, Claude 등)는 처음 사용할 때 필요에 따라 `npx`로 가져올 수 있습니다.
- 해당 하네스의 공급자 인증은 여전히 호스트에 존재해야 합니다.
- 호스트에 npm이나 네트워크 접근이 없으면, 캐시를 미리 채우거나 다른 방식으로 어댑터를 설치하기 전까지 첫 실행 어댑터 가져오기는 실패합니다.

## 운영자 운영 가이드

채팅에서 빠른 `/acp` 흐름:

1. **생성** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto`, 또는 명시적인 `/acp spawn codex --bind here`
2. 바인딩된 대화 또는 스레드에서 **작업** (또는 세션 키를 명시적으로 지정)
3. **상태 확인** — `/acp status`
4. **조정** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. 컨텍스트를 교체하지 않고 **유도** — `/acp steer tighten logging and continue`
6. **중지** — `/acp cancel` (현재 턴) 또는 `/acp close` (세션 + 바인딩)

네이티브 Codex Plugin으로 라우팅되어야 하는 자연어 트리거:

- "이 Discord 채널을 Codex에 바인딩해."
- "이 채팅을 Codex 스레드 `<id>`에 연결해."
- "Codex 스레드를 보여주고, 이걸 바인딩해."

네이티브 Codex 대화 바인딩은 기본 채팅 제어 경로이지만, 대화형 Codex 승인/도구 흐름에 대해서는 의도적으로 보수적입니다. 이 바인딩된 채팅 경로에서는 OpenClaw 동적 도구와 승인 프롬프트가 아직 노출되지 않으므로, 해당 요청은 명확한 설명과 함께 거부됩니다. 워크플로가 OpenClaw 동적 도구 또는 장시간 실행되는 대화형 승인을 필요로 할 때는 Codex 하네스 경로나 명시적 ACP 폴백을 사용하세요.

ACP 런타임으로 라우팅되어야 하는 자연어 트리거:

- "이걸 원샷 Claude Code ACP 세션으로 실행하고 결과를 요약해."
- "이 작업에 Gemini CLI를 스레드에서 사용하고, 이후 후속 작업도 같은 스레드에 유지해."
- "Codex를 ACP를 통해 백그라운드 스레드에서 실행해."

OpenClaw는 `runtime: "acp"`를 선택하고, 하네스 `agentId`를 확인하고, 지원되는 경우 현재 대화나 스레드에 바인딩하며, close/expiry 전까지 후속 작업을 해당 세션으로 라우팅합니다. Codex는 ACP가 명시적이거나 요청된 백그라운드 런타임이 여전히 ACP를 필요로 하는 경우에만 이 경로를 따릅니다.

## ACP와 하위 에이전트 비교

외부 하네스 런타임을 원하면 ACP를 사용하세요. Codex 대화 바인딩/제어에는 네이티브 Codex app-server를 사용하세요. OpenClaw 네이티브 위임 실행에는 하위 에이전트를 사용하세요.

| 영역         | ACP 세션                              | 하위 에이전트 실행                  |
| ------------ | ------------------------------------- | ----------------------------------- |
| 런타임       | ACP 백엔드 Plugin (예: acpx)          | OpenClaw 네이티브 하위 에이전트 런타임 |
| 세션 키      | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`   |
| 주요 명령    | `/acp ...`                            | `/subagents ...`                    |
| 생성 도구    | `runtime:"acp"`와 함께 `sessions_spawn` | `sessions_spawn` (기본 런타임)    |

추가로 [하위 에이전트](/ko/tools/subagents)도 참조하세요.

## ACP가 Claude Code를 실행하는 방식

ACP를 통해 Claude Code를 사용할 때 스택은 다음과 같습니다:

1. OpenClaw ACP 세션 control plane
2. 번들된 `acpx` 런타임 Plugin
3. Claude ACP 어댑터
4. Claude 측 런타임/세션 메커니즘

중요한 구분:

- ACP Claude는 ACP 제어, 세션 재개, 백그라운드 작업 추적, 선택적 대화/스레드 바인딩을 갖춘 하네스 세션입니다.
- CLI 백엔드는 별도의 텍스트 전용 로컬 폴백 런타임입니다. [CLI 백엔드](/ko/gateway/cli-backends)를 참조하세요.

운영자에게 실질적인 규칙은 다음과 같습니다:

- `/acp spawn`, 바인딩 가능한 세션, 런타임 제어 또는 영속적인 하네스 작업이 필요하면 ACP 사용
- 원시 CLI를 통한 단순한 로컬 텍스트 폴백이 필요하면 CLI 백엔드 사용

## 바인딩된 세션

### 현재 대화 바인딩

`/acp spawn <harness> --bind here`는 현재 대화를 생성된 ACP 세션에 고정합니다 — 자식 스레드 없음, 동일한 채팅 표면 사용. OpenClaw는 전송, 인증, 안전, 전달을 계속 소유합니다. 이 대화의 후속 메시지는 동일한 세션으로 라우팅되고, `/new`와 `/reset`은 세션을 제자리에서 재설정하며, `/acp close`는 바인딩을 제거합니다.

개념 모델:

- **채팅 표면** — 사람들이 계속 대화하는 곳 (Discord 채널, Telegram 토픽, iMessage 채팅)
- **ACP 세션** — OpenClaw가 라우팅하는 영속적인 Codex/Claude/Gemini 런타임 상태
- **자식 스레드/토픽** — `--thread ...`에서만 생성되는 선택적 추가 메시징 표면
- **런타임 작업공간** — 하네스가 실행되는 파일 시스템 위치 (`cwd`, 저장소 체크아웃, 백엔드 작업공간). 채팅 표면과는 독립적입니다.

예시:

- `/codex bind` — 이 채팅을 유지하고, 네이티브 Codex app-server를 생성하거나 연결하고, 이후 메시지를 여기로 라우팅
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — 채팅에서 바인딩된 네이티브 Codex 스레드를 조정
- `/codex stop` 또는 `/codex steer focus on the failing tests first` — 활성 네이티브 Codex 턴 제어
- `/acp spawn codex --bind here` — Codex에 대한 명시적 ACP 폴백
- `/acp spawn codex --thread auto` — OpenClaw가 자식 스레드/토픽을 만들고 거기에 바인딩할 수 있음
- `/acp spawn codex --bind here --cwd /workspace/repo` — 같은 채팅 바인딩, Codex는 `/workspace/repo`에서 실행

참고:

- `--bind here`와 `--thread ...`는 함께 사용할 수 없습니다.
- `--bind here`는 현재 대화 바인딩을 광고하는 채널에서만 동작하며, 지원되지 않는 경우 OpenClaw는 명확한 미지원 메시지를 반환합니다. 바인딩은 Gateway 재시작 후에도 유지됩니다.
- Discord에서 `spawnAcpSessions`는 `--thread auto|here`에 대해 OpenClaw가 자식 스레드를 만들어야 할 때만 필요하며, `--bind here`에는 필요하지 않습니다.
- 다른 ACP 에이전트로 생성할 때 `--cwd`를 주지 않으면, OpenClaw는 기본적으로 **대상 에이전트의** 작업공간을 상속합니다. 상속된 경로가 없을 때(`ENOENT`/`ENOTDIR`)는 백엔드 기본값으로 폴백하고, 그 외 접근 오류(예: `EACCES`)는 생성 오류로 표면화됩니다.

### 스레드 바인딩 세션

채널 어댑터에서 스레드 바인딩이 활성화되면 ACP 세션은 스레드에 바인딩될 수 있습니다:

- OpenClaw가 스레드를 대상 ACP 세션에 바인딩함
- 해당 스레드의 후속 메시지는 바인딩된 ACP 세션으로 라우팅됨
- ACP 출력은 동일한 스레드로 다시 전달됨
- unfocus/close/archive/idle-timeout 또는 max-age 만료 시 바인딩이 제거됨

스레드 바인딩 지원은 어댑터별입니다. 활성 채널 어댑터가 스레드 바인딩을 지원하지 않으면 OpenClaw는 명확한 미지원/불가 메시지를 반환합니다.

스레드 바인딩 ACP에 필요한 기능 플래그:

- `acp.enabled=true`
- `acp.dispatch.enabled`는 기본적으로 켜져 있음 (`false`로 설정하면 ACP dispatch 일시 중지)
- 채널 어댑터 ACP thread-spawn 플래그 활성화 (어댑터별)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### 스레드를 지원하는 채널

- 세션/스레드 바인딩 capability를 노출하는 모든 채널 어댑터
- 현재 내장 지원:
  - Discord 스레드/채널
  - Telegram 토픽 (그룹/슈퍼그룹의 포럼 토픽 및 DM 토픽)
- Plugin 채널도 동일한 바인딩 인터페이스를 통해 지원을 추가할 수 있습니다.

## 채널별 설정

일시적이지 않은 워크플로에는 최상위 `bindings[]` 항목에 영속 ACP 바인딩을 구성하세요.

### 바인딩 모델

- `bindings[].type="acp"`는 영속 ACP 대화 바인딩을 표시합니다.
- `bindings[].match`는 대상 대화를 식별합니다:
  - Discord 채널 또는 스레드: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram 포럼 토픽: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/그룹 채팅: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    안정적인 그룹 바인딩에는 `chat_id:*` 또는 `chat_identifier:*`를 권장합니다.
  - iMessage DM/그룹 채팅: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    안정적인 그룹 바인딩에는 `chat_id:*`를 권장합니다.
- `bindings[].agentId`는 소유 OpenClaw 에이전트 ID입니다.
- 선택적 ACP 재정의는 `bindings[].acp` 아래에 있습니다:
  - `mode` (`persistent` 또는 `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### 에이전트별 런타임 기본값

에이전트별로 ACP 기본값을 한 번 정의하려면 `agents.list[].runtime`을 사용하세요:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (하네스 ID, 예: `codex` 또는 `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACP 바인딩 세션의 재정의 우선순위:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. 전역 ACP 기본값 (예: `acp.backend`)

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
- 해당 채널 또는 토픽의 메시지는 구성된 ACP 세션으로 라우팅됩니다.
- 바인딩된 대화에서는 `/new`와 `/reset`이 동일한 ACP 세션 키를 제자리에서 재설정합니다.
- 임시 런타임 바인딩(예: thread-focus 흐름으로 생성된 것)은 존재하는 경우 계속 적용됩니다.
- 명시적 `cwd`가 없는 교차 에이전트 ACP 생성의 경우, OpenClaw는 에이전트 구성에서 대상 에이전트 작업공간을 상속합니다.
- 상속된 작업공간 경로가 없으면 백엔드 기본 `cwd`로 폴백하고, 존재하는 경로에서의 실제 접근 실패는 생성 오류로 표면화됩니다.

## ACP 세션 시작 (인터페이스)

### `sessions_spawn`에서

에이전트 턴 또는 도구 호출에서 ACP 세션을 시작하려면 `runtime: "acp"`를 사용하세요.

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

- `runtime`의 기본값은 `subagent`이므로, ACP 세션에는 `runtime: "acp"`를 명시적으로 설정하세요.
- `agentId`를 생략하면 OpenClaw는 구성된 `acp.defaultAgent`를 사용합니다.
- `mode: "session"`은 영속적인 바인딩 대화를 유지하려면 `thread: true`가 필요합니다.

인터페이스 세부 정보:

- `task` (필수): ACP 세션에 보내는 초기 프롬프트
- `runtime` (ACP에 필수): `"acp"`여야 함
- `agentId` (선택 사항): ACP 대상 하네스 ID. 설정된 경우 `acp.defaultAgent`로 폴백
- `thread` (선택 사항, 기본값 `false`): 지원되는 경우 스레드 바인딩 흐름 요청
- `mode` (선택 사항): `run` (원샷) 또는 `session` (영속)
  - 기본값은 `run`
  - `thread: true`이고 mode를 생략하면 OpenClaw는 런타임 경로에 따라 영속 동작을 기본값으로 둘 수 있음
  - `mode: "session"`은 `thread: true`가 필요함
- `cwd` (선택 사항): 요청된 런타임 작업 디렉터리(백엔드/런타임 정책에 따라 검증됨). 생략하면 구성된 경우 ACP 생성은 대상 에이전트 작업공간을 상속합니다. 상속된 경로가 없으면 백엔드 기본값으로 폴백하고, 실제 접근 오류는 반환됩니다.
- `label` (선택 사항): 세션/배너 텍스트에 사용되는 운영자 대상 레이블
- `resumeSessionId` (선택 사항): 새 세션을 만드는 대신 기존 ACP 세션을 재개합니다. 에이전트는 `session/load`를 통해 대화 기록을 다시 재생합니다. `runtime: "acp"`가 필요합니다.
- `streamTo` (선택 사항): `"parent"`는 초기 ACP 실행 진행 요약을 시스템 이벤트로 요청자 세션에 다시 스트리밍합니다.
  - 사용 가능한 경우, 허용된 응답에는 전체 relay 기록을 tail할 수 있는 세션 범위 JSONL 로그(`<sessionId>.acp-stream.jsonl`)를 가리키는 `streamLogPath`가 포함됩니다.
- `model` (선택 사항): ACP 자식 세션에 대한 명시적 모델 재정의. `runtime: "acp"`일 때 적용되며, 자식이 대상 에이전트 기본값으로 조용히 폴백하지 않고 요청된 모델을 사용하게 합니다.

## 전달 모델

ACP 세션은 대화형 작업공간일 수도 있고 부모가 소유한 백그라운드 작업일 수도 있습니다. 전달 경로는 그 형태에 따라 달라집니다.

### 대화형 ACP 세션

대화형 세션은 보이는 채팅 표면에서 계속 대화하기 위한 것입니다:

- `/acp spawn ... --bind here`는 현재 대화를 ACP 세션에 바인딩합니다.
- `/acp spawn ... --thread ...`는 채널 스레드/토픽을 ACP 세션에 바인딩합니다.
- 영속적으로 구성된 `bindings[].type="acp"`는 일치하는 대화를 동일한 ACP 세션으로 라우팅합니다.

바인딩된 대화의 후속 메시지는 ACP 세션으로 직접 라우팅되고, ACP 출력은 동일한 채널/스레드/토픽으로 다시 전달됩니다.

### 부모가 소유한 원샷 ACP 세션

다른 에이전트 실행이 생성한 원샷 ACP 세션은 하위 에이전트와 유사한 백그라운드 자식입니다:

- 부모는 `sessions_spawn({ runtime: "acp", mode: "run" })`로 작업을 요청합니다.
- 자식은 자신의 ACP 하네스 세션에서 실행됩니다.
- 완료는 내부 task-completion announce 경로를 통해 다시 보고됩니다.
- 사용자에게 보이는 응답이 유용할 때 부모는 자식 결과를 일반 어시스턴트 음성으로 다시 작성합니다.

이 경로를 부모와 자식 사이의 peer-to-peer 채팅처럼 취급하지 마세요. 자식은 이미 부모에게 되돌아가는 완료 채널을 갖고 있습니다.

### `sessions_send`와 A2A 전달

`sessions_send`는 생성 후 다른 세션을 대상으로 할 수 있습니다. 일반 peer 세션의 경우, OpenClaw는 메시지를 주입한 후 에이전트 간(A2A) 후속 경로를 사용합니다:

- 대상 세션의 응답을 기다림
- 선택적으로 요청자와 대상이 제한된 횟수만큼 후속 턴을 교환하게 함
- 대상에게 announce 메시지를 생성하도록 요청
- 해당 announce를 보이는 채널 또는 스레드에 전달

이 A2A 경로는 발신자가 보이는 후속 응답이 필요할 때 peer 전송을 위한 폴백입니다. 예를 들어 넓은 `tools.sessions.visibility` 설정 아래에서 관련 없는 세션이 ACP 대상을 보고 메시지를 보낼 수 있을 때도 계속 활성화됩니다.

OpenClaw는 요청자가 자신이 소유한 부모 소유 원샷 ACP 자식의 부모일 때만 A2A 후속 처리를 건너뜁니다. 이 경우 task completion 위에 A2A를 실행하면 부모가 자식 결과로 깨어나고, 부모의 응답을 다시 자식에게 전달하여 부모/자식 echo 루프를 만들 수 있습니다. `sessions_send` 결과는 그 소유 자식 경우에 `delivery.status="skipped"`를 보고하는데, 이는 완료 경로가 이미 결과를 책임지기 때문입니다.

### 기존 세션 재개

새로 시작하는 대신 이전 ACP 세션을 계속하려면 `resumeSessionId`를 사용하세요. 에이전트는 `session/load`를 통해 대화 기록을 다시 재생하므로, 이전 컨텍스트를 모두 이어받습니다.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

일반적인 사용 사례:

- 노트북에서 하던 Codex 세션을 휴대폰으로 넘기기 — 에이전트에게 이어서 작업하게 함
- CLI에서 대화형으로 시작한 코딩 세션을 이제 에이전트를 통해 헤드리스로 계속하기
- Gateway 재시작 또는 idle timeout으로 중단된 작업 이어가기

참고:

- `resumeSessionId`는 `runtime: "acp"`가 필요하며, 하위 에이전트 런타임과 함께 사용하면 오류를 반환합니다.
- `resumeSessionId`는 업스트림 ACP 대화 기록을 복원합니다. `thread`와 `mode`는 여전히 새로 만드는 OpenClaw 세션에 정상적으로 적용되므로, `mode: "session"`은 여전히 `thread: true`가 필요합니다.
- 대상 에이전트는 `session/load`를 지원해야 합니다 (Codex와 Claude Code는 지원).
- 세션 ID를 찾지 못하면 생성은 명확한 오류와 함께 실패합니다 — 새 세션으로 조용히 폴백하지 않습니다.

<Accordion title="배포 후 스모크 테스트">

Gateway 배포 후에는 단위 테스트만 믿지 말고 실제 라이브 엔드 투 엔드 확인을 실행하세요:

1. 대상 호스트에서 배포된 Gateway 버전과 커밋을 확인합니다.
2. 라이브 에이전트에 대한 임시 ACPX 브리지 세션을 엽니다.
3. 해당 에이전트에게 `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` 및 `Reply with exactly LIVE-ACP-SPAWN-OK` 작업으로 `sessions_spawn`을 호출하게 합니다.
4. `accepted=yes`, 실제 `childSessionKey`, validator 오류 없음이 확인되는지 검증합니다.
5. 임시 브리지 세션을 정리합니다.

게이트는 `mode: "run"`으로 유지하고 `streamTo: "parent"`는 건너뛰세요 — 스레드 바인딩 `mode: "session"`과 stream-relay 경로는 별도의 더 풍부한 통합 패스입니다.

</Accordion>

## 샌드박스 호환성

ACP 세션은 현재 OpenClaw 샌드박스 내부가 아니라 호스트 런타임에서 실행됩니다.

현재 제한 사항:

- 요청자 세션이 샌드박스 안에 있으면, `sessions_spawn({ runtime: "acp" })`와 `/acp spawn` 모두에서 ACP 생성이 차단됩니다.
  - 오류: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `runtime: "acp"`와 함께 사용하는 `sessions_spawn`은 `sandbox: "require"`를 지원하지 않습니다.
  - 오류: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

샌드박스 강제 실행이 필요하면 `runtime: "subagent"`를 사용하세요.

### `/acp` 명령에서

필요할 때 채팅에서 명시적인 운영자 제어를 위해 `/acp spawn`을 사용하세요.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

핵심 플래그:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

[슬래시 명령](/ko/tools/slash-commands)을 참조하세요.

## 세션 대상 확인

대부분의 `/acp` 작업은 선택적 세션 대상(`session-key`, `session-id`, 또는 `session-label`)을 받습니다.

확인 순서:

1. 명시적 대상 인수(또는 `/acp steer`의 `--session`)
   - 먼저 key 시도
   - 그다음 UUID 형태의 session id 시도
   - 그다음 label 시도
2. 현재 스레드 바인딩(현재 대화/스레드가 ACP 세션에 바인딩된 경우)
3. 현재 요청자 세션 폴백

현재 대화 바인딩과 스레드 바인딩은 모두 2단계에 참여합니다.

대상을 확인할 수 없으면 OpenClaw는 명확한 오류를 반환합니다 (`Unable to resolve session target: ...`).

## 생성 bind 모드

`/acp spawn`은 `--bind here|off`를 지원합니다.

| 모드   | 동작                                                                 |
| ------ | -------------------------------------------------------------------- |
| `here` | 현재 활성 대화를 제자리에서 바인딩하며, 활성 대화가 없으면 실패     |
| `off`  | 현재 대화 바인딩을 만들지 않음                                       |

참고:

- `--bind here`는 “이 채널 또는 채팅을 Codex 기반으로 만들어라”의 가장 단순한 운영자 경로입니다.
- `--bind here`는 자식 스레드를 만들지 않습니다.
- `--bind here`는 현재 대화 바인딩 지원을 노출하는 채널에서만 사용 가능합니다.
- `--bind`와 `--thread`는 같은 `/acp spawn` 호출에서 함께 사용할 수 없습니다.

## 생성 thread 모드

`/acp spawn`은 `--thread auto|here|off`를 지원합니다.

| 모드   | 동작                                                                                               |
| ------ | -------------------------------------------------------------------------------------------------- |
| `auto` | 활성 스레드 안에서는 해당 스레드에 바인딩. 스레드 밖에서는 지원되는 경우 자식 스레드를 생성/바인딩 |
| `here` | 현재 활성 스레드가 필요하며, 스레드 안이 아니면 실패                                               |
| `off`  | 바인딩 없음. 세션은 바인딩되지 않은 상태로 시작                                                    |

참고:

- 스레드 바인딩이 없는 표면에서는 기본 동작이 사실상 `off`입니다.
- 스레드 바인딩 생성에는 채널 정책 지원이 필요합니다:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- 자식 스레드를 만들지 않고 현재 대화를 고정하려면 `--bind here`를 사용하세요.

## ACP 제어

| 명령                 | 하는 일                                                   | 예시                                                          |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP 세션 생성; 선택적으로 현재 바인딩 또는 스레드 바인딩. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 대상 세션의 진행 중 턴 취소                               | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 실행 중 세션에 steer 지시 전송                            | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 세션 닫기 및 스레드 대상 바인딩 해제                      | `/acp close`                                                  |
| `/acp status`        | 백엔드, 모드, 상태, 런타임 옵션, capability 표시          | `/acp status`                                                 |
| `/acp set-mode`      | 대상 세션의 런타임 모드 설정                              | `/acp set-mode plan`                                          |
| `/acp set`           | 일반 런타임 구성 옵션 기록                                | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 런타임 작업 디렉터리 재정의 설정                          | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 승인 정책 프로필 설정                                     | `/acp permissions strict`                                     |
| `/acp timeout`       | 런타임 시간 초과(초) 설정                                 | `/acp timeout 120`                                            |
| `/acp model`         | 런타임 모델 재정의 설정                                   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 세션 런타임 옵션 재정의 제거                              | `/acp reset-options`                                          |
| `/acp sessions`      | 저장소에서 최근 ACP 세션 목록 표시                        | `/acp sessions`                                               |
| `/acp doctor`        | 백엔드 상태, capability, 실행 가능한 수정안               | `/acp doctor`                                                 |
| `/acp install`       | 결정적인 설치 및 활성화 단계 출력                         | `/acp install`                                                |

`/acp status`는 유효 런타임 옵션과 런타임 수준 및 백엔드 수준 세션 식별자를 함께 표시합니다. 백엔드에 capability가 없을 때는 unsupported-control 오류가 명확히 표시됩니다. `/acp sessions`는 현재 바인딩되었거나 요청자 세션에 대한 저장소를 읽습니다. 대상 토큰(`session-key`, `session-id`, 또는 `session-label`)은 사용자 지정 에이전트별 `session.store` 루트를 포함한 Gateway 세션 탐색을 통해 확인됩니다.

## 런타임 옵션 매핑

`/acp`에는 편의 명령과 일반 setter가 있습니다.

동등한 작업:

- `/acp model <id>`는 런타임 config 키 `model`에 매핑됩니다.
- `/acp permissions <profile>`은 런타임 config 키 `approval_policy`에 매핑됩니다.
- `/acp timeout <seconds>`는 런타임 config 키 `timeout`에 매핑됩니다.
- `/acp cwd <path>`는 런타임 `cwd` 재정의를 직접 업데이트합니다.
- `/acp set <key> <value>`는 일반 경로입니다.
  - 특수 사례: `key=cwd`는 `cwd` 재정의 경로를 사용합니다.
- `/acp reset-options`는 대상 세션의 모든 런타임 재정의를 지웁니다.

## acpx 하네스, Plugin 설정, 권한

acpx 하네스 구성(Claude Code / Codex / Gemini CLI 별칭), `plugin-tools` 및 OpenClaw-tools MCP 브리지, ACP 권한 모드에 대해서는
[ACP 에이전트 — 설정](/ko/tools/acp-agents-setup)을 참조하세요.

## 문제 해결

| 증상                                                                        | 가능한 원인                                                                    | 해결 방법                                                                                                                                                                   |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | 백엔드 Plugin이 없거나 비활성화됨                                              | 백엔드 Plugin을 설치하고 활성화한 다음 `/acp doctor`를 실행하세요.                                                                                                         |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP가 전역적으로 비활성화됨                                                    | `acp.enabled=true`를 설정하세요.                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 일반 스레드 메시지에서의 dispatch가 비활성화됨                                 | `acp.dispatch.enabled=true`를 설정하세요.                                                                                                                                  |
| `ACP agent "<id>" is not allowed by policy`                                 | 에이전트가 allowlist에 없음                                                    | 허용된 `agentId`를 사용하거나 `acp.allowedAgents`를 업데이트하세요.                                                                                                         |
| `Unable to resolve session target: ...`                                     | 잘못된 key/id/label 토큰                                                       | `/acp sessions`를 실행하고 정확한 key/label을 복사한 뒤 다시 시도하세요.                                                                                                   |
| `--bind here requires running /acp spawn inside an active ... conversation` | 활성 상태의 바인딩 가능한 대화 없이 `--bind here` 사용                         | 대상 채팅/채널로 이동해 다시 시도하거나, 바인딩 없는 생성을 사용하세요.                                                                                                     |
| `Conversation bindings are unavailable for <channel>.`                      | 어댑터에 현재 대화 ACP 바인딩 capability가 없음                                | 지원되는 경우 `/acp spawn ... --thread ...`를 사용하거나, 최상위 `bindings[]`를 구성하거나, 지원되는 채널로 이동하세요.                                                   |
| `--thread here requires running /acp spawn inside an active ... thread`     | 스레드 컨텍스트 밖에서 `--thread here` 사용                                   | 대상 스레드로 이동하거나 `--thread auto`/`off`를 사용하세요.                                                                                                               |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 다른 사용자가 활성 바인딩 대상을 소유함                                        | 소유자로 다시 바인딩하거나 다른 대화 또는 스레드를 사용하세요.                                                                                                             |
| `Thread bindings are unavailable for <channel>.`                            | 어댑터에 스레드 바인딩 capability가 없음                                       | `--thread off`를 사용하거나 지원되는 어댑터/채널로 이동하세요.                                                                                                             |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP 런타임은 호스트 측이며, 요청자 세션은 샌드박스 안에 있음                   | 샌드박스 세션에서는 `runtime="subagent"`를 사용하거나, 샌드박스가 아닌 세션에서 ACP 생성을 실행하세요.                                                                    |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP 런타임에 `sandbox="require"`가 요청됨                                      | 필수 샌드박싱에는 `runtime="subagent"`를 사용하거나, 샌드박스가 아닌 세션에서 ACP를 `sandbox="inherit"`와 함께 사용하세요.                                                |
| 바인딩된 세션에 ACP 메타데이터가 없음                                       | 오래되었거나 삭제된 ACP 세션 메타데이터                                        | `/acp spawn`으로 다시 만들고, 그다음 스레드를 다시 바인딩/focus 하세요.                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode`가 비대화형 ACP 세션에서 쓰기/exec를 차단함                    | `plugins.entries.acpx.config.permissionMode`를 `approve-all`로 설정하고 Gateway를 다시 시작하세요. [권한 구성](/ko/tools/acp-agents-setup#permission-configuration)을 참조하세요. |
| ACP 세션이 출력이 거의 없는 상태로 초기에 실패함                            | 권한 프롬프트가 `permissionMode`/`nonInteractivePermissions`에 의해 차단됨     | `AcpRuntimeError`는 Gateway 로그에서 확인하세요. 전체 권한을 원하면 `permissionMode=approve-all`, 점진적 저하를 원하면 `nonInteractivePermissions=deny`를 설정하세요.         |
| 작업 완료 후 ACP 세션이 무기한 멈춤                                         | 하네스 프로세스는 끝났지만 ACP 세션이 완료를 보고하지 않음                     | `ps aux \| grep acpx`로 모니터링하고, 오래된 프로세스를 수동으로 종료하세요.                                                                                               |

## 관련

- [하위 에이전트](/ko/tools/subagents)
- [다중 에이전트 샌드박스 도구](/ko/tools/multi-agent-sandbox-tools)
- [에이전트 전송](/ko/tools/agent-send)
