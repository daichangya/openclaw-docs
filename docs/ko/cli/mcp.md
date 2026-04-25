---
read_when:
    - Codex, Claude Code 또는 다른 MCP 클라이언트를 OpenClaw 기반 채널에 연결합니다.
    - '`openclaw mcp serve` 실행 중'
    - OpenClaw에 저장된 MCP 서버 정의를 관리합니다.
summary: MCP를 통해 OpenClaw 채널 대화를 노출하고 저장된 MCP 서버 정의를 관리합니다.
title: MCP
x-i18n:
    generated_at: "2026-04-25T12:24:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca2a76d1dbca71b4048659c21ac7ff98a01cc6095f6baad67df5347f45cd32e6
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp`에는 두 가지 역할이 있습니다.

- `openclaw mcp serve`로 OpenClaw를 MCP 서버로 실행
- `list`, `show`, `set`, `unset`으로 OpenClaw가 소유한 아웃바운드 MCP 서버 정의 관리

즉:

- `serve`는 OpenClaw가 MCP 서버로 동작하는 경우입니다
- `list` / `show` / `set` / `unset`은 OpenClaw가 나중에 해당 런타임이 사용할 수 있는 다른 MCP 서버를 위한 MCP 클라이언트 측 레지스트리로 동작하는 경우입니다

OpenClaw가 직접 코딩 harness 세션을 호스팅하고 그 런타임을 ACP를 통해 라우팅해야 한다면 [`openclaw acp`](/ko/cli/acp)를 사용하세요.

## OpenClaw를 MCP 서버로 사용

이 경로는 `openclaw mcp serve`입니다.

## `serve`를 사용하는 경우

다음과 같은 경우 `openclaw mcp serve`를 사용하세요.

- Codex, Claude Code 또는 다른 MCP 클라이언트가 OpenClaw 기반 채널 대화와 직접 통신해야 하는 경우
- 이미 라우팅된 세션이 있는 로컬 또는 원격 OpenClaw Gateway가 있는 경우
- 채널별 브리지를 각각 실행하는 대신 OpenClaw의 채널 백엔드 전반에서 동작하는 하나의 MCP 서버를 원하는 경우

OpenClaw가 코딩 런타임 자체를 호스팅하고 에이전트 세션을 OpenClaw 내부에 유지해야 한다면 대신 [`openclaw acp`](/ko/cli/acp)를 사용하세요.

## 작동 방식

`openclaw mcp serve`는 stdio MCP 서버를 시작합니다. MCP 클라이언트가 해당 프로세스를 소유합니다. 클라이언트가 stdio 세션을 열어 두는 동안, 브리지는 WebSocket을 통해 로컬 또는 원격 OpenClaw Gateway에 연결하고 라우팅된 채널 대화를 MCP를 통해 노출합니다.

수명 주기:

1. MCP 클라이언트가 `openclaw mcp serve`를 시작함
2. 브리지가 Gateway에 연결됨
3. 라우팅된 세션이 MCP 대화 및 transcript/history 도구가 됨
4. 브리지가 연결된 동안 라이브 이벤트가 메모리에 큐잉됨
5. Claude 채널 모드가 활성화되어 있으면 동일한 세션이 Claude 전용 푸시 알림도 받을 수 있음

중요한 동작:

- 라이브 큐 상태는 브리지가 연결될 때 시작됩니다
- 이전 transcript 기록은 `messages_read`로 읽습니다
- Claude 푸시 알림은 MCP 세션이 살아 있는 동안에만 존재합니다
- 클라이언트가 연결을 끊으면 브리지는 종료되고 라이브 큐도 사라집니다
- `openclaw agent` 및 `openclaw infer model run` 같은 일회성 에이전트 진입점은 응답이 완료되면 자신이 연 번들 MCP 런타임을 종료하므로, 반복적인 스크립트 실행에서도 stdio MCP 자식 프로세스가 누적되지 않습니다
- OpenClaw가 시작한 stdio MCP 서버(번들 또는 사용자 구성)는 종료 시 프로세스 트리로 정리되므로, 서버가 시작한 자식 하위 프로세스는 부모 stdio 클라이언트가 종료된 뒤에도 살아남지 않습니다
- 세션을 삭제하거나 재설정하면 공유 런타임 정리 경로를 통해 해당 세션의 MCP 클라이언트도 함께 정리되므로, 제거된 세션에 연결된 stdio 연결이 남지 않습니다

## 클라이언트 모드 선택

동일한 브리지를 두 가지 방식으로 사용할 수 있습니다.

- 일반 MCP 클라이언트: 표준 MCP 도구만 사용합니다. `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` 및 승인 도구를 사용하세요.
- Claude Code: 표준 MCP 도구와 Claude 전용 채널 어댑터를 함께 사용합니다. `--claude-channel-mode on`을 활성화하거나 기본값인 `auto`를 그대로 두세요.

현재 `auto`는 `on`과 동일하게 동작합니다. 아직 클라이언트 기능 감지는 없습니다.

## `serve`가 노출하는 것

브리지는 기존 Gateway 세션 경로 메타데이터를 사용해 채널 기반 대화를 노출합니다. OpenClaw에 다음과 같은 알려진 경로가 포함된 세션 상태가 이미 있을 때 대화가 표시됩니다.

- `channel`
- 수신자 또는 대상 메타데이터
- 선택적 `accountId`
- 선택적 `threadId`

이를 통해 MCP 클라이언트는 한곳에서 다음을 수행할 수 있습니다.

- 최근 라우팅된 대화 나열
- 최근 transcript 기록 읽기
- 새 인바운드 이벤트 대기
- 동일한 경로로 다시 응답 전송
- 브리지가 연결되어 있는 동안 도착한 승인 요청 확인

## 사용법

```bash
# 로컬 Gateway
openclaw mcp serve

