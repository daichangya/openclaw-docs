---
read_when:
    - TUI의 초보자 친화적인 안내가 필요합니다
    - TUI 기능, 명령 및 단축키의 전체 목록이 필요합니다
summary: 'Terminal UI (TUI): Gateway에 연결하거나 로컬에서 내장 모드로 실행합니다'
title: TUI
x-i18n:
    generated_at: "2026-04-25T12:30:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6eaa938fb3a50b7478341fe51cafb09e352f6d3cb402373222153ed93531a5f5
    source_path: web/tui.md
    workflow: 15
---

## 빠른 시작

### Gateway 모드

1. Gateway를 시작합니다.

```bash
openclaw gateway
```

2. TUI를 엽니다.

```bash
openclaw tui
```

3. 메시지를 입력하고 Enter를 누릅니다.

원격 Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gateway가 비밀번호 인증을 사용하는 경우 `--password`를 사용하세요.

### 로컬 모드

Gateway 없이 TUI를 실행합니다.

```bash
openclaw chat
# 또는
openclaw tui --local
```

참고:

- `openclaw chat`과 `openclaw terminal`은 `openclaw tui --local`의 별칭입니다.
- `--local`은 `--url`, `--token`, `--password`와 함께 사용할 수 없습니다.
- 로컬 모드는 내장 에이전트 런타임을 직접 사용합니다. 대부분의 로컬 도구는 작동하지만 Gateway 전용 기능은 사용할 수 없습니다.
- `openclaw`와 `openclaw crestodian`도 이 TUI 셸을 사용하며, Crestodian은 로컬 설정 및 복구 채팅 백엔드로 동작합니다.

## 화면 구성

- 헤더: 연결 URL, 현재 에이전트, 현재 세션
- 채팅 로그: 사용자 메시지, 어시스턴트 응답, 시스템 알림, 도구 카드
- 상태 줄: 연결/실행 상태(connecting, running, streaming, idle, error)
- 바닥글: 연결 상태 + 에이전트 + 세션 + 모델 + think/fast/verbose/trace/reasoning + 토큰 수 + deliver
- 입력창: 자동 완성이 있는 텍스트 편집기

## 멘털 모델: 에이전트 + 세션

- 에이전트는 고유한 slug입니다(예: `main`, `research`). Gateway가 목록을 제공합니다.
- 세션은 현재 에이전트에 속합니다.
- 세션 키는 `agent:<agentId>:<sessionKey>` 형식으로 저장됩니다.
  - `/session main`을 입력하면 TUI는 이를 `agent:<currentAgent>:main`으로 확장합니다.
  - `/session agent:other:main`을 입력하면 해당 에이전트 세션으로 명시적으로 전환합니다.
- 세션 범위:
  - `per-sender`(기본값): 각 에이전트는 여러 세션을 가질 수 있습니다.
  - `global`: TUI는 항상 `global` 세션을 사용합니다(선택기가 비어 있을 수 있음).
- 현재 에이전트 + 세션은 항상 바닥글에 표시됩니다.

## 전송 + 전달

- 메시지는 Gateway로 전송되며 provider로의 전달은 기본적으로 꺼져 있습니다.
- 전달을 켜려면:
  - `/deliver on`
  - 또는 Settings 패널
  - 또는 `openclaw tui --deliver`로 시작

## 선택기 + 오버레이

- 모델 선택기: 사용 가능한 모델을 나열하고 세션 재정의를 설정합니다.
- 에이전트 선택기: 다른 에이전트를 선택합니다.
- 세션 선택기: 현재 에이전트의 세션만 표시합니다.
- Settings: deliver, tool output 확장, thinking 표시를 전환합니다.

## 키보드 단축키

- Enter: 메시지 전송
- Esc: 활성 실행 중단
- Ctrl+C: 입력 지우기(두 번 누르면 종료)
- Ctrl+D: 종료
- Ctrl+L: 모델 선택기
- Ctrl+G: 에이전트 선택기
- Ctrl+P: 세션 선택기
- Ctrl+O: tool output 확장 전환
- Ctrl+T: thinking 표시 전환(기록 다시 로드)

## 슬래시 명령

핵심:

- `/help`
- `/status`
- `/agent <id>` (또는 `/agents`)
- `/session <key>` (또는 `/sessions`)
- `/model <provider/model>` (또는 `/models`)

