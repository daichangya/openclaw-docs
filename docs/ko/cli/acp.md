---
read_when:
    - ACP 기반 IDE 통합 설정하기
    - Gateway로의 ACP 세션 라우팅 디버깅하기
summary: IDE 통합을 위해 ACP 브리지를 실행하기
title: ACP
x-i18n:
    generated_at: "2026-04-24T06:06:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88b4d5de9e8e7464fd929ace0471af7d85afc94789c0c45a1f4a00d39b7871e1
    source_path: cli/acp.md
    workflow: 15
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 브리지를 실행해 OpenClaw Gateway와 통신합니다.

이 명령은 IDE용으로 stdio를 통해 ACP를 사용하며 프롬프트를 WebSocket으로 Gateway에 전달합니다. ACP 세션은 Gateway 세션 키에 매핑된 상태로 유지됩니다.

`openclaw acp`는 Gateway 기반 ACP 브리지이며, 완전한 ACP 네이티브 에디터 런타임은 아닙니다. 이 명령은 세션 라우팅, 프롬프트 전달, 기본적인 스트리밍 업데이트에 중점을 둡니다.

외부 MCP 클라이언트가 ACP 하네스 세션을 호스팅하는 대신 OpenClaw 채널 대화에 직접 연결되도록 하려면 [`openclaw mcp serve`](/ko/cli/mcp)를 대신 사용하세요.

## 이것이 아닌 것

이 페이지는 ACP 하네스 세션과 자주 혼동됩니다.

`openclaw acp`의 의미:

- OpenClaw가 ACP 서버 역할을 함
- IDE 또는 ACP 클라이언트가 OpenClaw에 연결함
- OpenClaw가 해당 작업을 Gateway 세션으로 전달함

이는 OpenClaw가 `acpx`를 통해 Codex나 Claude Code 같은 외부 하네스를 실행하는 [ACP Agents](/ko/tools/acp-agents)와 다릅니다.

빠른 규칙:

- 에디터/클라이언트가 ACP로 OpenClaw와 통신하려는 경우: `openclaw acp` 사용
- OpenClaw가 Codex/Claude/Gemini를 ACP 하네스로 실행해야 하는 경우: `/acp spawn` 및 [ACP Agents](/ko/tools/acp-agents) 사용

## 호환성 매트릭스

| ACP 영역                                                              | 상태        | 참고                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | 구현됨      | stdio를 통한 Gateway chat/send + abort의 핵심 브리지 흐름입니다.                                                                                                                                                                                 |
| `listSessions`, 슬래시 명령                                           | 구현됨      | 세션 목록은 Gateway 세션 상태를 기준으로 작동하며, 명령은 `available_commands_update`를 통해 광고됩니다.                                                                                                                                         |
| `loadSession`                                                         | 부분 지원   | ACP 세션을 Gateway 세션 키에 다시 바인딩하고 저장된 사용자/어시스턴트 텍스트 기록을 재생합니다. 도구/시스템 기록은 아직 재구성되지 않습니다.                                                                                                  |
| 프롬프트 콘텐츠(`text`, 포함된 `resource`, 이미지)                   | 부분 지원   | 텍스트/리소스는 채팅 입력으로 평탄화되고, 이미지는 Gateway 첨부 파일이 됩니다.                                                                                                                                                                   |
| 세션 모드                                                             | 부분 지원   | `session/set_mode`가 지원되며 브리지는 thought level, 도구 verbosity, reasoning, usage detail, elevated actions를 위한 초기 Gateway 기반 세션 제어를 노출합니다. 더 넓은 ACP 네이티브 모드/구성 표면은 아직 범위 밖입니다.                    |
| 세션 정보 및 사용량 업데이트                                          | 부분 지원   | 브리지는 캐시된 Gateway 세션 스냅샷에서 `session_info_update` 및 best-effort `usage_update` 알림을 내보냅니다. 사용량은 대략적이며 Gateway 토큰 합계가 최신으로 표시될 때만 전송됩니다.                                                           |
| 도구 스트리밍                                                         | 부분 지원   | `tool_call` / `tool_call_update` 이벤트에는 Gateway 도구 인수/결과가 이를 노출할 때 원시 I/O, 텍스트 콘텐츠, best-effort 파일 위치가 포함됩니다. 포함된 터미널 및 더 풍부한 diff 네이티브 출력은 아직 노출되지 않습니다.                         |
| 세션별 MCP 서버(`mcpServers`)                                         | 미지원      | 브리지 모드는 세션별 MCP 서버 요청을 거부합니다. 대신 OpenClaw Gateway 또는 에이전트에서 MCP를 구성하세요.                                                                                                                                      |
| 클라이언트 파일 시스템 메서드(`fs/read_text_file`, `fs/write_text_file`) | 미지원   | 브리지는 ACP 클라이언트 파일 시스템 메서드를 호출하지 않습니다.                                                                                                                                                                                  |
| 클라이언트 터미널 메서드(`terminal/*`)                                | 미지원      | 브리지는 ACP 클라이언트 터미널을 생성하거나 도구 호출을 통해 터미널 ID를 스트리밍하지 않습니다.                                                                                                                                                 |
| 세션 계획 / 사고 스트리밍                                             | 미지원      | 브리지는 현재 출력 텍스트와 도구 상태를 내보내며 ACP 계획 또는 사고 업데이트는 내보내지 않습니다.                                                                                                                                               |

