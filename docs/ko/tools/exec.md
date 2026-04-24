---
read_when:
    - Exec 도구 사용 또는 수정하기
    - stdin 또는 TTY 동작 디버깅하기
summary: Exec 도구 사용법, stdin 모드, TTY 지원
title: Exec 도구
x-i18n:
    generated_at: "2026-04-24T06:39:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cad17fecfaf7d6a523282ef4f0090e4ffaab89ab53945b5cd831e426f3fc3ac
    source_path: tools/exec.md
    workflow: 15
---

워크스페이스에서 셸 명령을 실행합니다. `process`를 통한 포그라운드 + 백그라운드 실행을 지원합니다.
`process`가 허용되지 않으면 `exec`는 동기적으로 실행되며 `yieldMs`/`background`를 무시합니다.
백그라운드 세션은 에이전트별 범위를 가지며, `process`는 같은 에이전트의 세션만 볼 수 있습니다.

## 파라미터

<ParamField path="command" type="string" required>
실행할 셸 명령입니다.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
명령의 작업 디렉터리입니다.
</ParamField>

<ParamField path="env" type="object">
상속된 환경 위에 병합되는 키/값 환경 재정의입니다.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
이 지연(ms) 이후 명령을 자동으로 백그라운드로 전환합니다.
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs`를 기다리지 않고 즉시 백그라운드로 전환합니다.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
이 초 수가 지나면 명령을 종료합니다.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
가능한 경우 pseudo-terminal에서 실행합니다. TTY 전용 CLI, 코딩 에이전트, 터미널 UI에 사용하세요.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
실행 위치입니다. `auto`는 세션에 샌드박스 런타임이 활성화되어 있으면 `sandbox`, 그렇지 않으면 `gateway`로 해석됩니다.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
`gateway` / `node` 실행에 대한 강제 모드입니다.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` 실행의 승인 프롬프트 동작입니다.
</ParamField>

<ParamField path="node" type="string">
`host=node`일 때 사용할 Node id/name입니다.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Elevated 모드를 요청합니다 — 샌드박스를 벗어나 구성된 호스트 경로로 나갑니다. Elevated가 `full`로 해석될 때만 `security=full`이 강제됩니다.
</ParamField>

참고:

- `host` 기본값은 `auto`입니다: 세션에 샌드박스 런타임이 활성화되어 있으면 `sandbox`, 그렇지 않으면 `gateway`.
- `auto`는 와일드카드가 아니라 기본 라우팅 전략입니다. 호출별 `host=node`는 `auto`에서 허용되지만, 호출별 `host=gateway`는 샌드박스 런타임이 활성화되지 않았을 때만 허용됩니다.
- 추가 구성 없이도 `host=auto`는 여전히 "그냥 동작"합니다: 샌드박스가 없으면 `gateway`로 해석되고, 활성 샌드박스가 있으면 샌드박스에 머뭅니다.
- `elevated`는 샌드박스를 벗어나 구성된 호스트 경로로 나갑니다: 기본값은 `gateway`, `tools.exec.host=node`(또는 세션 기본값이 `host=node`)일 때는 `node`. 현재 세션/Provider에 대해 Elevated 접근이 활성화된 경우에만 사용할 수 있습니다.
- `gateway`/`node` 승인은 `~/.openclaw/exec-approvals.json`으로 제어됩니다.
- `node`에는 페어링된 Node(컴패니언 앱 또는 헤드리스 Node 호스트)가 필요합니다.
- 여러 Node를 사용할 수 있으면 `exec.node` 또는 `tools.exec.node`를 설정해 하나를 선택하세요.
- `exec host=node`는 Node용 유일한 셸 실행 경로이며, 레거시 `nodes.run` 래퍼는 제거되었습니다.
- Windows가 아닌 호스트에서는 `SHELL`이 설정되어 있으면 exec가 이를 사용합니다. `SHELL`이 `fish`라면,
  fish와 호환되지 않는 스크립트를 피하기 위해 `PATH`에서 `bash`(또는 `sh`)를 우선 사용하고,
  둘 다 없을 때만 `SHELL`로 폴백합니다.
