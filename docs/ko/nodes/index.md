---
read_when:
    - iOS/Android Node를 gateway에 페어링하기
    - 에이전트 컨텍스트를 위해 Node canvas/camera 사용하기
    - 새 Node 명령 또는 CLI 헬퍼 추가하기
summary: 'Nodes: 페어링, capability, 권한, 그리고 canvas/camera/screen/device/notifications/system용 CLI 헬퍼'
title: Nodes
x-i18n:
    generated_at: "2026-04-24T06:22:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a210a5b90d78870dd6d17c0f0a81181a8897dc41149618c4359d7c03ef342fd
    source_path: nodes/index.md
    workflow: 15
---

Node는 Gateway **WebSocket**(운영자와 같은 포트)에 `role: "node"`로 연결되고 `node.invoke`를 통해 명령 표면(예: `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`)을 노출하는 동반 장치(macOS/iOS/Android/헤드리스)입니다. 프로토콜 세부 정보: [Gateway 프로토콜](/ko/gateway/protocol)

레거시 전송: [Bridge 프로토콜](/ko/gateway/bridge-protocol) (TCP JSONL;
현재 Node에 대해서는 역사적 의미만 있음)

macOS는 **Node 모드**로도 실행할 수 있습니다. 메뉴 막대 앱이 Gateway의 WS 서버에 연결하고
로컬 canvas/camera 명령을 Node로 노출하므로(`openclaw nodes …`가 이 Mac에 대해 동작함) 사용할 수 있습니다.

참고:

- Nodes는 **주변 장치**이며 gateway가 아닙니다. gateway 서비스를 실행하지 않습니다.
- Telegram/WhatsApp 등의 메시지는 **Node가 아니라 gateway**에 도착합니다.
- 문제 해결 실행 가이드: [/nodes/troubleshooting](/ko/nodes/troubleshooting)

## 페어링 + 상태

**WS Nodes는 장치 페어링을 사용합니다.** Nodes는 `connect` 중 장치 식별을 제시하며, Gateway는
`role: node`에 대한 장치 페어링 요청을 생성합니다. devices CLI(또는 UI)로 승인하세요.

빠른 CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Node가 변경된 인증 세부 정보(role/scopes/public key)로 재시도하면, 이전
보류 요청은 대체되고 새 `requestId`가 생성됩니다. 승인 전에
`openclaw devices list`를 다시 실행하세요.

참고:

- `nodes status`는 장치 페어링 역할에 `node`가 포함되면 해당 Node를 **paired**로 표시합니다.
- 장치 페어링 기록은 승인된 역할에 대한 영속 계약입니다. token
  순환은 이 계약 내부에서 유지되며, 페어링 승인이 한 번도 부여하지 않은
  다른 역할로 페어링된 Node를 업그레이드할 수 없습니다.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`)는 별도의 gateway 소유
  Node 페어링 저장소입니다. WS `connect` 핸드셰이크를 제어하지는 **않습니다**.
- 승인 범위는 보류 요청이 선언한 명령을 따릅니다:
  - 명령 없는 요청: `operator.pairing`
  - non-exec Node 명령: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## 원격 Node 호스트(`system.run`)

Gateway가 한 머신에서 실행되고, 명령은 다른 머신에서 실행되기를 원할 때 **Node 호스트**를 사용하세요.
모델은 여전히 **gateway**와 대화하고, `host=node`가 선택되면 gateway가
`exec` 호출을 **Node 호스트**로 전달합니다.

### 무엇이 어디서 실행되는가

- **Gateway 호스트**: 메시지를 받고, 모델을 실행하며, 도구 호출을 라우팅
- **Node 호스트**: Node 머신에서 `system.run`/`system.which` 실행
- **승인**: Node 호스트의 `~/.openclaw/exec-approvals.json`에서 강제됨

승인 참고:

- 승인 기반 Node 실행은 정확한 요청 컨텍스트에 바인딩됩니다.
- 직접 shell/runtime 파일 실행의 경우, OpenClaw는 최선의 노력 방식으로 하나의 구체적인 로컬
  파일 피연산자에도 바인딩하고, 실행 전에 해당 파일이 변경되면 실행을 거부합니다.
- 인터프리터/runtime 명령에 대해 OpenClaw가 정확히 하나의 구체적인 로컬 파일을 식별할 수 없으면,
  더 넓은 인터프리터 의미 체계를 가장하는 대신 승인 기반 실행은 거부됩니다. 더 넓은 인터프리터 의미 체계에는 샌드박싱,
  별도 호스트, 또는 명시적 신뢰 허용 목록/전체 워크플로를 사용하세요.

### Node 호스트 시작(포그라운드)

Node 머신에서:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH 터널을 통한 원격 gateway(loopback bind)

Gateway가 loopback에 바인드되면(`gateway.bind=loopback`, 로컬 모드 기본값),
원격 Node 호스트는 직접 연결할 수 없습니다. SSH 터널을 만들고
Node 호스트가 터널의 로컬 끝을 가리키게 하세요.

예시(Node 호스트 -> gateway 호스트):

```bash
# 터미널 A(계속 실행): 로컬 18790 -> gateway 127.0.0.1:18789 전달
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# 터미널 B: gateway token을 export하고 터널을 통해 연결
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