## 알려진 제한 사항

- `loadSession`은 저장된 사용자 및 어시스턴트 텍스트 기록을 재생하지만,
  과거 도구 호출, 시스템 공지, 또는 더 풍부한 ACP 네이티브 이벤트 유형은
  재구성하지 않습니다.
- 여러 ACP 클라이언트가 동일한 Gateway 세션 키를 공유하면, 이벤트 및 취소
  라우팅은 클라이언트별로 엄격히 격리되지 않고 best-effort 방식으로 동작합니다.
  에디터 로컬 턴을 깔끔하게 유지하려면 기본 격리 `acp:<uuid>` 세션을
  권장합니다.
- Gateway 중지 상태는 ACP 중지 사유로 변환되지만, 그 매핑은 완전한
  ACP 네이티브 런타임보다 표현력이 떨어집니다.
- 초기 세션 제어는 현재 Gateway 노브의 일부에만 집중해 노출합니다:
  thought level, 도구 verbosity, reasoning, usage detail, elevated
  actions. 모델 선택 및 exec-host 제어는 아직 ACP 구성 옵션으로
  노출되지 않습니다.
- `session_info_update` 및 `usage_update`는 라이브 ACP 네이티브 런타임
  계정 정보가 아니라 Gateway 세션 스냅샷에서 파생됩니다. 사용량은 대략적이며
  비용 데이터는 포함하지 않고, Gateway가 총 토큰 데이터를 최신으로 표시할 때만
  내보내집니다.
- 도구 추적 데이터는 best-effort입니다. 브리지는 알려진 도구 인수/결과에
  나타나는 파일 경로를 노출할 수 있지만, ACP 터미널이나 구조화된 파일 diff는
  아직 내보내지 않습니다.

## 사용법

```bash
openclaw acp

# 원격 Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# 원격 Gateway(파일에서 토큰 읽기)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 기존 세션 키에 연결
openclaw acp --session agent:main:main

# 레이블로 연결(이미 존재해야 함)
openclaw acp --session-label "support inbox"

# 첫 번째 프롬프트 전에 세션 키 재설정
openclaw acp --session agent:main:main --reset-session
```

## ACP 클라이언트(디버그)

내장 ACP 클라이언트를 사용하면 IDE 없이 브리지를 정상 동작 확인할 수 있습니다.
이 클라이언트는 ACP 브리지를 생성하고 프롬프트를 대화형으로 입력할 수 있게 해줍니다.