- Windows 호스트에서는 exec가 PowerShell 7 (`pwsh`) 검색(Program Files, ProgramW6432, 그다음 PATH)을 우선하고,
  그다음 Windows PowerShell 5.1로 폴백합니다.
- 호스트 실행(`gateway`/`node`)은 `env.PATH`와 loader 재정의(`LD_*`/`DYLD_*`)를 거부하여
  바이너리 하이재킹이나 주입된 코드 실행을 방지합니다.
- OpenClaw는 생성된 명령 환경(PTY 및 샌드박스 실행 포함)에 `OPENCLAW_SHELL=exec`를 설정하므로 셸/프로필 규칙이 exec 도구 컨텍스트를 감지할 수 있습니다.
- 중요: 샌드박싱은 기본적으로 **꺼져 있습니다**. 샌드박싱이 꺼져 있으면 암시적 `host=auto`는 `gateway`로 해석됩니다. 명시적 `host=sandbox`는 조용히 Gateway 호스트에서 실행되지 않고 실패 시 닫힘으로 처리됩니다. 샌드박싱을 활성화하거나 승인과 함께 `host=gateway`를 사용하세요.
- 일반적인 Python/Node 셸 구문 실수에 대한 스크립트 preflight 검사는
  유효 `workdir` 경계 내부의 파일만 검사합니다. 스크립트 경로가 `workdir` 바깥으로 해석되면
  해당 파일에 대한 preflight는 건너뜁니다.
- 지금 시작되는 장기 실행 작업은 한 번만 시작하고,
  자동 완료 깨우기가 활성화되어 있고 명령이 출력을 내거나 실패할 때 이를 활용하세요.
  로그, 상태, 입력, 개입에는 `process`를 사용하세요. sleep 루프, timeout 루프, 반복 폴링으로
  스케줄링을 흉내 내지 마세요.
- 나중에 실행되거나 일정에 따라 실행되어야 하는 작업은
  `exec`의 sleep/delay 패턴 대신 Cron을 사용하세요.

## 구성