세션 제어:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (별칭: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

세션 수명 주기:

- `/new` 또는 `/reset` (세션 재설정)
- `/abort` (활성 실행 중단)
- `/settings`
- `/exit`

로컬 모드 전용:

- `/auth [provider]`는 TUI 내부에서 provider 인증/로그인 흐름을 엽니다.

기타 Gateway 슬래시 명령(예: `/context`)은 Gateway로 전달되어 시스템 출력으로 표시됩니다. [슬래시 명령](/ko/tools/slash-commands)을 참조하세요.

## 로컬 셸 명령

- 줄 앞에 `!`를 붙이면 TUI 호스트에서 로컬 셸 명령을 실행합니다.
- TUI는 세션당 한 번 로컬 실행 허용 여부를 묻습니다. 거부하면 해당 세션에서는 `!`가 비활성화됩니다.
- 명령은 TUI 작업 디렉터리에서 새 비대화형 셸로 실행됩니다(지속되는 `cd`/env 없음).
- 로컬 셸 명령은 환경 변수로 `OPENCLAW_SHELL=tui-local`을 받습니다.
- `!`만 단독으로 입력하면 일반 메시지로 전송되며, 앞에 공백이 있으면 로컬 실행이 트리거되지 않습니다.

## 로컬 TUI에서 config 복구

현재 config가 이미 검증을 통과하고 있고,
내장 에이전트가 같은 머신에서 이를 검사하고 문서와 비교하며,
실행 중인 Gateway에 의존하지 않고 드리프트 복구를 돕게 하려면 로컬 모드를 사용하세요.

`openclaw config validate`가 이미 실패하고 있다면 먼저 `openclaw configure`
또는 `openclaw doctor --fix`부터 시작하세요. `openclaw chat`은 잘못된
config 가드를 우회하지 않습니다.

일반적인 흐름:

1. 로컬 모드 시작:

```bash
openclaw chat
```

2. 예를 들어 검사하고 싶은 내용을 에이전트에게 요청합니다.

```text
내 gateway auth config를 문서와 비교하고 가장 작은 수정 사항을 제안해 줘.
```

3. 정확한 근거와 검증을 위해 로컬 셸 명령을 사용합니다.

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. `openclaw config set` 또는 `openclaw configure`로 좁은 범위의 변경을 적용한 뒤 `!openclaw config validate`를 다시 실행합니다.
5. Doctor가 자동 마이그레이션 또는 복구를 권장하면 이를 검토하고 `!openclaw doctor --fix`를 실행합니다.

팁:

- `openclaw.json`을 직접 수정하기보다 `openclaw config set` 또는 `openclaw configure`를 우선 사용하세요.
- `openclaw docs "<query>"`는 같은 머신에서 live 문서 색인을 검색합니다.
- `openclaw config validate --json`은 구조화된 스키마 및 SecretRef/확인 가능성 오류가 필요할 때 유용합니다.

## 도구 출력

- 도구 호출은 args + 결과가 있는 카드로 표시됩니다.
- Ctrl+O는 접힘/펼침 보기를 전환합니다.
- 도구가 실행되는 동안 부분 업데이트가 같은 카드에 스트리밍됩니다.

## 터미널 색상

- TUI는 어시스턴트 본문 텍스트를 터미널의 기본 전경색으로 유지하므로, 어두운 터미널과 밝은 터미널 모두에서 읽기 쉽습니다.
- 터미널이 밝은 배경을 사용하고 자동 감지가 잘못되면 `openclaw tui`를 실행하기 전에 `OPENCLAW_THEME=light`를 설정하세요.
- 원래의 어두운 팔레트를 강제로 사용하려면 대신 `OPENCLAW_THEME=dark`를 설정하세요.

## 기록 + 스트리밍

- 연결 시 TUI는 최신 기록을 로드합니다(기본값 200개 메시지).
- 스트리밍 응답은 최종 확정될 때까지 제자리에서 업데이트됩니다.
- TUI는 더 풍부한 도구 카드를 위해 에이전트 도구 이벤트도 수신합니다.

## 연결 세부 정보

- TUI는 `mode: "tui"`로 Gateway에 등록됩니다.
- 재연결은 시스템 메시지로 표시되며, 이벤트 누락도 로그에 표시됩니다.

## 옵션

- `--local`: 로컬 내장 에이전트 런타임에 대해 실행
- `--url <url>`: Gateway WebSocket URL(config 또는 `ws://127.0.0.1:<port>` 기본값)
- `--token <token>`: Gateway 토큰(필요한 경우)
- `--password <password>`: Gateway 비밀번호(필요한 경우)
- `--session <key>`: 세션 키(기본값: `main`, 범위가 global이면 `global`)
- `--deliver`: 어시스턴트 응답을 provider에 전달(기본값 꺼짐)
- `--thinking <level>`: 전송용 thinking 수준 재정의
- `--message <text>`: 연결 후 초기 메시지 전송
- `--timeout-ms <ms>`: 에이전트 타임아웃(ms, 기본값은 `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: 로드할 기록 항목 수(기본값 `200`)

참고: `--url`을 설정하면 TUI는 config 또는 환경 자격 증명으로 대체하지 않습니다.
`--token` 또는 `--password`를 명시적으로 전달하세요. 명시적 자격 증명이 없으면 오류입니다.
로컬 모드에서는 `--url`, `--token`, `--password`를 전달하지 마세요.

## 문제 해결

메시지 전송 후 출력이 없음:

- TUI에서 `/status`를 실행해 Gateway가 연결되어 있고 idle/busy 상태인지 확인하세요.
- Gateway 로그 확인: `openclaw logs --follow`.
- 에이전트가 실행 가능한지 확인: `openclaw status` 및 `openclaw models status`.
- 채팅 채널에서 메시지를 기대하는 경우 전달을 활성화하세요(`/deliver on` 또는 `--deliver`).

## 연결 문제 해결

- `disconnected`: Gateway가 실행 중인지, `--url/--token/--password`가 올바른지 확인하세요.
- 선택기에 에이전트가 없음: `openclaw agents list`와 라우팅 config를 확인하세요.
- 비어 있는 세션 선택기: global 범위에 있거나 아직 세션이 없을 수 있습니다.

## 관련

- [Control UI](/ko/web/control-ui) — 웹 기반 제어 인터페이스
- [Config](/ko/cli/config) — `openclaw.json` 검사, 검증 및 편집
- [Doctor](/ko/cli/doctor) — 가이드형 복구 및 마이그레이션 검사
- [CLI Reference](/ko/cli) — 전체 CLI 명령 참조