```bash
openclaw acp client

# 생성된 브리지가 원격 Gateway를 가리키게 함
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 서버 명령 재정의(기본값: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

권한 모델(클라이언트 디버그 모드):

- 자동 승인은 허용 목록 기반이며 신뢰된 핵심 도구 ID에만 적용됩니다.
- `read` 자동 승인은 현재 작업 디렉터리(`--cwd`가 설정된 경우)로 범위가 제한됩니다.
- ACP는 활성 cwd 아래의 범위 제한 `read` 호출과 읽기 전용 검색 도구(`search`, `web_search`, `memory_search`) 같은 좁은 읽기 전용 클래스만 자동 승인합니다. 알 수 없거나 비핵심 도구, 범위 밖 읽기, exec 가능 도구, control-plane 도구, 변경 도구, 대화형 흐름은 항상 명시적 프롬프트 승인이 필요합니다.
- 서버가 제공하는 `toolCall.kind`는 신뢰되지 않는 메타데이터로 취급됩니다(권한 부여 소스 아님).
- 이 ACP 브리지 정책은 ACPX 하네스 권한과 별개입니다. `acpx` 백엔드를 통해 OpenClaw를 실행하는 경우, `plugins.entries.acpx.config.permissionMode=approve-all`이 해당 하네스 세션의 비상용 “yolo” 스위치입니다.

## 사용 방법

IDE(또는 다른 클라이언트)가 Agent Client Protocol을 사용하고 OpenClaw Gateway 세션을 구동하게 하려면 ACP를 사용하세요.

1. Gateway가 실행 중인지 확인합니다(로컬 또는 원격).
2. Gateway 대상을 구성합니다(구성 또는 플래그).
3. IDE가 stdio를 통해 `openclaw acp`를 실행하도록 지정합니다.

예시 구성(영구 저장):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

직접 실행 예시(구성 쓰기 없음):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# 로컬 프로세스 안전성을 위해 권장
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## 에이전트 선택

ACP는 에이전트를 직접 선택하지 않습니다. Gateway 세션 키로 라우팅합니다.

특정 에이전트를 대상으로 하려면 에이전트 범위 세션 키를 사용하세요:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

각 ACP 세션은 하나의 Gateway 세션 키에 매핑됩니다. 하나의 에이전트는 많은
세션을 가질 수 있으며, 키나 레이블을 재정의하지 않으면 ACP는 기본적으로 격리된
`acp:<uuid>` 세션을 사용합니다.

브리지 모드에서는 세션별 `mcpServers`가 지원되지 않습니다. ACP 클라이언트가
`newSession` 또는 `loadSession` 중 이를 보내면, 브리지는 이를 조용히 무시하지
않고 명확한 오류를 반환합니다.

ACPX 기반 세션이 OpenClaw Plugin 도구나 `cron` 같은 선택된 내장 도구를 보게
하려면, 세션별 `mcpServers`를 전달하려 하지 말고 Gateway 측 ACPX MCP 브리지를
활성화하세요. [ACP Agents](/ko/tools/acp-agents-setup#plugin-tools-mcp-bridge) 및
[OpenClaw 도구 MCP 브리지](/ko/tools/acp-agents-setup#openclaw-tools-mcp-bridge)를
참조하세요.

## `acpx`에서 사용하기(Codex, Claude, 기타 ACP 클라이언트)

Codex나 Claude Code 같은 코딩 에이전트가 ACP를 통해 OpenClaw 봇과 통신하게 하려면,
내장 `openclaw` 대상을 가진 `acpx`를 사용하세요.

일반적인 흐름:

1. Gateway를 실행하고 ACP 브리지가 여기에 도달할 수 있는지 확인합니다.
2. `acpx openclaw`가 `openclaw acp`를 가리키도록 합니다.
3. 코딩 에이전트가 사용할 OpenClaw 세션 키를 지정합니다.

예시:

```bash
# 기본 OpenClaw ACP 세션으로 원샷 요청
acpx openclaw exec "활성 OpenClaw 세션 상태를 요약해줘."