참고:

- `openclaw node run`은 token 또는 password 인증을 지원합니다.
- 권장 env 변수: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`
- config 대체값은 `gateway.auth.token` / `gateway.auth.password`
- 로컬 모드에서 Node 호스트는 의도적으로 `gateway.remote.token` / `gateway.remote.password`를 무시합니다.
- 원격 모드에서는 `gateway.remote.token` / `gateway.remote.password`가 원격 우선순위 규칙에 따라 대상이 됩니다.
- 활성 로컬 `gateway.auth.*` SecretRef가 구성되어 있지만 확인되지 않으면, Node-host 인증은 fail closed됩니다.
- Node-host 인증 확인은 `OPENCLAW_GATEWAY_*` env 변수만 따릅니다.

### Node 호스트 시작(서비스)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### 페어링 + 이름 지정

gateway 호스트에서:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node가 변경된 인증 세부 정보로 재시도하면 `openclaw devices list`를 다시 실행하고
현재 `requestId`를 승인하세요.

이름 지정 옵션:

- `openclaw node run` / `openclaw node install`의 `--display-name` (Node의 `~/.openclaw/node.json`에 유지됨)
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (gateway 재정의)

### 명령 허용 목록 지정

Exec 승인은 **Node 호스트별**입니다. gateway에서 허용 목록 항목을 추가하세요.

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

승인은 Node 호스트의 `~/.openclaw/exec-approvals.json`에 저장됩니다.

### exec를 Node로 지정

기본값 구성(gateway config):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

또는 세션별:

```
/exec host=node security=allowlist node=<id-or-name>
```

이렇게 설정하면 `host=node`가 있는 모든 `exec` 호출은 Node 호스트에서 실행됩니다(Node
허용 목록/승인의 적용을 받음).

`host=auto`는 자체적으로 암묵적으로 Node를 선택하지 않지만, `auto`에서의 명시적 호출별 `host=node` 요청은 허용됩니다. 세션의 기본값으로 Node exec를 원하면 `tools.exec.host=node` 또는 `/exec host=node ...`를 명시적으로 설정하세요.

관련:

- [Node 호스트 CLI](/ko/cli/node)
- [Exec 도구](/ko/tools/exec)
- [Exec 승인](/ko/tools/exec-approvals)

## 명령 호출

저수준(raw RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

일반적인 “에이전트에 MEDIA 첨부 제공” 워크플로를 위한 더 높은 수준의 헬퍼도 있습니다.

## 스크린샷(canvas 스냅샷)

Node가 Canvas(WebView)를 표시 중이면 `canvas.snapshot`은 `{ format, base64 }`를 반환합니다.

CLI 헬퍼(임시 파일에 쓰고 `MEDIA:<path>` 출력):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas 제어

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

참고:

- `canvas present`는 URL 또는 로컬 파일 경로(`--target`)를 받으며, 위치 지정을 위한 선택적 `--x/--y/--width/--height`도 지원합니다.
- `canvas eval`은 인라인 JS(`--js`) 또는 위치 인수를 받습니다.

### A2UI(Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

참고:

- A2UI v0.8 JSONL만 지원됩니다(v0.9/createSurface는 거부됨).

## 사진 + 비디오(Node 카메라)

사진(`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # 기본값: 양쪽 방향 모두(2개 MEDIA 줄)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