# 원격 Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 비밀번호 인증을 사용하는 원격 Gateway
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# 자세한 브리지 로그 활성화
openclaw mcp serve --verbose

# Claude 전용 푸시 알림 비활성화
openclaw mcp serve --claude-channel-mode off
```

## 브리지 도구

현재 브리지는 다음 MCP 도구를 노출합니다.

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Gateway 세션 상태에 이미 경로 메타데이터가 있는 최근 세션 기반 대화를 나열합니다.

유용한 필터:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

`session_key`로 대화 하나를 반환합니다.

### `messages_read`

세션 기반 대화 하나의 최근 transcript 메시지를 읽습니다.

### `attachments_fetch`

transcript 메시지 하나에서 비텍스트 메시지 콘텐츠 블록을 추출합니다. 이는 독립적인 영구 첨부파일 blob 저장소가 아니라 transcript 콘텐츠에 대한 메타데이터 뷰입니다.

### `events_poll`

숫자 커서 이후 큐에 들어온 라이브 이벤트를 읽습니다.

### `events_wait`

다음으로 일치하는 큐 이벤트가 도착하거나 제한 시간이 만료될 때까지 롱 폴링합니다.

일반 MCP 클라이언트가 Claude 전용 푸시 프로토콜 없이 거의 실시간 전달이 필요할 때 사용하세요.

### `messages_send`

세션에 이미 기록된 동일한 경로를 통해 텍스트를 다시 보냅니다.

현재 동작:

- 기존 대화 경로가 필요합니다
- 세션의 채널, 수신자, 계정 id, 스레드 id를 사용합니다
- 텍스트만 전송합니다

### `permissions_list_open`

브리지가 Gateway에 연결된 이후 관찰한 대기 중인 exec/plugin 승인 요청을 나열합니다.

### `permissions_respond`

다음 값 중 하나로 대기 중인 exec/plugin 승인 요청 하나를 처리합니다.

- `allow-once`
- `allow-always`
- `deny`

## 이벤트 모델

브리지는 연결된 동안 메모리 내 이벤트 큐를 유지합니다.

현재 이벤트 유형:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

중요한 제한 사항:

- 큐는 라이브 전용이며, MCP 브리지가 시작될 때부터 시작됩니다
- `events_poll` 및 `events_wait`는 이전 Gateway 기록을 자체적으로 재생하지 않습니다
- 영구 백로그는 `messages_read`로 읽어야 합니다

## Claude 채널 알림

브리지는 Claude 전용 채널 알림도 노출할 수 있습니다. 이는 Claude Code 채널 어댑터에 해당하는 OpenClaw 버전입니다. 표준 MCP 도구는 계속 사용할 수 있지만, 라이브 인바운드 메시지도 Claude 전용 MCP 알림으로 도착할 수 있습니다.

플래그:

- `--claude-channel-mode off`: 표준 MCP 도구만
- `--claude-channel-mode on`: Claude 채널 알림 활성화
- `--claude-channel-mode auto`: 현재 기본값, `on`과 동일한 브리지 동작

Claude 채널 모드가 활성화되면 서버는 Claude 실험적 기능을 알리고 다음을 내보낼 수 있습니다.

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

현재 브리지 동작:

- 인바운드 `user` transcript 메시지는 `notifications/claude/channel`로 전달됩니다
- MCP를 통해 받은 Claude 권한 요청은 메모리 내에서 추적됩니다
- 연결된 대화가 나중에 `yes abcde` 또는 `no abcde`를 보내면 브리지는 이를 `notifications/claude/channel/permission`으로 변환합니다
- 이러한 알림은 라이브 세션 전용이며, MCP 클라이언트가 연결을 끊으면 푸시 대상이 없습니다

이것은 의도적으로 클라이언트 전용입니다. 일반 MCP 클라이언트는 표준 폴링 도구에 의존해야 합니다.

## MCP 클라이언트 config

예시 stdio 클라이언트 config:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

대부분의 일반 MCP 클라이언트에서는 표준 도구 표면으로 시작하고 Claude 모드는 무시하세요. Claude 전용 알림 메서드를 실제로 이해하는 클라이언트에서만 Claude 모드를 켜세요.

## 옵션

`openclaw mcp serve`는 다음을 지원합니다.

- `--url <url>`: Gateway WebSocket URL
- `--token <token>`: Gateway 토큰
- `--token-file <path>`: 파일에서 토큰 읽기
- `--password <password>`: Gateway 비밀번호
- `--password-file <path>`: 파일에서 비밀번호 읽기
- `--claude-channel-mode <auto|on|off>`: Claude 알림 모드
- `-v`, `--verbose`: stderr에 자세한 로그 출력

가능하면 인라인 비밀 정보보다 `--token-file` 또는 `--password-file`을 사용하세요.

## 보안 및 신뢰 경계

브리지는 라우팅을 새로 만들지 않습니다. Gateway가 이미 라우팅 방법을 알고 있는 대화만 노출합니다.

즉:

- 발신자 허용 목록, 페어링, 채널 수준 신뢰는 여전히 기반 OpenClaw 채널 config에 속합니다
- `messages_send`는 기존에 저장된 경로를 통해서만 응답할 수 있습니다
- 승인 상태는 현재 브리지 세션에 대해서만 라이브/메모리 내 상태입니다
- 브리지 인증에는 다른 원격 Gateway 클라이언트에 신뢰를 부여할 때와 동일한 Gateway 토큰 또는 비밀번호 제어를 사용해야 합니다

`conversations_list`에 대화가 나타나지 않는다면, 일반적인 원인은 MCP config가 아닙니다. 기반 Gateway 세션에 경로 메타데이터가 없거나 불완전한 경우입니다.

## 테스트

OpenClaw는 이 브리지를 위한 결정적 Docker 스모크 테스트를 제공합니다.

```bash
pnpm test:docker:mcp-channels
```

이 스모크 테스트는 다음을 수행합니다.

- 시드된 Gateway 컨테이너를 시작합니다
- `openclaw mcp serve`를 시작하는 두 번째 컨테이너를 시작합니다
- 대화 검색, transcript 읽기, 첨부파일 메타데이터 읽기, 라이브 이벤트 큐 동작 및 아웃바운드 전송 라우팅을 검증합니다
- 실제 stdio MCP 브리지를 통해 Claude 스타일 채널 및 권한 알림을 검증합니다

이것은 실제 Telegram, Discord 또는 iMessage 계정을 테스트 실행에 연결하지 않고도 브리지가 동작함을 증명하는 가장 빠른 방법입니다.

더 넓은 테스트 맥락은 [Testing](/ko/help/testing)을 참조하세요.

## 문제 해결

### 반환되는 대화가 없음

대개 Gateway 세션이 아직 라우팅 가능하지 않다는 뜻입니다. 기반 세션에 저장된 채널/프로바이더, 수신자 및 선택적 계정/스레드 경로 메타데이터가 있는지 확인하세요.

### `events_poll` 또는 `events_wait`가 이전 메시지를 놓침

예상된 동작입니다. 라이브 큐는 브리지가 연결될 때 시작됩니다. 이전 transcript 기록은 `messages_read`로 읽으세요.

### Claude 알림이 표시되지 않음

다음을 모두 확인하세요.

- 클라이언트가 stdio MCP 세션을 계속 열어 두었는지
- `--claude-channel-mode`가 `on` 또는 `auto`인지
- 클라이언트가 실제로 Claude 전용 알림 메서드를 이해하는지
- 인바운드 메시지가 브리지가 연결된 이후에 발생했는지

### 승인이 보이지 않음

`permissions_list_open`은 브리지가 연결되어 있는 동안 관찰된 승인 요청만 표시합니다. 이는 영구 승인 기록 API가 아닙니다.

## OpenClaw를 MCP 클라이언트 레지스트리로 사용

이 경로는 `openclaw mcp list`, `show`, `set`, `unset`입니다.

이 명령들은 MCP를 통해 OpenClaw를 노출하지 않습니다. 대신 OpenClaw config의 `mcp.servers` 아래에 있는 OpenClaw 소유 MCP 서버 정의를 관리합니다.

이 저장된 정의는 내장 Pi 및 기타 런타임 어댑터처럼 OpenClaw가 나중에 시작하거나 구성하는 런타임을 위한 것입니다. OpenClaw는 이러한 정의를 중앙에서 저장하므로, 해당 런타임은 자체 MCP 서버 목록의 중복 사본을 따로 유지할 필요가 없습니다.

중요한 동작:

- 이 명령들은 OpenClaw config만 읽거나 씁니다
- 대상 MCP 서버에 연결하지 않습니다
- 명령, URL 또는 원격 전송이 지금 실제로 도달 가능한지 검증하지 않습니다
- 런타임 어댑터는 실행 시점에 실제로 지원하는 전송 형태를 결정합니다
- 내장 Pi는 일반 `coding` 및 `messaging` 도구 프로필에서 구성된 MCP 도구를 노출하며, `minimal`은 여전히 이를 숨기고 `tools.deny: ["bundle-mcp"]`는 이를 명시적으로 비활성화합니다
- 세션 범위 번들 MCP 런타임은 유휴 시간이 `mcp.sessionIdleTtlMs`밀리초(기본값 10분, `0`이면 비활성화) 지나면 정리되며, 일회성 내장 실행은 실행 종료 시 이를 정리합니다

## 저장된 MCP 서버 정의

OpenClaw는 OpenClaw 관리형 MCP 정의가 필요한 표면을 위해 config에 경량 MCP 서버 레지스트리도 저장합니다.

명령:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

참고:

- `list`는 서버 이름을 정렬합니다.
- 이름 없이 `show`를 실행하면 구성된 전체 MCP 서버 객체를 출력합니다.
- `set`은 명령줄에서 JSON 객체 값 하나를 기대합니다.
- `unset`은 지정한 서버가 존재하지 않으면 실패합니다.

예시:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

예시 config 형태:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Stdio 전송

로컬 자식 프로세스를 시작하고 stdin/stdout을 통해 통신합니다.

| Field                      | Description                    |
| -------------------------- | ------------------------------ |
| `command`                  | 시작할 실행 파일(필수)         |
| `args`                     | 명령줄 인수 배열               |
| `env`                      | 추가 환경 변수                 |
| `cwd` / `workingDirectory` | 프로세스의 작업 디렉터리       |

#### Stdio env 안전성 필터

OpenClaw는 stdio MCP 서버의 `env` 블록에 나타나더라도, 첫 번째 RPC 이전에 stdio MCP 서버가 시작되는 방식을 바꿀 수 있는 인터프리터 시작 환경 변수 키를 거부합니다. 차단되는 키에는 `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` 및 유사한 런타임 제어 변수가 포함됩니다. 이러한 키는 암시적 프렐류드 삽입, 인터프리터 교체, 또는 stdio 프로세스에 대한 디버거 활성화를 하지 못하도록 구성 오류와 함께 시작 단계에서 거부됩니다. 일반적인 자격 증명, 프록시, 서버별 환경 변수(`GITHUB_TOKEN`, `HTTP_PROXY`, 사용자 정의 `*_API_KEY` 등)는 영향을 받지 않습니다.

MCP 서버가 실제로 차단된 변수 중 하나를 필요로 한다면, stdio 서버의 `env` 아래가 아니라 Gateway 호스트 프로세스에 설정하세요.

### SSE / HTTP 전송

HTTP Server-Sent Events를 통해 원격 MCP 서버에 연결합니다.

| Field                 | Description                                           |
| --------------------- | ----------------------------------------------------- |
| `url`                 | 원격 서버의 HTTP 또는 HTTPS URL(필수)                 |
| `headers`             | 선택적 HTTP 헤더의 키-값 맵(예: 인증 토큰)            |
| `connectionTimeoutMs` | 서버별 연결 제한 시간(ms, 선택 사항)                  |

예시:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

`url`의 민감한 값(userinfo)과 `headers`는 로그 및 상태 출력에서 마스킹됩니다.

### Streamable HTTP 전송

`streamable-http`는 `sse` 및 `stdio`와 함께 사용할 수 있는 추가 전송 옵션입니다. 원격 MCP 서버와의 양방향 통신에 HTTP 스트리밍을 사용합니다.

| Field                 | Description                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `url`                 | 원격 서버의 HTTP 또는 HTTPS URL(필수)                                                       |
| `transport`           | 이 전송을 선택하려면 `"streamable-http"`로 설정합니다. 생략하면 OpenClaw는 `sse`를 사용합니다 |
| `headers`             | 선택적 HTTP 헤더의 키-값 맵(예: 인증 토큰)                                                  |
| `connectionTimeoutMs` | 서버별 연결 제한 시간(ms, 선택 사항)                                                        |

예시:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

이 명령들은 저장된 config만 관리합니다. 채널 브리지를 시작하거나, 라이브 MCP 클라이언트 세션을 열거나, 대상 서버에 도달 가능한지 증명하지는 않습니다.

## 현재 제한 사항

이 페이지는 현재 제공되는 브리지를 문서화합니다.

현재 제한 사항:

- 대화 검색은 기존 Gateway 세션 경로 메타데이터에 의존합니다
- Claude 전용 어댑터 외에는 일반 푸시 프로토콜이 아직 없습니다
- 메시지 편집 또는 반응 도구는 아직 없습니다
- HTTP/SSE/streamable-http 전송은 단일 원격 서버에 연결하며, 아직 다중화된 업스트림은 없습니다
- `permissions_list_open`에는 브리지가 연결된 동안 관찰된 승인만 포함됩니다

## 관련 항목

- [CLI 참조](/ko/cli)
- [Plugins](/ko/cli/plugins)