# 후속 턴을 위한 영구 이름 세션
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "이 저장소와 관련된 최근 컨텍스트를 내 OpenClaw 작업 에이전트에 물어봐."
```

`acpx openclaw`가 항상 특정 Gateway와 세션 키를 대상으로 하게 하려면
`~/.acpx/config.json`에서 `openclaw` 에이전트 명령을 재정의하세요:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

저장소 로컬 OpenClaw 체크아웃의 경우 ACP 스트림이 깨끗하게 유지되도록
개발 러너 대신 직접 CLI 진입점을 사용하세요. 예:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

이 방법은 Codex, Claude Code 또는 다른 ACP 인식 클라이언트가 터미널을 스크래핑하지 않고도 OpenClaw 에이전트에서 컨텍스트 정보를 가져오게 하는 가장 쉬운 방법입니다.

## Zed 에디터 설정

`~/.config/zed/settings.json`에 커스텀 ACP 에이전트를 추가합니다(또는 Zed의 설정 UI 사용):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

특정 Gateway 또는 에이전트를 대상으로 하려면:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Zed에서 Agent 패널을 열고 “OpenClaw ACP”를 선택해 스레드를 시작하세요.

## 세션 매핑

기본적으로 ACP 세션은 `acp:` 접두사가 붙은 격리된 Gateway 세션 키를 받습니다.
알려진 세션을 재사용하려면 세션 키 또는 레이블을 전달하세요:

- `--session <key>`: 특정 Gateway 세션 키를 사용합니다.
- `--session-label <label>`: 레이블로 기존 세션을 확인합니다.
- `--reset-session`: 해당 키에 대해 새 세션 ID를 발급합니다(같은 키, 새 전사).

ACP 클라이언트가 메타데이터를 지원한다면 세션별로 재정의할 수 있습니다:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

세션 키에 대한 자세한 내용은 [/concepts/session](/ko/concepts/session)에서 확인하세요.

## 옵션

- `--url <url>`: Gateway WebSocket URL(구성된 경우 `gateway.remote.url`이 기본값).
- `--token <token>`: Gateway 인증 토큰.
- `--token-file <path>`: 파일에서 Gateway 인증 토큰을 읽습니다.
- `--password <password>`: Gateway 인증 비밀번호.
- `--password-file <path>`: 파일에서 Gateway 인증 비밀번호를 읽습니다.
- `--session <key>`: 기본 세션 키.
- `--session-label <label>`: 확인할 기본 세션 레이블.
- `--require-existing`: 세션 키/레이블이 없으면 실패합니다.
- `--reset-session`: 첫 사용 전에 세션 키를 재설정합니다.
- `--no-prefix-cwd`: 프롬프트 앞에 작업 디렉터리를 붙이지 않습니다.
- `--provenance <off|meta|meta+receipt>`: ACP provenance 메타데이터 또는 영수증을 포함합니다.
- `--verbose, -v`: stderr에 자세한 로그를 출력합니다.

보안 참고:

- `--token` 및 `--password`는 일부 시스템에서 로컬 프로세스 목록에 보일 수 있습니다.
- `--token-file`/`--password-file` 또는 환경 변수(`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`)를 권장합니다.
- Gateway 인증 확인은 다른 Gateway 클라이언트가 사용하는 공유 계약을 따릅니다:
  - 로컬 모드: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.auth.*`가 설정되지 않은 경우에만 `gateway.remote.*` 폴백(구성되었지만 확인되지 않은 로컬 SecretRefs는 fail closed)
  - 원격 모드: 원격 우선순위 규칙에 따른 env/config 폴백과 함께 `gateway.remote.*`
  - `--url`은 override-safe이며 암시적 config/env 자격 증명을 재사용하지 않습니다. 명시적인 `--token`/`--password`(또는 파일 변형)를 전달하세요.
- ACP 런타임 백엔드 자식 프로세스는 `OPENCLAW_SHELL=acp`를 받으며, 이는 컨텍스트별 셸/프로필 규칙에 사용할 수 있습니다.
- `openclaw acp client`는 생성된 브리지 프로세스에 `OPENCLAW_SHELL=acp-client`를 설정합니다.

### `acp client` 옵션

- `--cwd <dir>`: ACP 세션의 작업 디렉터리.
- `--server <command>`: ACP 서버 명령(기본값: `openclaw`).
- `--server-args <args...>`: ACP 서버에 전달되는 추가 인수.
- `--server-verbose`: ACP 서버에서 자세한 로그를 활성화합니다.
- `--verbose, -v`: 자세한 클라이언트 로그.

## 관련

- [CLI 참조](/ko/cli)
- [ACP 에이전트](/ko/tools/acp-agents)