비디오 클립(`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

참고:

- `canvas.*`와 `camera.*`에는 Node가 **포그라운드 상태**여야 합니다(백그라운드 호출은 `NODE_BACKGROUND_UNAVAILABLE` 반환).
- 클립 길이는 과도하게 큰 base64 페이로드를 피하기 위해 제한됩니다(현재 `<= 60s`).
- Android는 가능할 때 `CAMERA`/`RECORD_AUDIO` 권한을 요청합니다. 권한이 거부되면 `*_PERMISSION_REQUIRED`로 실패합니다.

## 화면 녹화(Nodes)

지원되는 Nodes는 `screen.record`(`mp4`)를 노출합니다. 예:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

참고:

- `screen.record` 사용 가능 여부는 Node 플랫폼에 따라 다릅니다.
- 화면 녹화는 `<= 60s`로 제한됩니다.
- `--no-audio`는 지원되는 플랫폼에서 마이크 캡처를 비활성화합니다.
- 여러 화면이 있을 때는 `--screen <index>`로 디스플레이를 선택하세요.

## 위치(Nodes)

Nodes는 설정에서 위치가 활성화되면 `location.get`을 노출합니다.

CLI 헬퍼:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

참고:

- 위치는 기본적으로 **꺼져 있습니다**.
- “항상”은 시스템 권한이 필요하며, 백그라운드 fetch는 최선의 노력 방식입니다.
- 응답에는 lat/lon, 정확도(미터), 타임스탬프가 포함됩니다.

## SMS(Android Nodes)

Android Nodes는 사용자가 **SMS** 권한을 부여하고 장치가 전화 기능을 지원할 때 `sms.send`를 노출할 수 있습니다.

저수준 호출:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

참고:

- capability가 광고되기 전에 Android 장치에서 권한 프롬프트를 수락해야 합니다.
- 전화 기능이 없는 Wi‑Fi 전용 장치는 `sms.send`를 광고하지 않습니다.

## Android 장치 + 개인 데이터 명령

Android Nodes는 해당 capability가 활성화되면 추가 명령 계열을 광고할 수 있습니다.

사용 가능한 계열:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

예시 호출:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

참고:

- Motion 명령은 사용 가능한 센서에 따라 capability 게이트가 적용됩니다.

## 시스템 명령(Node 호스트 / mac Node)

macOS Node는 `system.run`, `system.notify`, `system.execApprovals.get/set`을 노출합니다.
헤드리스 Node 호스트는 `system.run`, `system.which`, `system.execApprovals.get/set`을 노출합니다.

예시:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

참고:

- `system.run`은 payload에 stdout/stderr/exit code를 반환합니다.
- 셸 실행은 이제 `host=node`와 함께 `exec` 도구를 통해 이루어집니다. `nodes`는 명시적 Node 명령을 위한 직접 RPC 표면으로 남아 있습니다.
- `nodes invoke`는 `system.run` 또는 `system.run.prepare`를 노출하지 않습니다. 이들은 exec 경로에만 남습니다.
- exec 경로는 승인 전에 정규화된 `systemRunPlan`을 준비합니다. 승인이 부여되면,
  gateway는 나중에 호출자가 수정한 command/cwd/session 필드가 아니라 저장된 해당 계획을 전달합니다.
- `system.notify`는 macOS 앱의 알림 권한 상태를 따릅니다.
- 인식되지 않는 Node `platform` / `deviceFamily` 메타데이터는 `system.run`과 `system.which`를 제외하는 보수적인 기본 허용 목록을 사용합니다. 알 수 없는 플랫폼에 이 명령이 정말 필요하다면 `gateway.nodes.allowCommands`를 통해 명시적으로 추가하세요.
- `system.run`은 `--cwd`, `--env KEY=VAL`, `--command-timeout`, `--needs-screen-recording`을 지원합니다.
- 셸 래퍼(`bash|sh|zsh ... -c/-lc`)의 경우, 요청 범위의 `--env` 값은 명시적 허용 목록(`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)으로 축소됩니다.
- allowlist 모드에서 항상 허용 결정의 경우, 알려진 디스패치 래퍼(`env`, `nice`, `nohup`, `stdbuf`, `timeout`)는 래퍼 경로 대신 내부 실행 파일 경로를 유지합니다. 안전하게 풀 수 없으면 허용 목록 항목은 자동으로 저장되지 않습니다.
- allowlist 모드의 Windows Node 호스트에서 `cmd.exe /c`를 통한 셸 래퍼 실행은 승인이 필요합니다(허용 목록 항목만으로는 래퍼 형태를 자동 허용하지 않음).
- `system.notify`는 `--priority <passive|active|timeSensitive>`와 `--delivery <system|overlay|auto>`를 지원합니다.
- Node 호스트는 `PATH` 재정의를 무시하고 위험한 시작/셸 키(`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`)를 제거합니다. 추가 PATH 항목이 필요하면 `--env`로 `PATH`를 전달하는 대신 Node 호스트 서비스 환경을 구성하거나(또는 표준 위치에 도구를 설치) 하세요.
- macOS Node 모드에서 `system.run`은 macOS 앱의 exec 승인(Settings → Exec approvals)에 의해 제어됩니다.
  Ask/allowlist/full은 헤드리스 Node 호스트와 동일하게 동작하며, 거부된 프롬프트는 `SYSTEM_RUN_DENIED`를 반환합니다.
