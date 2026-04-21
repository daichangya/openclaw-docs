---
read_when:
    - 문제 해결 허브가 더 심층적인 진단을 위해 여기로 안내했습니다
    - 안정적인 증상 기반 런북 섹션과 정확한 명령이 필요합니다
summary: Gateway, 채널, 자동화, Node 및 브라우저를 위한 심층 문제 해결 런북
title: 문제 해결
x-i18n:
    generated_at: "2026-04-21T06:03:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2afb105376bb467e5a344e6d73726908cb718fa13116b751fddb494a0b641c42
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway 문제 해결

이 페이지는 심층 런북입니다.
먼저 빠른 트리아지 흐름이 필요하면 [/help/troubleshooting](/ko/help/troubleshooting)에서 시작하세요.

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

- `openclaw gateway status`에 `Runtime: running`, `Connectivity probe: ok`, 그리고 `Capability: ...` 줄이 표시됩니다.
- `openclaw doctor`가 차단하는 config/service 문제를 보고하지 않습니다.
- `openclaw channels status --probe`가 계정별 라이브 전송 상태와,
  지원되는 경우 `works` 또는 `audit ok` 같은 probe/audit 결과를 표시합니다.

## Anthropic 429 추가 사용량 필요(long context)

로그/오류에 다음이 포함될 때 사용하세요:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

확인할 항목:

- 선택된 Anthropic Opus/Sonnet 모델에 `params.context1m: true`가 있습니다.
- 현재 Anthropic 자격 증명은 long-context 사용 대상이 아닙니다.
- 요청이 1M 베타 경로가 필요한 긴 세션/모델 실행에서만 실패합니다.

해결 방법:

1. 해당 모델에서 `context1m`을 비활성화해 일반 컨텍스트 창으로 대체합니다.
2. long-context 요청 자격이 있는 Anthropic 자격 증명을 사용하거나 Anthropic API 키로 전환합니다.
3. Anthropic long-context 요청이 거부될 때도 실행이 계속되도록 대체 모델을 구성합니다.

관련 문서:

- [/providers/anthropic](/ko/providers/anthropic)
- [/reference/token-use](/ko/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/ko/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 로컬 OpenAI 호환 백엔드는 직접 probe를 통과하지만 에이전트 실행은 실패함

다음 상황에서 사용하세요:

- `curl ... /v1/models`는 동작함
- 작은 직접 `/v1/chat/completions` 호출은 동작함
- OpenClaw 모델 실행은 일반 에이전트 턴에서만 실패함

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

확인할 항목:

- 직접적인 작은 호출은 성공하지만, OpenClaw 실행은 더 큰 프롬프트에서만 실패합니다
- `messages[].content`가 문자열이어야 한다는 백엔드 오류
- 더 큰 프롬프트 토큰 수 또는 전체 에이전트 런타임 프롬프트에서만 나타나는 백엔드 크래시

일반적인 징후:

- `messages[...].content: invalid type: sequence, expected a string` → 백엔드가 구조화된 Chat Completions content parts를 거부합니다. 해결: `models.providers.<provider>.models[].compat.requiresStringContent: true` 설정.
- 직접적인 작은 요청은 성공하지만 OpenClaw 에이전트 실행은 백엔드/모델 크래시와 함께 실패함(예: 일부 `inferrs` 빌드의 Gemma) → OpenClaw 전송 계층은 이미 올바를 가능성이 높고, 백엔드가 더 큰 에이전트 런타임 프롬프트 형태를 처리하지 못하는 것입니다.
- 도구를 비활성화하면 실패가 줄지만 사라지지는 않음 → tool schema가 부담의 일부였지만, 남은 문제는 여전히 상위 모델/서버 용량 또는 백엔드 버그입니다.

해결 방법:

1. 문자열 전용 Chat Completions 백엔드에는 `compat.requiresStringContent: true`를 설정합니다.
2. OpenClaw의 tool schema 표면을 안정적으로 처리하지 못하는 모델/백엔드에는 `compat.supportsTools: false`를 설정합니다.
3. 가능한 경우 프롬프트 부담을 줄입니다: 더 작은 작업공간 부트스트랩, 더 짧은 세션 기록, 더 가벼운 로컬 모델 또는 더 강한 long-context 지원이 있는 백엔드.
4. 직접적인 작은 요청이 계속 성공하는데 OpenClaw 에이전트 턴만 백엔드 내부에서 계속 크래시한다면, 이를 상위 서버/모델 제한으로 보고 허용된 페이로드 형태와 함께 해당 프로젝트에 재현 사례를 제출하세요.

관련 문서:

- [/gateway/local-models](/ko/gateway/local-models)
- [/gateway/configuration](/ko/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/ko/gateway/configuration-reference#openai-compatible-endpoints)

## 응답 없음

채널은 살아 있는데 아무 응답이 없다면, 무엇이든 다시 연결하기 전에 라우팅과 정책을 확인하세요.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

확인할 항목:

- DM 발신자에 대해 페어링이 대기 중임.
- 그룹 멘션 게이팅(`requireMention`, `mentionPatterns`).
- 채널/그룹 allowlist 불일치.

일반적인 징후:

- `drop guild message (mention required` → 멘션될 때까지 그룹 메시지가 무시됨.
- `pairing request` → 발신자 승인이 필요함.
- `blocked` / `allowlist` → 발신자/채널이 정책에 의해 필터링됨.

관련 문서:

- [/channels/troubleshooting](/ko/channels/troubleshooting)
- [/channels/pairing](/ko/channels/pairing)
- [/channels/groups](/ko/channels/groups)

## Dashboard control UI 연결

dashboard/control UI가 연결되지 않을 때는 URL, 인증 모드, secure context 가정을 검증하세요.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

확인할 항목:

- 올바른 probe URL과 dashboard URL.
- 클라이언트와 Gateway 간 인증 모드/토큰 불일치.
- device identity가 필요한데 HTTP를 사용 중임.

일반적인 징후:

- `device identity required` → 비보안 컨텍스트이거나 device auth 누락.
- `origin not allowed` → 브라우저 `Origin`이 `gateway.controlUi.allowedOrigins`에 없거나
  (또는 명시적 allowlist 없이 loopback이 아닌 브라우저 origin에서 연결 중).
- `device nonce required` / `device nonce mismatch` → 클라이언트가
  챌린지 기반 device auth 흐름(`connect.challenge` + `device.nonce`)을 완료하지 못함.
- `device signature invalid` / `device signature expired` → 클라이언트가 현재 핸드셰이크에 대해 잘못된 페이로드(또는 오래된 타임스탬프)에 서명함.
- `AUTH_TOKEN_MISMATCH`와 함께 `canRetryWithDeviceToken=true` → 클라이언트는 캐시된 device token으로 한 번 신뢰된 재시도를 할 수 있음.
- 그 캐시된 토큰 재시도는 페어링된 device token과 함께 저장된 캐시된 scope 집합을 재사용합니다. 명시적인 `deviceToken` / 명시적인 `scopes` 호출자는 요청한 scope 집합을 그대로 유지합니다.
- 그 재시도 경로 밖에서는 connect auth 우선순위가 명시적 공유 토큰/비밀번호 우선, 그다음 명시적 `deviceToken`, 저장된 device token, 마지막으로 bootstrap token입니다.
- 비동기 Tailscale Serve Control UI 경로에서는, 동일한 `{scope, ip}`에 대한 실패한 시도가 limiter가 실패를 기록하기 전에 직렬화됩니다. 따라서 같은 클라이언트의 잘못된 동시 재시도 두 번이 두 번의 단순 불일치 대신 두 번째 시도에서 `retry later`로 나타날 수 있습니다.
- 브라우저 origin 기반 loopback 클라이언트에서 `too many failed authentication attempts (retry later)` → 같은 정규화된 `Origin`에서 반복된 실패가 일시적으로 잠겼음을 의미합니다. 다른 localhost origin은 별도 버킷을 사용합니다.
- 그 재시도 이후에도 반복되는 `unauthorized` → 공유 토큰/device token 드리프트; 토큰 config를 새로고침하고 필요하면 device token을 다시 승인/교체하세요.
- `gateway connect failed:` → 잘못된 호스트/포트/url 대상.

### 인증 세부 코드 빠른 매핑

실패한 `connect` 응답의 `error.details.code`를 사용해 다음 조치를 선택하세요:

| Detail code                  | 의미                                                                                                                                                                             | 권장 조치                                                                                                                                                                                                                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 클라이언트가 필요한 공유 토큰을 보내지 않았습니다.                                                                                                                                | 클라이언트에 토큰을 붙여넣거나 설정한 뒤 재시도하세요. dashboard 경로의 경우: `openclaw config get gateway.auth.token` 실행 후 Control UI 설정에 붙여넣으세요.                                                                                                                           |
| `AUTH_TOKEN_MISMATCH`        | 공유 토큰이 Gateway 인증 토큰과 일치하지 않았습니다.                                                                                                                              | `canRetryWithDeviceToken=true`이면 한 번 신뢰된 재시도를 허용하세요. 캐시된 토큰 재시도는 저장된 승인된 scope를 재사용합니다. 명시적 `deviceToken` / `scopes` 호출자는 요청한 scope를 유지합니다. 여전히 실패하면 [토큰 드리프트 복구 체크리스트](/cli/devices#token-drift-recovery-checklist)를 실행하세요. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 캐시된 장치별 토큰이 오래되었거나 취소되었습니다.                                                                                                                                 | [devices CLI](/cli/devices)를 사용해 device token을 교체/재승인한 뒤 다시 연결하세요.                                                                                                                                                                                                      |
| `PAIRING_REQUIRED`           | device identity에 승인이 필요합니다. `error.details.reason`에서 `not-paired`, `scope-upgrade`, `role-upgrade`, `metadata-upgrade`를 확인하고, 있을 경우 `requestId` / `remediationHint`를 사용하세요. | 대기 중인 요청을 승인하세요: `openclaw devices list` 후 `openclaw devices approve <requestId>`. scope/role 업그레이드도 요청된 액세스를 검토한 뒤 같은 흐름을 사용합니다.                                                                                                              |

device auth v2 마이그레이션 확인:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

로그에 nonce/signature 오류가 보이면 연결 중인 클라이언트를 업데이트하고 다음을 확인하세요:

1. `connect.challenge`를 기다림
2. 챌린지에 바인딩된 페이로드에 서명함
3. 동일한 챌린지 nonce와 함께 `connect.params.device.nonce`를 보냄

`openclaw devices rotate` / `revoke` / `remove`가 예상치 않게 거부되는 경우:

- 페어링된 device token 세션은 호출자에게 `operator.admin`도 있지 않으면 **자기 자신의** device만 관리할 수 있습니다
- `openclaw devices rotate --scope ...`는 호출자 세션이 이미 보유한 operator scope만 요청할 수 있습니다

관련 문서:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/ko/gateway/configuration) (Gateway 인증 모드)
- [/gateway/trusted-proxy-auth](/ko/gateway/trusted-proxy-auth)
- [/gateway/remote](/ko/gateway/remote)
- [/cli/devices](/cli/devices)

## Gateway 서비스가 실행되지 않음

서비스는 설치되어 있지만 프로세스가 유지되지 않을 때 사용하세요.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # 시스템 수준 서비스도 함께 검사
```

확인할 항목:

- 종료 힌트와 함께 `Runtime: stopped`가 표시됨.
- 서비스 config 불일치(`Config (cli)` 대 `Config (service)`).
- 포트/리스너 충돌.
- `--deep` 사용 시 추가 launchd/systemd/schtasks 설치.
- `Other gateway-like services detected (best effort)` 정리 힌트.

일반적인 징후:

- `Gateway start blocked: set gateway.mode=local` 또는 `existing config is missing gateway.mode` → 로컬 Gateway 모드가 활성화되지 않았거나 config 파일이 손상되어 `gateway.mode`를 잃어버렸습니다. 해결: config에서 `gateway.mode="local"`을 설정하거나 `openclaw onboard --mode local` / `openclaw setup`을 다시 실행해 예상되는 로컬 모드 config를 다시 찍으세요. Podman으로 OpenClaw를 실행 중이라면 기본 config 경로는 `~/.openclaw/openclaw.json`입니다.
- `refusing to bind gateway ... without auth` → 유효한 Gateway 인증 경로(토큰/비밀번호 또는 구성된 trusted-proxy) 없이 non-loopback 바인드 시도.
- `another gateway instance is already listening` / `EADDRINUSE` → 포트 충돌.
- `Other gateway-like services detected (best effort)` → 오래되었거나 병렬인 launchd/systemd/schtasks 유닛이 존재합니다. 대부분의 설정에서는 머신당 Gateway 하나만 유지해야 합니다. 둘 이상이 필요하다면 포트 + config/state/workspace를 분리하세요. [/gateway#multiple-gateways-same-host](/ko/gateway#multiple-gateways-same-host)를 참조하세요.

관련 문서:

- [/gateway/background-process](/ko/gateway/background-process)
- [/gateway/configuration](/ko/gateway/configuration)
- [/gateway/doctor](/ko/gateway/doctor)

## Gateway가 마지막 정상 config를 복원함

Gateway는 시작되지만 로그에 `openclaw.json`을 복원했다고 나올 때 사용하세요.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

확인할 항목:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- 활성 config 옆에 타임스탬프가 붙은 `openclaw.json.clobbered.*` 파일
- `Config recovery warning`으로 시작하는 메인 에이전트 시스템 이벤트

무슨 일이 있었는지:

- 거부된 config가 시작 시 또는 hot reload 중 검증을 통과하지 못했습니다.
- OpenClaw는 거부된 페이로드를 `.clobbered.*`로 보존했습니다.
- 활성 config는 마지막으로 검증된 last-known-good 복사본에서 복원되었습니다.
- 다음 메인 에이전트 턴에는 거부된 config를 무작정 다시 쓰지 말라는 경고가 표시됩니다.

검사 및 복구:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

일반적인 징후:

- `.clobbered.*`가 존재함 → 외부의 직접 편집 또는 시작 시 읽은 내용이 복원됨.
- `.rejected.*`가 존재함 → OpenClaw가 소유한 config 쓰기가 커밋 전에 schema 또는 clobber 검사를 통과하지 못함.
- `Config write rejected:` → 쓰기 작업이 필요한 형태를 제거하거나, 파일 크기를 급격히 줄이거나, 유효하지 않은 config를 저장하려고 시도함.
- `Config last-known-good promotion skipped` → 후보에 `***` 같은 마스킹된 secret 플레이스홀더가 포함되어 있었음.

해결 방법:

1. 복원된 활성 config가 올바르면 그대로 유지합니다.
2. `.clobbered.*` 또는 `.rejected.*`에서 의도한 키만 복사한 뒤 `openclaw config set` 또는 `config.patch`로 적용합니다.
3. 다시 시작하기 전에 `openclaw config validate`를 실행합니다.
4. 수동 편집 시에는 변경하려는 부분 객체만이 아니라 전체 JSON5 config를 유지하세요.

관련 문서:

- [/gateway/configuration#strict-validation](/ko/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/ko/gateway/configuration#config-hot-reload)
- [/cli/config](/cli/config)
- [/gateway/doctor](/ko/gateway/doctor)

## Gateway probe 경고

`openclaw gateway probe`가 무언가에 도달하긴 하지만 여전히 경고 블록을 출력할 때 사용하세요.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

확인할 항목:

- JSON 출력의 `warnings[].code` 및 `primaryTargetId`.
- 경고가 SSH 대체 경로, 다중 Gateway, 누락된 scope 또는 해결되지 않은 auth ref에 관한 것인지.

일반적인 징후:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 설정이 실패했지만, 명령은 여전히 직접 구성된/loopback 대상을 시도했습니다.
- `multiple reachable gateways detected` → 둘 이상의 대상이 응답했습니다. 보통 의도된 다중 Gateway 설정이거나 오래되었거나 중복된 리스너를 뜻합니다.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 연결은 됐지만 세부 RPC가 scope 제한을 받습니다. device identity를 페어링하거나 `operator.read`가 있는 자격 증명을 사용하세요.
- `Capability: pairing-pending` 또는 `gateway closed (1008): pairing required` → Gateway는 응답했지만 이 클라이언트는 정상 operator 액세스 전에 여전히 페어링/승인이 필요합니다.
- 해결되지 않은 `gateway.auth.*` / `gateway.remote.*` SecretRef 경고 텍스트 → 실패한 대상에 대해 이 명령 경로에서 auth 자료를 사용할 수 없었습니다.

관련 문서:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/ko/gateway#multiple-gateways-same-host)
- [/gateway/remote](/ko/gateway/remote)

## 채널은 연결되었지만 메시지가 흐르지 않음

채널 상태는 connected인데 메시지 흐름이 죽어 있다면, 정책, 권한, 채널별 전달 규칙에 집중하세요.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

확인할 항목:

- DM 정책(`pairing`, `allowlist`, `open`, `disabled`).
- 그룹 allowlist 및 멘션 요구사항.
- 누락된 채널 API 권한/scope.

일반적인 징후:

- `mention required` → 그룹 멘션 정책에 의해 메시지가 무시됨.
- `pairing` / 대기 중 승인 흔적 → 발신자가 승인되지 않음.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → 채널 인증/권한 문제.

관련 문서:

- [/channels/troubleshooting](/ko/channels/troubleshooting)
- [/channels/whatsapp](/ko/channels/whatsapp)
- [/channels/telegram](/ko/channels/telegram)
- [/channels/discord](/ko/channels/discord)

## Cron 및 Heartbeat 전달

Cron 또는 Heartbeat가 실행되지 않았거나 전달되지 않았다면, 먼저 스케줄러 상태를 확인한 다음 전달 대상을 확인하세요.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

확인할 항목:

- Cron이 활성화되어 있고 다음 기상이 존재함.
- 작업 실행 기록 상태(`ok`, `skipped`, `error`).
- Heartbeat 건너뜀 사유(`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

일반적인 징후:

- `cron: scheduler disabled; jobs will not run automatically` → Cron 비활성화.
- `cron: timer tick failed` → 스케줄러 tick 실패. 파일/로그/런타임 오류를 확인하세요.
- `heartbeat skipped`와 함께 `reason=quiet-hours` → 활성 시간대 밖임.
- `heartbeat skipped`와 함께 `reason=empty-heartbeat-file` → `HEARTBEAT.md`가 존재하지만 빈 줄/마크다운 헤더만 포함하므로 OpenClaw가 모델 호출을 건너뜁니다.
- `heartbeat skipped`와 함께 `reason=no-tasks-due` → `HEARTBEAT.md`에 `tasks:` 블록이 있지만 이번 tick에서 마감된 작업이 없습니다.
- `heartbeat: unknown accountId` → Heartbeat 전달 대상에 잘못된 account id.
- `heartbeat skipped`와 함께 `reason=dm-blocked` → Heartbeat 대상이 DM 스타일 대상로 확인되었지만 `agents.defaults.heartbeat.directPolicy`(또는 에이전트별 재정의)가 `block`으로 설정되어 있음.

관련 문서:

- [/automation/cron-jobs#troubleshooting](/ko/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/ko/automation/cron-jobs)
- [/gateway/heartbeat](/ko/gateway/heartbeat)

## Node 페어링된 도구 실패

Node는 페어링되었지만 도구가 실패한다면, foreground, 권한, 승인 상태를 분리해 확인하세요.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

확인할 항목:

- 예상된 기능을 가진 온라인 Node.
- 카메라/마이크/위치/화면에 대한 OS 권한 부여.
- exec 승인 및 allowlist 상태.

일반적인 징후:

- `NODE_BACKGROUND_UNAVAILABLE` → Node 앱이 foreground에 있어야 함.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS 권한 누락.
- `SYSTEM_RUN_DENIED: approval required` → exec 승인 대기 중.
- `SYSTEM_RUN_DENIED: allowlist miss` → 명령이 allowlist에 의해 차단됨.

관련 문서:

- [/nodes/troubleshooting](/ko/nodes/troubleshooting)
- [/nodes/index](/ko/nodes/index)
- [/tools/exec-approvals](/ko/tools/exec-approvals)

## 브라우저 도구 실패

Gateway 자체는 정상인데 브라우저 도구 액션이 실패할 때 사용하세요.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

확인할 항목:

- `plugins.allow`가 설정되어 있고 `browser`를 포함하는지.
- 유효한 브라우저 실행 파일 경로.
- CDP 프로필 도달 가능성.
- `existing-session` / `user` 프로필에 대한 로컬 Chrome 사용 가능 여부.

일반적인 징후:

- `unknown command "browser"` 또는 `unknown command 'browser'` → 번들된 browser plugin이 `plugins.allow`에 의해 제외됨.
- `browser.enabled=true`인데 browser 도구가 없거나 사용 불가 → `plugins.allow`가 `browser`를 제외하므로 plugin이 로드되지 않음.
- `Failed to start Chrome CDP on port` → 브라우저 프로세스 시작 실패.
- `browser.executablePath not found` → 구성된 경로가 유효하지 않음.
- `browser.cdpUrl must be http(s) or ws(s)` → 구성된 CDP URL이 `file:` 또는 `ftp:` 같은 지원되지 않는 스킴을 사용함.
- `browser.cdpUrl has invalid port` → 구성된 CDP URL의 포트가 잘못되었거나 범위를 벗어남.
- `No Chrome tabs found for profile="user"` → Chrome MCP attach 프로필에 열린 로컬 Chrome 탭이 없음.
- `Remote CDP for profile "<name>" is not reachable` → 구성된 원격 CDP 엔드포인트가 Gateway 호스트에서 도달 불가.
- `Browser attachOnly is enabled ... not reachable` 또는 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only 프로필에 도달 가능한 대상이 없거나, HTTP 엔드포인트는 응답했지만 CDP WebSocket은 여전히 열 수 없음.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 현재 Gateway 설치에 전체 Playwright 패키지가 없음. ARIA 스냅샷과 기본 페이지 스크린샷은 동작할 수 있지만, 탐색, AI 스냅샷, CSS 선택자 요소 스크린샷, PDF 내보내기는 계속 사용할 수 없습니다.
- `fullPage is not supported for element screenshots` → 스크린샷 요청이 `--full-page`와 `--ref` 또는 `--element`를 함께 사용함.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 스크린샷 호출은 CSS `--element`가 아니라 페이지 캡처 또는 스냅샷 `--ref`를 사용해야 함.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 업로드 훅은 CSS 선택자가 아니라 스냅샷 ref가 필요함.
- `existing-session file uploads currently support one file at a time.` → Chrome MCP 프로필에서는 호출당 업로드 하나만 전송하세요.
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 프로필의 대화상자 훅은 timeout 재정의를 지원하지 않음.
- `response body is not supported for existing-session profiles yet.` → `responsebody`는 여전히 관리형 브라우저 또는 원시 CDP 프로필이 필요함.
- attach-only 또는 원격 CDP 프로필에서 오래된 viewport / dark-mode / locale / offline 재정의가 남아 있음 → `openclaw browser stop --browser-profile <name>`를 실행해 전체 Gateway를 재시작하지 않고 활성 제어 세션을 닫고 Playwright/CDP 에뮬레이션 상태를 해제하세요.

관련 문서:

- [/tools/browser-linux-troubleshooting](/ko/tools/browser-linux-troubleshooting)
- [/tools/browser](/ko/tools/browser)

## 업그레이드 후 갑자기 문제가 생긴 경우

업그레이드 후의 대부분의 문제는 config 드리프트 또는 이제 더 엄격해진 기본값 적용 때문입니다.

### 1) 인증 및 URL 재정의 동작이 변경됨

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

확인할 항목:

- `gateway.mode=remote`라면, 로컬 서비스는 정상이어도 CLI 호출이 원격 대상을 향하고 있을 수 있습니다.
- 명시적인 `--url` 호출은 저장된 자격 증명으로 대체되지 않습니다.

일반적인 징후:

- `gateway connect failed:` → 잘못된 URL 대상.
- `unauthorized` → 엔드포인트에는 도달했지만 인증이 잘못됨.

### 2) 바인드 및 인증 가드레일이 더 엄격해짐

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

확인할 항목:

- non-loopback 바인드(`lan`, `tailnet`, `custom`)에는 유효한 Gateway 인증 경로가 필요합니다: 공유 토큰/비밀번호 인증 또는 올바르게 구성된 non-loopback `trusted-proxy` 배포.
- `gateway.token` 같은 이전 키는 `gateway.auth.token`을 대체하지 않습니다.

일반적인 징후:

- `refusing to bind gateway ... without auth` → 유효한 Gateway 인증 경로 없이 non-loopback 바인드 시도.
- 런타임은 실행 중인데 `Connectivity probe: failed` → Gateway는 살아 있지만 현재 auth/url로는 접근할 수 없음.

### 3) 페어링 및 device identity 상태가 변경됨

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

확인할 항목:

- dashboard/nodes에 대한 대기 중인 device 승인.
- 정책 또는 identity 변경 이후 대기 중인 DM 페어링 승인.

일반적인 징후:

- `device identity required` → device auth가 충족되지 않음.
- `pairing required` → 발신자/device 승인이 필요함.

확인 후에도 서비스 config와 런타임이 계속 불일치한다면, 동일한 프로필/state 디렉터리에서 서비스 메타데이터를 다시 설치하세요:

```bash
openclaw gateway install --force
openclaw gateway restart
```

관련 문서:

- [/gateway/pairing](/ko/gateway/pairing)
- [/gateway/authentication](/ko/gateway/authentication)
- [/gateway/background-process](/ko/gateway/background-process)