- `tools.exec.notifyOnExit` (기본값: true): true이면 백그라운드 exec 세션이 종료 시 시스템 이벤트를 큐에 넣고 Heartbeat를 요청합니다.
- `tools.exec.approvalRunningNoticeMs` (기본값: 10000): 승인 게이트가 있는 exec가 이 시간보다 오래 실행되면 단일 “running” 알림을 보냅니다(0이면 비활성화).
- `tools.exec.host` (기본값: `auto`; 세션에 샌드박스 런타임이 활성화되면 `sandbox`, 아니면 `gateway`로 해석)
- `tools.exec.security` (기본값: 샌드박스는 `deny`, gateway + node는 미설정 시 `full`)
- `tools.exec.ask` (기본값: `off`)
- 무승인 호스트 exec는 gateway + node의 기본값입니다. 승인/허용 목록 동작이 필요하면 `tools.exec.*`와 호스트 `~/.openclaw/exec-approvals.json`을 모두 더 엄격하게 설정하세요. [Exec 승인](/ko/tools/exec-approvals#no-approval-yolo-mode)을 참고하세요.
- YOLO는 `host=auto`가 아니라 호스트 정책 기본값(`security=full`, `ask=off`)에서 옵니다. gateway 또는 node 라우팅을 강제하려면 `tools.exec.host`를 설정하거나 `/exec host=...`를 사용하세요.
- `security=full` + `ask=off` 모드에서는 호스트 exec가 구성된 정책을 그대로 따릅니다. 추가적인 휴리스틱 명령 난독화 prefilter나 스크립트 preflight 차단 계층은 없습니다.
- `tools.exec.node` (기본값: 미설정)
- `tools.exec.strictInlineEval` (기본값: false): true이면 `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e` 같은 인라인 인터프리터 eval 형식은 항상 명시적 승인이 필요합니다. `allow-always`는 여전히 무해한 인터프리터/스크립트 호출을 영속화할 수 있지만, 인라인 eval 형식은 매번 프롬프트를 띄웁니다.
- `tools.exec.pathPrepend`: exec 실행(gateway + sandbox 전용)에 대해 `PATH` 앞에 추가할 디렉터리 목록.
- `tools.exec.safeBins`: 명시적 허용 목록 항목 없이 실행 가능한 stdin 전용 safe binary입니다. 동작 세부 정보는 [Safe bins](/ko/tools/exec-approvals-advanced#safe-bins-stdin-only)를 참고하세요.
- `tools.exec.safeBinTrustedDirs`: safeBins 경로 검사용 추가 명시적 신뢰 디렉터리입니다. `PATH` 항목은 자동 신뢰되지 않습니다. 내장 기본값은 `/bin`과 `/usr/bin`입니다.
- `tools.exec.safeBinProfiles`: custom safe bin별 선택적 argv 정책 (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

예시:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### PATH 처리

- `host=gateway`: 로그인 셸의 `PATH`를 exec 환경에 병합합니다. 호스트 실행에서는 `env.PATH` 재정의가
  거부됩니다. 데몬 자체는 여전히 최소 `PATH`로 실행됩니다:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: 컨테이너 내부에서 `sh -lc`(로그인 셸)를 실행하므로 `/etc/profile`이 `PATH`를 재설정할 수 있습니다.
  OpenClaw는 프로필 소싱 후 내부 env var를 통해 `env.PATH`를 앞에 붙입니다(셸 보간 없음);
  `tools.exec.pathPrepend`도 여기 적용됩니다.
- `host=node`: 전달한 비차단 env 재정의만 Node에 전송됩니다. 호스트 실행에서는 `env.PATH` 재정의가
  거부되며 Node 호스트에서는 무시됩니다. Node에서 추가 PATH 항목이 필요하면
  Node 호스트 서비스 환경(systemd/launchd)을 구성하거나 표준 위치에 도구를 설치하세요.

에이전트별 Node 바인딩(구성에서 에이전트 목록 인덱스 사용):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Nodes 탭에 동일한 설정을 위한 작은 “Exec node binding” 패널이 있습니다.

## 세션 재정의 (`/exec`)

`/exec`를 사용해 `host`, `security`, `ask`, `node`의 **세션별** 기본값을 설정하세요.
인자 없이 `/exec`를 보내면 현재 값을 표시합니다.

예시:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 인증 모델

`/exec`는 **권한 있는 발신자**(채널 허용 목록/페어링 + `commands.useAccessGroups`)에 대해서만 적용됩니다.
이는 **세션 상태만** 업데이트하며 구성을 기록하지 않습니다. exec를 완전히 비활성화하려면 도구
정책(`tools.deny: ["exec"]` 또는 에이전트별 설정)으로 거부하세요. `security=full`과 `ask=off`를 명시적으로 설정하지 않는 한 호스트 승인은 계속 적용됩니다.

## Exec 승인 (컴패니언 앱 / Node 호스트)

샌드박스된 에이전트는 `exec`가 Gateway 또는 Node 호스트에서 실행되기 전에 요청별 승인을 요구할 수 있습니다.
정책, 허용 목록, UI 흐름은 [Exec 승인](/ko/tools/exec-approvals)을 참고하세요.

승인이 필요할 때 exec 도구는 즉시
`status: "approval-pending"`과 승인 id를 반환합니다. 승인(또는 거부 / 타임아웃) 후
Gateway는 시스템 이벤트(`Exec finished` / `Exec denied`)를 방출합니다. 명령이
`tools.exec.approvalRunningNoticeMs`보다 오래 실행되면 단일 `Exec running` 알림이 방출됩니다.
네이티브 승인 카드/버튼이 있는 채널에서는 에이전트가 먼저 그
네이티브 UI에 의존해야 하며, 수동 `/approve` 명령은 도구
결과가 채팅 승인을 사용할 수 없거나 수동 승인이 유일한 경로라고 명시적으로 말할 때만 포함해야 합니다.

## 허용 목록 + safe bins

수동 허용 목록 강제는 **해석된 바이너리 경로만** 일치시킵니다(기본 이름 일치는 없음). `security=allowlist`일 때 셸 명령은 모든 파이프라인 세그먼트가 허용 목록 또는 safe bin일 때만 자동 허용됩니다. 체이닝(`;`, `&&`, `||`)과 리다이렉션은 허용 목록 모드에서 거부되며, 모든 최상위 세그먼트가 허용 목록(또는 safe bin 포함)을 만족할 때만 허용됩니다.
리다이렉션은 여전히 지원되지 않습니다.
지속적인 `allow-always` 신뢰도 이 규칙을 우회하지 않습니다. 체인된 명령은 여전히 모든
최상위 세그먼트가 일치해야 합니다.

`autoAllowSkills`는 Exec 승인에서 별도의 편의 경로입니다. 이는 수동 경로 허용 목록 항목과
같지 않습니다. 엄격한 명시적 신뢰를 원하면 `autoAllowSkills`를 비활성화한 상태로 두세요.

두 제어는 다른 역할에 사용하세요:

- `tools.exec.safeBins`: 작은 stdin 전용 스트림 필터.
- `tools.exec.safeBinTrustedDirs`: safe bin 실행 파일 경로를 위한 명시적 추가 신뢰 디렉터리.
- `tools.exec.safeBinProfiles`: custom safe bin에 대한 명시적 argv 정책.
- 허용 목록: 실행 파일 경로에 대한 명시적 신뢰.

`safeBins`를 일반 허용 목록처럼 취급하지 말고, 인터프리터/런타임 바이너리(예: `python3`, `node`, `ruby`, `bash`)를 추가하지 마세요. 그런 것이 필요하면 명시적 허용 목록 항목을 사용하고 승인 프롬프트를 활성화하세요.
`openclaw security audit`는 인터프리터/런타임 `safeBins` 항목에 명시적 프로필이 없을 때 경고하고, `openclaw doctor --fix`는 누락된 custom `safeBinProfiles` 항목을 스캐폴딩할 수 있습니다.
`openclaw security audit`와 `openclaw doctor`는 또한 `jq` 같은 광범위 동작 바이너리를 `safeBins`에 다시 추가하면 경고합니다.
인터프리터를 명시적으로 허용 목록에 넣는다면 인라인 코드 eval 형식이 여전히 새로운 승인을 요구하도록 `tools.exec.strictInlineEval`을 활성화하세요.

전체 정책 세부 사항과 예시는 [Exec 승인](/ko/tools/exec-approvals-advanced#safe-bins-stdin-only) 및 [Safe bins versus allowlist](/ko/tools/exec-approvals-advanced#safe-bins-versus-allowlist)를 참고하세요.

## 예시

포그라운드:

```json
{ "tool": "exec", "command": "ls -la" }
```

백그라운드 + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

폴링은 대기 루프가 아니라 온디맨드 상태 확인용입니다. 자동 완료 깨우기가
활성화되어 있다면 명령이 출력을 내거나 실패할 때 세션을 깨울 수 있습니다.

키 보내기 (tmux 스타일):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

제출 (CR만 전송):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

붙여넣기 (기본적으로 bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch`는 구조화된 다중 파일 편집을 위한 `exec`의 하위 도구입니다.
기본적으로 OpenAI 및 OpenAI Codex 모델에 대해 활성화되어 있습니다. 비활성화하거나 특정 모델로 제한하려는 경우에만 구성을 사용하세요:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

참고:

- OpenAI/OpenAI Codex 모델에서만 사용할 수 있습니다.
- 도구 정책은 여전히 적용됩니다. `allow: ["write"]`는 암시적으로 `apply_patch`도 허용합니다.
- 구성은 `tools.exec.applyPatch` 아래에 있습니다.
- `tools.exec.applyPatch.enabled` 기본값은 `true`이며, OpenAI 모델에 대해 도구를 비활성화하려면 `false`로 설정하세요.
- `tools.exec.applyPatch.workspaceOnly` 기본값은 `true`(워크스페이스 내부로 제한)입니다. `apply_patch`가 워크스페이스 디렉터리 밖에 쓰기/삭제를 하도록 의도한 경우에만 `false`로 설정하세요.

## 관련 문서

- [Exec 승인](/ko/tools/exec-approvals) — 셸 명령을 위한 승인 게이트
- [샌드박싱](/ko/gateway/sandboxing) — 샌드박스 환경에서 명령 실행
- [백그라운드 프로세스](/ko/gateway/background-process) — 장기 실행 exec 및 process 도구
- [보안](/ko/gateway/security) — 도구 정책 및 elevated 접근
