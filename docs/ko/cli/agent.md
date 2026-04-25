---
read_when:
    - 스크립트에서 에이전트 턴 하나를 실행하려고 합니다(선택적으로 답장을 전달)
summary: Gateway를 통해 에이전트 턴 하나를 보내는 `openclaw agent`용 CLI 참조
title: 에이전트
x-i18n:
    generated_at: "2026-04-25T12:23:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: e06681ffbed56cb5be05c7758141e784eac8307ed3c6fc973f71534238b407e1
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Gateway를 통해 에이전트 턴을 실행합니다(내장 실행에는 `--local` 사용).
구성된 에이전트를 직접 대상으로 지정하려면 `--agent <id>`를 사용하세요.

다음 세션 선택자 중 하나 이상을 전달하세요.

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

관련 항목:

- Agent send 도구: [Agent send](/ko/tools/agent-send)

## 옵션

- `-m, --message <text>`: 필수 메시지 본문
- `-t, --to <dest>`: 세션 키를 도출하는 데 사용되는 수신자
- `--session-id <id>`: 명시적 세션 ID
- `--agent <id>`: 에이전트 ID, 라우팅 바인딩을 재정의함
- `--thinking <level>`: 에이전트 사고 수준(`off`, `minimal`, `low`, `medium`, `high`, 그리고 `xhigh`, `adaptive`, `max`와 같은 공급자 지원 사용자 지정 수준)
- `--verbose <on|off>`: 세션의 상세 수준을 유지
- `--channel <channel>`: 전달 채널, 생략하면 기본 세션 채널 사용
- `--reply-to <target>`: 전달 대상 재정의
- `--reply-channel <channel>`: 전달 채널 재정의
- `--reply-account <id>`: 전달 계정 재정의
- `--local`: 내장 에이전트를 직접 실행(Plugin 레지스트리 사전 로드 후)
- `--deliver`: 선택한 채널/대상으로 답장을 다시 전송
- `--timeout <seconds>`: 에이전트 타임아웃 재정의(기본값 600 또는 구성 값)
- `--json`: JSON 출력

## 예제

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## 참고

- Gateway 모드는 Gateway 요청이 실패하면 내장 에이전트로 대체됩니다. 처음부터 내장 실행을 강제하려면 `--local`을 사용하세요.
- `--local`도 먼저 Plugin 레지스트리를 사전 로드하므로, Plugin이 제공하는 공급자, 도구, 채널을 내장 실행 중에도 계속 사용할 수 있습니다.
- 각 `openclaw agent` 호출은 일회성 실행으로 처리됩니다. 해당 실행을 위해 열린 번들 제공 또는 사용자 구성 MCP 서버는, 명령이 Gateway 경로를 사용하더라도, 응답 후 정리되므로 stdio MCP 자식 프로세스는 스크립트 호출 간에 계속 실행되지 않습니다.
- `--channel`, `--reply-channel`, `--reply-account`는 세션 라우팅이 아니라 답장 전달에 영향을 줍니다.
- `--json`은 stdout을 JSON 응답 전용으로 유지합니다. Gateway, Plugin, 내장 대체 진단 정보는 stderr로 라우팅되므로 스크립트가 stdout을 직접 파싱할 수 있습니다.
- 이 명령이 `models.json` 재생성을 트리거하면, SecretRef로 관리되는 공급자 자격 증명은 해결된 비밀 평문이 아니라 비비밀 마커(예: 환경 변수 이름, `secretref-env:ENV_VAR_NAME`, `secretref-managed`)로 유지됩니다.
- 마커 쓰기는 소스 권한 기준입니다. OpenClaw는 해결된 런타임 비밀 값이 아니라 활성 소스 구성 스냅샷의 마커를 유지합니다.

## 관련 항목

- [CLI reference](/ko/cli)
- [Agent runtime](/ko/concepts/agent)