- 헤드리스 Node 호스트에서 `system.run`은 exec 승인(`~/.openclaw/exec-approvals.json`)에 의해 제어됩니다.

## Exec Node 바인딩

여러 Node를 사용할 수 있을 때 exec를 특정 Node에 바인딩할 수 있습니다.
이렇게 하면 `exec host=node`의 기본 Node가 설정되며(에이전트별로 재정의 가능) 사용됩니다.

전역 기본값:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

에이전트별 재정의:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

모든 Node를 허용하려면 설정 해제:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## 권한 맵

Nodes는 `node.list` / `node.describe`에 권한 맵을 포함할 수 있으며, 권한 이름(예: `screenRecording`, `accessibility`)을 키로 하고 boolean 값(`true` = 허용됨)을 가집니다.

## 헤드리스 Node 호스트(크로스 플랫폼)

OpenClaw는 Gateway
WebSocket에 연결하고 `system.run` / `system.which`를 노출하는 **헤드리스 Node 호스트**(UI 없음)를 실행할 수 있습니다. 이는 Linux/Windows에서
또는 서버 옆에 최소한의 Node를 실행할 때 유용합니다.

시작:

```bash
openclaw node run --host <gateway-host> --port 18789
```

참고:

- 여전히 페어링이 필요합니다(Gateway에 장치 페어링 프롬프트가 표시됨).
- Node 호스트는 Node ID, token, 표시 이름, gateway 연결 정보를 `~/.openclaw/node.json`에 저장합니다.
- Exec 승인은 로컬의 `~/.openclaw/exec-approvals.json`을 통해 강제됩니다
  ([Exec 승인](/ko/tools/exec-approvals) 참조).
- macOS에서 헤드리스 Node 호스트는 기본적으로 로컬에서 `system.run`을 실행합니다.
  `system.run`을 컴패니언 앱 exec 호스트를 통해 라우팅하려면 `OPENCLAW_NODE_EXEC_HOST=app`을 설정하세요. 앱 호스트를 필수로 하고 사용할 수 없으면 fail closed하려면 `OPENCLAW_NODE_EXEC_FALLBACK=0`도 함께 추가하세요.
- Gateway WS가 TLS를 사용할 때는 `--tls` / `--tls-fingerprint`를 추가하세요.

## Mac Node 모드

- macOS 메뉴 막대 앱은 Gateway WS 서버에 Node로 연결됩니다(따라서 `openclaw nodes …`가 이 Mac에 대해 동작함).
- 원격 모드에서 앱은 Gateway 포트용 SSH 터널을 열고 `localhost`에 연결합니다.
