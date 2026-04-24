---
read_when:
    - 백그라운드 exec 동작을 추가하거나 수정하는 중입니다.
    - 장시간 실행되는 exec 작업을 디버깅하는 중입니다.
summary: 백그라운드 exec 실행 및 프로세스 관리
title: 백그라운드 exec 및 process 도구
x-i18n:
    generated_at: "2026-04-24T06:12:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6dbf6fd0ee39a053fda0a910e95827e9d0e31dcdfbbf542b6ba5d1d63aa48dc
    source_path: gateway/background-process.md
    workflow: 15
---

# 백그라운드 exec + process 도구

OpenClaw는 `exec` 도구를 통해 셸 명령을 실행하고, 장시간 실행 작업은 메모리에 유지합니다. `process` 도구는 이러한 백그라운드 세션을 관리합니다.

## exec 도구

주요 파라미터:

- `command` (필수)
- `yieldMs` (기본값 10000): 이 지연 이후 자동으로 백그라운드 전환
- `background` (bool): 즉시 백그라운드 실행
- `timeout` (초, 기본값 1800): 이 타임아웃 후 프로세스 종료
- `elevated` (bool): elevated 모드가 활성화/허용된 경우 샌드박스 밖에서 실행(`gateway`가 기본값이며, exec 대상이 `node`이면 `node`)
- 실제 TTY가 필요하면 `pty: true`를 설정하세요.
- `workdir`, `env`

동작:

- 포그라운드 실행은 출력을 직접 반환합니다.
- 백그라운드로 전환되면(명시적 또는 타임아웃) 도구는 `status: "running"` + `sessionId`와 짧은 tail을 반환합니다.
- 출력은 세션이 poll되거나 clear될 때까지 메모리에 유지됩니다.
- `process` 도구가 허용되지 않으면 `exec`는 동기식으로 실행되고 `yieldMs`/`background`를 무시합니다.
- 생성된 exec 명령은 컨텍스트 인식 셸/프로필 규칙을 위해 `OPENCLAW_SHELL=exec`를 받습니다.
- 지금 시작하는 장시간 실행 작업은 한 번만 시작하고, 자동 완료 wake가 활성화되어 있으며 명령이 출력을 내거나 실패할 때 이를 활용하세요.
- 자동 완료 wake를 사용할 수 없거나, 출력 없이 정상 종료된 명령의 조용한 성공 확인이 필요하면 `process`를 사용해 완료를 확인하세요.
- `sleep` 루프나 반복 poll로 리마인더나 지연된 후속 작업을 흉내 내지 마세요. 미래 작업에는 Cron을 사용하세요.

## 자식 프로세스 브리징

exec/process 도구 밖에서 장시간 실행되는 자식 프로세스를 생성할 때(예: CLI 재실행 또는 gateway 헬퍼), 자식 프로세스 브리지 헬퍼를 연결해 종료 신호가 전달되고 exit/error 시 리스너가 분리되도록 하세요. 이렇게 하면 systemd 환경에서 orphan 프로세스를 방지하고 플랫폼 전반에서 종료 동작을 일관되게 유지할 수 있습니다.

환경 변수 override:

- `PI_BASH_YIELD_MS`: 기본 yield(ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: 메모리 내 출력 상한(문자 수)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: 스트림별 대기 중 stdout/stderr 상한(문자 수)
- `PI_BASH_JOB_TTL_MS`: 완료된 세션의 TTL(ms, 1분–3시간 범위로 제한)

Config(권장):

- `tools.exec.backgroundMs` (기본값 10000)
- `tools.exec.timeoutSec` (기본값 1800)
- `tools.exec.cleanupMs` (기본값 1800000)
- `tools.exec.notifyOnExit` (기본값 true): 백그라운드 exec가 종료되면 시스템 이벤트를 큐에 넣고 Heartbeat를 요청합니다.
- `tools.exec.notifyOnExitEmptySuccess` (기본값 false): true이면 출력 없이 성공적으로 종료된 백그라운드 실행에 대해서도 완료 이벤트를 큐에 넣습니다.

## process 도구

액션:

- `list`: 실행 중 + 완료된 세션
- `poll`: 세션의 새 출력을 drain(종료 상태도 보고)
- `log`: 누적 출력 읽기(`offset` + `limit` 지원)
- `write`: stdin 전송(`data`, 선택적 `eof`)
- `send-keys`: PTY 기반 세션에 명시적 키 토큰 또는 바이트 전송
- `submit`: PTY 기반 세션에 Enter / carriage return 전송
- `paste`: 리터럴 텍스트 전송, 선택적으로 bracketed paste mode로 감쌈
- `kill`: 백그라운드 세션 종료
- `clear`: 완료된 세션을 메모리에서 제거
- `remove`: 실행 중이면 종료, 완료되었으면 제거

참고:

- 백그라운드 세션만 목록에 표시되고 메모리에 유지됩니다.
- 세션은 프로세스 재시작 시 사라집니다(디스크 영속성 없음).
- 세션 로그는 `process poll/log`를 실행하고 도구 결과가 기록된 경우에만 채팅 기록에 저장됩니다.
- `process`는 에이전트별 범위입니다. 해당 에이전트가 시작한 세션만 볼 수 있습니다.
- 상태, 로그, 조용한 성공 확인 또는 자동 완료 wake를 사용할 수 없을 때의 완료 확인에는 `poll` / `log`를 사용하세요.
- 입력이나 개입이 필요하면 `write` / `send-keys` / `submit` / `paste` / `kill`을 사용하세요.
- `process list`에는 빠르게 훑어볼 수 있도록 파생된 `name`(명령 동사 + 대상)이 포함됩니다.
- `process log`는 줄 기반 `offset`/`limit`를 사용합니다.
- `offset`과 `limit`를 모두 생략하면 마지막 200줄을 반환하고 페이지 힌트를 포함합니다.
- `offset`만 제공하고 `limit`를 생략하면 `offset`부터 끝까지 반환합니다(200줄로 제한되지 않음).
- polling은 온디맨드 상태 확인용이지 대기 루프 스케줄링용이 아닙니다. 작업을 나중에 실행해야 한다면 Cron을 사용하세요.

## 예시

긴 작업을 실행하고 나중에 poll하기:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

즉시 백그라운드에서 시작:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

stdin 전송:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

PTY 키 전송:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

현재 줄 제출:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

리터럴 텍스트 붙여넣기:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## 관련

- [Exec tool](/ko/tools/exec)
- [Exec approvals](/ko/tools/exec-approvals)
