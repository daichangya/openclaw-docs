---
read_when:
    - 더 심층적인 진단을 위해 문제 해결 허브가 이 페이지로 안내했을 때
    - 정확한 명령이 포함된 안정적인 증상 기반 런북 섹션이 필요할 때
summary: Gateway, channels, automation, nodes, browser에 대한 심층 문제 해결 런북
title: 문제 해결
x-i18n:
    generated_at: "2026-04-07T05:56:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0202e8858310a0bfc1c994cd37b01c3b2d6c73c8a74740094e92dc3c4c36729
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway 문제 해결

이 페이지는 심층 런북입니다.
먼저 빠른 분류 흐름을 원한다면 [/help/troubleshooting](/ko/help/troubleshooting)에서 시작하세요.

## 명령 단계

먼저 다음 명령을 이 순서대로 실행하세요:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

정상 상태에서 기대되는 신호:

- `openclaw gateway status`에 `Runtime: running` 및 `RPC probe: ok`가 표시됩니다.
- `openclaw doctor`가 차단하는 config/service 문제를 보고하지 않습니다.
- `openclaw channels status --probe`가 계정별 실시간 전송 상태와,
  지원되는 경우 `works` 또는 `audit ok` 같은 probe/audit 결과를 표시합니다.

## 긴 컨텍스트에 추가 사용량이 필요한 Anthropic 429

로그/오류에 다음이 포함될 때 사용하세요:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

다음을 확인하세요:

- 선택된 Anthropic Opus/Sonnet 모델에 `params.context1m: true`가 있습니다.
- 현재 Anthropic 자격 증명은 긴 컨텍스트 사용에 적합하지 않습니다.
- 요청이 1M 베타 경로가 필요한 긴 세션/모델 실행에서만 실패합니다.

해결 방법:

1. 해당 모델의 `context1m`을 비활성화해 일반 컨텍스트 창으로 되돌립니다.
2. 긴 컨텍스트 요청에 적합한 Anthropic 자격 증명을 사용하거나 Anthropic API 키로 전환합니다.
3. Anthropic 긴 컨텍스트 요청이 거부될 때도 실행이 계속되도록 fallback 모델을 구성합니다.

관련:

- [/providers/anthropic](/ko/providers/anthropic)
- [/reference/token-use](/ko/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/ko/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 응답이 없음

channels는 올라와 있지만 아무 응답이 없으면, 무엇이든 다시 연결하기 전에 라우팅과 정책을 확인하세요.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

다음을 확인하세요:

- DM 발신자에 대한 pairing 대기 상태.
- 그룹 멘션 게이팅(`requireMention`, `mentionPatterns`).
- channel/group allowlist 불일치.

일반적인 징후:

- `drop guild message (mention required` → 멘션될 때까지 그룹 메시지가 무시됩니다.
- `pairing request` → 발신자가 승인을 받아야 합니다.
- `blocked` / `allowlist` → 발신자/channel이 정책에 의해 필터링되었습니다.

관련:

- [/channels/troubleshooting](/ko/channels/troubleshooting)
- [/channels/pairing](/ko/channels/pairing)
- [/channels/groups](/ko/channels/groups)

## Dashboard control UI 연결

dashboard/control UI가 연결되지 않으면 URL, 인증 모드, secure context 가정을 검증하세요.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

다음을 확인하세요:

- 올바른 probe URL 및 dashboard URL.
- 클라이언트와 gateway 간 인증 모드/token 불일치.
- 디바이스 ID가 필요한 환경에서의 HTTP 사용.

일반적인 징후:

- `device identity required` → 비보안 context이거나 device auth가 누락됨.
- `origin not allowed` → 브라우저 `Origin`이 `gateway.controlUi.allowedOrigins`에 없거나
  (또는 명시적 allowlist 없이 non-loopback 브라우저 origin에서 연결 중임).
- `device nonce required` / `device nonce mismatch` → 클라이언트가
  챌린지 기반 device auth 흐름(`connect.challenge` + `device.nonce`)을 완료하지 않고 있습니다.
- `device signature invalid` / `device signature expired` → 클라이언트가 현재 핸드셰이크에 대해
  잘못된 payload(또는 오래된 timestamp)에 서명했습니다.
- `AUTH_TOKEN_MISMATCH`와 `canRetryWithDeviceToken=true` → 클라이언트가 캐시된 device token으로 신뢰된 재시도를 한 번 할 수 있습니다.
- 해당 캐시된 token 재시도는 페어링된
  device token과 함께 저장된 캐시된 scope 집합을 재사용합니다. 명시적 `deviceToken` / 명시적 `scopes` 호출자는 요청한 scope 집합을 그대로 유지합니다.
- 그 재시도 경로 외에는 connect 인증 우선순위가
  명시적 공유 token/password 우선, 다음 명시적 `deviceToken`, 그다음 저장된 device token,
  마지막으로 bootstrap token입니다.
- 비동기 Tailscale Serve Control UI 경로에서, 동일한
  `{scope, ip}`에 대한 실패한 시도는 limiter가 실패를 기록하기 전에 직렬화됩니다.
  따라서 같은 클라이언트에서 잘못된 동시 재시도 두 번이 발생하면 두 번 모두 단순 불일치가 아니라
  두 번째 시도에서 `retry later`가 표시될 수 있습니다.
- 브라우저 origin loopback 클라이언트에서 `too many failed authentication attempts (retry later)` →
  동일한 정규화된 `Origin`에서 반복 실패하면 일시적으로 잠깁니다.
  다른 localhost origin은 별도 버킷을 사용합니다.
- 그 재시도 이후에도 반복되는 `unauthorized` → 공유 token/device token 불일치; 필요하면 token config를 새로 고치고 device token을 다시 승인/교체하세요.
- `gateway connect failed:` → 잘못된 host/port/url 대상.

### 인증 세부 코드 빠른 매핑

실패한 `connect` 응답의 `error.details.code`를 사용해 다음 조치를 선택하세요:

| 세부 코드                    | 의미                                                     | 권장 조치                                                                                                                                                                                                                                                                              |
| ---------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 클라이언트가 필요한 공유 token을 보내지 않았습니다.      | 클라이언트에 token을 붙여넣거나 설정한 뒤 다시 시도하세요. dashboard 경로의 경우: `openclaw config get gateway.auth.token`을 실행한 후 Control UI 설정에 붙여넣으세요.                                                                                                            |
| `AUTH_TOKEN_MISMATCH`        | 공유 token이 gateway auth token과 일치하지 않았습니다.   | `canRetryWithDeviceToken=true`이면 신뢰된 재시도를 한 번 허용하세요. 캐시된 token 재시도는 저장된 승인 scope를 재사용합니다. 명시적 `deviceToken` / `scopes` 호출자는 요청한 scope를 유지합니다. 계속 실패하면 [token drift recovery checklist](/cli/devices#token-drift-recovery-checklist)를 실행하세요. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 캐시된 디바이스별 token이 오래되었거나 취소되었습니다.   | [devices CLI](/cli/devices)를 사용해 device token을 교체하거나 다시 승인한 후 다시 연결하세요.                                                                                                                                                                                       |
| `PAIRING_REQUIRED`           | 디바이스 ID는 알려져 있지만 이 역할에 대해 승인되지 않음 | 대기 중인 요청을 승인하세요: `openclaw devices list` 후 `openclaw devices approve <requestId>`.                                                                                                                                                                                     |

device auth v2 마이그레이션 확인:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

로그에 nonce/signature 오류가 보이면, 연결 중인 클라이언트를 업데이트하고 다음을 확인하세요:

1. `connect.challenge`를 기다립니다
2. challenge에 바인딩된 payload에 서명합니다
3. 동일한 challenge nonce로 `connect.params.device.nonce`를 전송합니다

`openclaw devices rotate` / `revoke` / `remove`가 예상과 다르게 거부된다면:

- 페어링된 디바이스 token 세션은
  호출자에게 `operator.admin`도 있는 경우를 제외하면 **자기 자신의** device만 관리할 수 있습니다
- `openclaw devices rotate --scope ...`는
  호출자 세션이 이미 보유한 operator scopes만 요청할 수 있습니다

관련:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/ko/gateway/configuration) (gateway 인증 모드)
- [/gateway/trusted-proxy-auth](/ko/gateway/trusted-proxy-auth)
- [/gateway/remote](/ko/gateway/remote)
- [/cli/devices](/cli/devices)

## Gateway 서비스가 실행되지 않음

서비스는 설치되어 있지만 프로세스가 계속 실행되지 않을 때 사용하세요.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # 시스템 수준 서비스도 검사
```

다음을 확인하세요:

- 종료 힌트와 함께 `Runtime: stopped`가 표시됨.
- 서비스 config 불일치(`Config (cli)` vs `Config (service)`).
- 포트/리스너 충돌.
- `--deep` 사용 시 추가 launchd/systemd/schtasks 설치.
- `Other gateway-like services detected (best effort)` 정리 힌트.

일반적인 징후:

- `Gateway start blocked: set gateway.mode=local` 또는 `existing config is missing gateway.mode` → local gateway 모드가 활성화되지 않았거나 config 파일이 덮어써져 `gateway.mode`를 잃었습니다. 해결: config에서 `gateway.mode="local"`을 설정하거나, `openclaw onboard --mode local` / `openclaw setup`을 다시 실행해 예상되는 local-mode config를 다시 기록하세요. Podman으로 OpenClaw를 실행 중이라면 기본 config 경로는 `~/.openclaw/openclaw.json`입니다.
- `refusing to bind gateway ... without auth` → 유효한 gateway 인증 경로(token/password 또는 구성된 경우 trusted-proxy)가 없는 non-loopback bind.
- `another gateway instance is already listening` / `EADDRINUSE` → 포트 충돌.
- `Other gateway-like services detected (best effort)` → 오래되었거나 병렬인 launchd/systemd/schtasks unit가 존재합니다. 대부분의 설정에서는 머신당 gateway 하나만 유지해야 합니다. 둘 이상이 정말 필요하다면 포트 + config/state/workspace를 분리하세요. [/gateway#multiple-gateways-same-host](/ko/gateway#multiple-gateways-same-host)를 참조하세요.

관련:

- [/gateway/background-process](/ko/gateway/background-process)
- [/gateway/configuration](/ko/gateway/configuration)
- [/gateway/doctor](/ko/gateway/doctor)

## Gateway probe 경고

`openclaw gateway probe`가 무언가에는 도달하지만 여전히 경고 블록을 출력할 때 사용하세요.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

다음을 확인하세요:

- JSON 출력의 `warnings[].code` 및 `primaryTargetId`.
- 경고가 SSH fallback, 여러 gateway, 누락된 scopes, 또는 해결되지 않은 auth ref에 관한 것인지 여부.

일반적인 징후:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 설정은 실패했지만 명령은 여전히 직접 구성된/loopback 대상을 시도했습니다.
- `multiple reachable gateways detected` → 둘 이상의 대상이 응답했습니다. 일반적으로 이는 의도적인 다중 gateway 설정이거나 오래된/중복 리스너를 의미합니다.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → 연결은 되었지만 세부 RPC가 scope 제한을 받습니다. 디바이스 ID를 페어링하거나 `operator.read`가 있는 자격 증명을 사용하세요.
- 해결되지 않은 `gateway.auth.*` / `gateway.remote.*` SecretRef 경고 텍스트 → 실패한 대상에 대해 이 명령 경로에서 인증 자료를 사용할 수 없었습니다.

관련:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/ko/gateway#multiple-gateways-same-host)
- [/gateway/remote](/ko/gateway/remote)

## channel은 연결되었지만 메시지가 흐르지 않음

channel 상태는 connected인데 메시지 흐름이 끊겼다면, 정책, 권한, channel별 전달 규칙에 집중하세요.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

다음을 확인하세요:

- DM 정책(`pairing`, `allowlist`, `open`, `disabled`).
- 그룹 allowlist 및 멘션 요구 사항.
- 누락된 channel API 권한/scopes.

일반적인 징후:

- `mention required` → 그룹 멘션 정책에 따라 메시지가 무시되었습니다.
- `pairing` / 승인 대기 추적 → 발신자가 승인되지 않았습니다.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → channel 인증/권한 문제.

관련:

- [/channels/troubleshooting](/ko/channels/troubleshooting)
- [/channels/whatsapp](/ko/channels/whatsapp)
- [/channels/telegram](/ko/channels/telegram)
- [/channels/discord](/ko/channels/discord)

## Cron 및 heartbeat 전달

cron 또는 heartbeat가 실행되지 않았거나 전달되지 않았다면, 먼저 스케줄러 상태를 확인한 다음 전달 대상을 검증하세요.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

다음을 확인하세요:

- Cron이 활성화되어 있고 다음 기상이 존재함.
- 작업 실행 기록 상태(`ok`, `skipped`, `error`).
- Heartbeat 건너뜀 사유(`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

일반적인 징후:

- `cron: scheduler disabled; jobs will not run automatically` → cron 비활성화.
- `cron: timer tick failed` → 스케줄러 tick 실패; 파일/로그/런타임 오류를 확인하세요.
- `heartbeat skipped`와 `reason=quiet-hours` → 활성 시간 창 밖입니다.
- `heartbeat skipped`와 `reason=empty-heartbeat-file` → `HEARTBEAT.md`가 존재하지만 빈 줄 / markdown 헤더만 포함하므로 OpenClaw가 모델 호출을 건너뜁니다.
- `heartbeat skipped`와 `reason=no-tasks-due` → `HEARTBEAT.md`에 `tasks:` 블록이 있지만 이번 tick에서 예정된 작업이 없습니다.
- `heartbeat: unknown accountId` → heartbeat 전달 대상에 대한 잘못된 account id.
- `heartbeat skipped`와 `reason=dm-blocked` → heartbeat 대상이 DM 스타일 목적지로 확인되었지만 `agents.defaults.heartbeat.directPolicy`(또는 에이전트별 override)가 `block`으로 설정되어 있습니다.

관련:

- [/automation/cron-jobs#troubleshooting](/ko/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/ko/automation/cron-jobs)
- [/gateway/heartbeat](/ko/gateway/heartbeat)

## 페어링된 node 도구 실패

node는 페어링되었지만 도구가 실패하면, foreground, 권한, 승인 상태를 분리해서 확인하세요.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

다음을 확인하세요:

- 예상한 기능을 가진 node가 온라인인지 여부.
- 카메라/마이크/위치/화면에 대한 OS 권한 부여.
- exec 승인 및 allowlist 상태.

일반적인 징후:

- `NODE_BACKGROUND_UNAVAILABLE` → node 앱이 foreground에 있어야 합니다.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS 권한이 누락됨.
- `SYSTEM_RUN_DENIED: approval required` → exec 승인 대기 중.
- `SYSTEM_RUN_DENIED: allowlist miss` → 명령이 allowlist에 의해 차단됨.

관련:

- [/nodes/troubleshooting](/ko/nodes/troubleshooting)
- [/nodes/index](/ko/nodes/index)
- [/tools/exec-approvals](/ko/tools/exec-approvals)

## browser 도구 실패

gateway 자체는 정상인데 browser 도구 작업이 실패할 때 사용하세요.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

다음을 확인하세요:

- `plugins.allow`가 설정되어 있고 `browser`를 포함하는지 여부.
- 유효한 browser 실행 파일 경로.
- CDP 프로필 연결 가능 여부.
- `existing-session` / `user` 프로필용 로컬 Chrome 사용 가능 여부.

일반적인 징후:

- `unknown command "browser"` 또는 `unknown command 'browser'` → 번들 browser plugin이 `plugins.allow`에 의해 제외되었습니다.
- `browser.enabled=true`인데도 browser 도구가 없거나 사용할 수 없음 → `plugins.allow`가 `browser`를 제외하므로 plugin이 로드되지 않았습니다.
- `Failed to start Chrome CDP on port` → browser 프로세스 시작 실패.
- `browser.executablePath not found` → 구성된 경로가 유효하지 않음.
- `browser.cdpUrl must be http(s) or ws(s)` → 구성된 CDP URL이 `file:` 또는 `ftp:` 같은 지원되지 않는 스킴을 사용합니다.
- `browser.cdpUrl has invalid port` → 구성된 CDP URL의 포트가 잘못되었거나 범위를 벗어났습니다.
- `No Chrome tabs found for profile="user"` → Chrome MCP attach 프로필에 열린 로컬 Chrome 탭이 없습니다.
- `Remote CDP for profile "<name>" is not reachable` → 구성된 원격 CDP 엔드포인트에 gateway 호스트에서 도달할 수 없습니다.
- `Browser attachOnly is enabled ... not reachable` 또는 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only 프로필에 도달 가능한 대상이 없거나 HTTP 엔드포인트는 응답했지만 CDP WebSocket은 여전히 열 수 없습니다.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 현재 gateway 설치에 전체 Playwright 패키지가 없습니다. ARIA 스냅샷과 기본 페이지 스크린샷은 여전히 작동할 수 있지만, 탐색, AI 스냅샷, CSS 선택자 요소 스크린샷, PDF 내보내기는 계속 사용할 수 없습니다.
- `fullPage is not supported for element screenshots` → 스크린샷 요청에서 `--full-page`를 `--ref` 또는 `--element`와 함께 사용했습니다.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 스크린샷 호출은 CSS `--element`가 아니라 페이지 캡처 또는 스냅샷 `--ref`를 사용해야 합니다.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 업로드 훅은 CSS 선택자가 아니라 스냅샷 ref를 필요로 합니다.
- `existing-session file uploads currently support one file at a time.` → Chrome MCP 프로필에서는 호출당 업로드 하나만 전송하세요.
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 프로필의 dialog 훅은 timeout override를 지원하지 않습니다.
- `response body is not supported for existing-session profiles yet.` → `responsebody`는 여전히 관리형 browser 또는 raw CDP 프로필이 필요합니다.
- attach-only 또는 원격 CDP 프로필에서 오래된 viewport / dark-mode / locale / offline override → `openclaw browser stop --browser-profile <name>`을 실행해 gateway 전체를 재시작하지 않고도 활성 제어 세션을 닫고 Playwright/CDP 에뮬레이션 상태를 해제하세요.

관련:

- [/tools/browser-linux-troubleshooting](/ko/tools/browser-linux-troubleshooting)
- [/tools/browser](/ko/tools/browser)

## 업그레이드 후 갑자기 문제가 생긴 경우

업그레이드 후 발생하는 대부분의 문제는 config drift 또는 이제 더 엄격하게 적용되는 기본값 때문입니다.

### 1) 인증 및 URL override 동작이 변경됨

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

확인할 사항:

- `gateway.mode=remote`이면 로컬 서비스는 정상인데 CLI 호출이 원격 대상을 가리키고 있을 수 있습니다.
- 명시적 `--url` 호출은 저장된 자격 증명으로 fallback하지 않습니다.

일반적인 징후:

- `gateway connect failed:` → 잘못된 URL 대상.
- `unauthorized` → 엔드포인트에는 도달했지만 인증이 잘못됨.

### 2) bind 및 인증 가드레일이 더 엄격해짐

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

확인할 사항:

- non-loopback bind(`lan`, `tailnet`, `custom`)에는 유효한 gateway 인증 경로가 필요합니다: 공유 token/password 인증, 또는 올바르게 구성된 non-loopback `trusted-proxy` 배포.
- `gateway.token` 같은 이전 키는 `gateway.auth.token`을 대체하지 않습니다.

일반적인 징후:

- `refusing to bind gateway ... without auth` → 유효한 gateway 인증 경로가 없는 non-loopback bind.
- 런타임은 실행 중인데 `RPC probe: failed` → gateway는 살아 있지만 현재 인증/url로는 접근할 수 없음.

### 3) pairing 및 디바이스 ID 상태가 변경됨

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

확인할 사항:

- dashboard/nodes에 대한 디바이스 승인 대기.
- 정책 또는 ID 변경 후 DM pairing 승인 대기.

일반적인 징후:

- `device identity required` → device auth 요구 사항을 충족하지 못함.
- `pairing required` → 발신자/device가 승인되어야 함.

확인 후에도 서비스 config와 런타임이 계속 불일치하면, 동일한 profile/state 디렉터리에서 서비스 메타데이터를 다시 설치하세요:

```bash
openclaw gateway install --force
openclaw gateway restart
```

관련:

- [/gateway/pairing](/ko/gateway/pairing)
- [/gateway/authentication](/ko/gateway/authentication)
- [/gateway/background-process](/ko/gateway/background-process)
