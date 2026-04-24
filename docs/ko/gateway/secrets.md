---
read_when:
    - provider 자격 증명과 `auth-profiles.json` ref에 대한 SecretRef 구성하기
    - 프로덕션에서 비밀 다시 로드, 감사, 구성, 적용을 안전하게 운영하기
    - 시작 시 fail-fast, 비활성 표면 필터링, 그리고 last-known-good 동작 이해하기
summary: '비밀 관리: SecretRef 계약, 런타임 스냅샷 동작, 안전한 단방향 스크러빙'
title: 비밀 관리
x-i18n:
    generated_at: "2026-04-24T06:16:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e21f63bbf1815b7166dfe123900575754270de94113b446311d73dfd4f2343
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw는 지원되는 자격 증명을 config에 일반 텍스트로 저장하지 않아도 되도록 additive SecretRef를 지원합니다.

일반 텍스트도 계속 사용할 수 있습니다. SecretRef는 자격 증명별로 옵트인입니다.

## 목표와 런타임 모델

비밀은 메모리 내 런타임 스냅샷으로 해석됩니다.

- 해석은 요청 경로에서 지연 수행되는 것이 아니라 활성화 중 eager하게 수행됩니다.
- 실질적으로 활성인 SecretRef를 해석할 수 없으면 시작은 fail-fast합니다.
- 다시 로드는 원자적 교체를 사용합니다. 즉, 전체 성공 또는 마지막으로 알려진 정상 스냅샷 유지입니다.
- SecretRef 정책 위반(예: SecretRef 입력과 결합된 OAuth 모드 auth profile)은 런타임 교체 전에 활성화를 실패시킵니다.
- 런타임 요청은 활성 메모리 내 스냅샷에서만 읽습니다.
- 첫 번째 config 활성화/로드가 성공한 뒤에는, 성공적인 다시 로드가 이를 교체할 때까지 런타임 코드 경로는 계속 그 활성 메모리 내 스냅샷을 읽습니다.
- 아웃바운드 전달 경로도 그 활성 스냅샷에서 읽습니다(예: Discord 응답/스레드 전달 및 Telegram 작업 전송). 매 전송마다 SecretRef를 다시 해석하지 않습니다.

이렇게 하면 비밀 provider 장애가 hot request 경로에 영향을 주지 않습니다.

## 활성 표면 필터링

SecretRef는 실질적으로 활성인 표면에서만 검증됩니다.

- 활성 표면: 해석되지 않은 ref가 시작/다시 로드를 차단합니다.
- 비활성 표면: 해석되지 않은 ref가 시작/다시 로드를 차단하지 않습니다.
- 비활성 ref는 코드 `SECRETS_REF_IGNORED_INACTIVE_SURFACE`와 함께 비치명적 진단을 출력합니다.

비활성 표면 예시:

- 비활성화된 채널/계정 항목
- 활성화된 계정이 상속하지 않는 최상위 채널 자격 증명
- 비활성화된 도구/기능 표면
- `tools.web.search.provider`에서 선택되지 않은 웹 검색 provider별 키
  auto 모드(provider 미설정)에서는 하나가 해석될 때까지 provider 자동 감지를 위한 우선순위에 따라 키를 참조합니다.
  선택 이후 선택되지 않은 provider 키는 선택될 때까지 비활성으로 취급됩니다.
- sandbox SSH 인증 자료(`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData`, 그리고 에이전트별 재정의)는
  기본 에이전트 또는 활성화된 에이전트에 대해 실효 sandbox backend가 `ssh`일 때만
  활성입니다.
- `gateway.remote.token` / `gateway.remote.password` SecretRef는 다음 중 하나가 참이면 활성입니다.
  - `gateway.mode=remote`
  - `gateway.remote.url`이 구성됨
  - `gateway.tailscale.mode`가 `serve` 또는 `funnel`
  - 위 원격 표면이 없는 로컬 모드에서는:
    - `gateway.remote.token`은 토큰 인증이 우선될 수 있고 env/auth 토큰이 구성되지 않았을 때 활성입니다.
    - `gateway.remote.password`는 비밀번호 인증이 우선될 수 있고 env/auth 비밀번호가 구성되지 않았을 때만 활성입니다.
- `gateway.auth.token` SecretRef는 `OPENCLAW_GATEWAY_TOKEN`이 설정되어 있으면 시작 인증 해석에 대해 비활성입니다. 이 런타임에서는 env 토큰 입력이 우선하기 때문입니다.

## Gateway 인증 표면 진단

`gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token`, 또는 `gateway.remote.password`에 SecretRef가 구성되면,
gateway 시작/다시 로드는 표면 상태를 명시적으로 기록합니다.

- `active`: SecretRef가 실효 인증 표면의 일부이며 반드시 해석되어야 함
- `inactive`: 다른 인증 표면이 우선하거나
  원격 인증이 비활성/비활성 상태이기 때문에 이 런타임에서는 SecretRef가 무시됨

이 항목들은 `SECRETS_GATEWAY_AUTH_SURFACE`로 기록되며 활성 표면 정책이 사용한 이유를 포함하므로, 왜 자격 증명이 활성 또는 비활성으로 취급되었는지 확인할 수 있습니다.

## 온보딩 참조 사전 점검

온보딩이 대화형 모드에서 실행되고 SecretRef 저장소를 선택하면 OpenClaw는 저장 전에 사전 점검 검증을 수행합니다.

- Env ref: env var 이름을 검증하고 setup 중 비어 있지 않은 값이 보이는지 확인합니다.
- Provider ref(`file` 또는 `exec`): provider 선택을 검증하고 `id`를 해석하며 해석된 값의 유형을 확인합니다.
- Quickstart 재사용 경로: `gateway.auth.token`이 이미 SecretRef인 경우 온보딩은 probe/dashboard bootstrap 전에 이를 해석합니다(`env`, `file`, `exec` ref 대상) 같은 fail-fast 게이트를 사용합니다.

검증에 실패하면 온보딩은 오류를 표시하고 재시도를 허용합니다.

## SecretRef 계약

모든 곳에서 하나의 객체 형태를 사용하세요.

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

검증:

- `provider`는 `^[a-z][a-z0-9_-]{0,63}$`와 일치해야 합니다.
- `id`는 `^[A-Z][A-Z0-9_]{0,127}$`와 일치해야 합니다.

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

검증:

- `provider`는 `^[a-z][a-z0-9_-]{0,63}$`와 일치해야 합니다.
- `id`는 절대 JSON pointer여야 합니다(`/...`).
- 세그먼트의 RFC6901 이스케이프: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

검증:

- `provider`는 `^[a-z][a-z0-9_-]{0,63}$`와 일치해야 합니다.
- `id`는 `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`와 일치해야 합니다.
- `id`는 슬래시로 구분된 경로 세그먼트로 `.` 또는 `..`를 포함하면 안 됩니다(예: `a/../b`는 거부됨).

## Provider 구성

provider는 `secrets.providers` 아래에 정의합니다.

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // 또는 "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

### Env provider

- 선택적 허용 목록은 `allowlist`로 지정합니다.
- 누락되었거나 빈 env 값은 해석 실패로 처리됩니다.

### File provider

- `path`에서 로컬 파일을 읽습니다.
- `mode: "json"`은 JSON 객체 페이로드를 기대하며 `id`를 pointer로 해석합니다.
- `mode: "singleValue"`는 ref id `"value"`를 기대하며 파일 내용을 반환합니다.
- 경로는 소유권/권한 검사를 통과해야 합니다.
- Windows fail-closed 참고: 경로에 대한 ACL 검증을 사용할 수 없으면 해석은 실패합니다. 신뢰된 경로에 한해서만 해당 provider에 `allowInsecurePath: true`를 설정해 경로 보안 검사를 우회할 수 있습니다.

### Exec provider

- 셸 없이 구성된 절대 바이너리 경로를 실행합니다.
- 기본적으로 `command`는 일반 파일을 가리켜야 하며 symlink는 허용되지 않습니다.
- symlink 명령 경로를 허용하려면 `allowSymlinkCommand: true`를 설정하세요(예: Homebrew shim). OpenClaw는 해석된 대상 경로를 검증합니다.
- package manager 경로에는 `allowSymlinkCommand`를 `trustedDirs`와 함께 사용하세요(예: `["/opt/homebrew"]`).
- 타임아웃, 출력 없음 타임아웃, 출력 바이트 제한, env 허용 목록, trusted dir를 지원합니다.
- Windows fail-closed 참고: 명령 경로에 대한 ACL 검증을 사용할 수 없으면 해석은 실패합니다. 신뢰된 경로에 한해서만 해당 provider에 `allowInsecurePath: true`를 설정해 경로 보안 검사를 우회할 수 있습니다.

요청 페이로드(stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

응답 페이로드(stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

선택적 ID별 오류:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Exec 통합 예제

### 1Password CLI

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // Homebrew symlink 바이너리에 필요
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

### HashiCorp Vault CLI

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // Homebrew symlink 바이너리에 필요
        trustedDirs: ["/opt/homebrew"],
        args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
        passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "vault_openai", id: "value" },
      },
    },
  },
}
```

### `sops`

```json5
{
  secrets: {
    providers: {
      sops_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true, // Homebrew symlink 바이너리에 필요
        trustedDirs: ["/opt/homebrew"],
        args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
        passEnv: ["SOPS_AGE_KEY_FILE"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "sops_openai", id: "value" },
      },
    },
  },
}
```

## MCP 서버 환경 변수

`plugins.entries.acpx.config.mcpServers`를 통해 구성된 MCP 서버 env var는 SecretInput을 지원합니다. 이렇게 하면 API 키와 토큰을 일반 텍스트 config에서 제외할 수 있습니다.

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

일반 텍스트 문자열 값도 계속 작동합니다. `${MCP_SERVER_API_KEY}` 같은 env-template ref와 SecretRef 객체는 MCP 서버 프로세스가 시작되기 전에 gateway 활성화 중 해석됩니다. 다른 SecretRef 표면과 마찬가지로, 해석되지 않은 ref는 `acpx` Plugin이 실질적으로 활성일 때만 활성화를 차단합니다.

## Sandbox SSH 인증 자료

핵심 `ssh` sandbox backend도 SSH 인증 자료에 대해 SecretRef를 지원합니다.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

런타임 동작:

- OpenClaw는 각 SSH 호출 때 지연 해석하지 않고 sandbox 활성화 중 이 ref를 해석합니다.
- 해석된 값은 제한적인 권한을 가진 임시 파일에 기록되고 생성된 SSH config에서 사용됩니다.
- 실효 sandbox backend가 `ssh`가 아니면 이 ref는 비활성 상태로 남아 시작을 차단하지 않습니다.

## 지원되는 자격 증명 표면

정식으로 지원되는 자격 증명과 지원되지 않는 자격 증명은 다음에 나열되어 있습니다.

- [SecretRef Credential Surface](/ko/reference/secretref-credential-surface)

런타임에서 생성되거나 순환하는 자격 증명과 OAuth refresh 자료는 읽기 전용 SecretRef 해석에서 의도적으로 제외됩니다.

## 필수 동작 및 우선순위

- ref가 없는 필드: 변경 없음
- ref가 있는 필드: 활성 표면에서는 활성화 중 필수
- 일반 텍스트와 ref가 모두 있으면, 지원되는 우선순위 경로에서는 ref가 우선합니다.
- redaction sentinel `__OPENCLAW_REDACTED__`는 내부 config redaction/복원용으로 예약되어 있으며 제출된 literal config 데이터로는 거부됩니다.

경고 및 감사 신호:

- `SECRETS_REF_OVERRIDES_PLAINTEXT`(런타임 경고)
- `REF_SHADOWED`(`auth-profiles.json` 자격 증명이 `openclaw.json` ref보다 우선할 때의 감사 결과)

Google Chat 호환 동작:

- `serviceAccountRef`가 일반 텍스트 `serviceAccount`보다 우선합니다.
- 형제 ref가 설정되어 있으면 일반 텍스트 값은 무시됩니다.

## 활성화 트리거

비밀 활성화는 다음에서 실행됩니다.

- 시작 시(사전 점검 + 최종 활성화)
- Config reload hot-apply 경로
- Config reload restart-check 경로
- `secrets.reload`를 통한 수동 다시 로드
- 제출된 config 페이로드 안에서 실효 활성 표면 SecretRef 해석 가능성을 영구 저장 전에 검사하는 Gateway config 쓰기 RPC 사전 점검(`config.set` / `config.apply` / `config.patch`)

활성화 계약:

- 성공하면 스냅샷을 원자적으로 교체합니다.
- 시작 실패는 gateway 시작을 중단합니다.
- 런타임 다시 로드 실패는 마지막으로 알려진 정상 스냅샷을 유지합니다.
- Write-RPC 사전 점검 실패는 제출된 config를 거부하고 디스크 config와 활성 런타임 스냅샷 모두를 변경 없이 유지합니다.
- 아웃바운드 도우미/도구 호출에 명시적인 호출별 채널 토큰을 제공해도 SecretRef 활성화는 트리거되지 않습니다. 활성화 지점은 시작, 다시 로드, 명시적 `secrets.reload`에 그대로 머뭅니다.

## 저하 및 복구 신호

정상 상태 이후 다시 로드 시점 활성화가 실패하면 OpenClaw는 저하된 비밀 상태로 들어갑니다.

일회성 시스템 이벤트 및 로그 코드:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

동작:

- 저하 상태: 런타임은 마지막으로 알려진 정상 스냅샷을 유지합니다.
- 복구 상태: 다음 성공적인 활성화 후 한 번만 발생합니다.
- 이미 저하된 상태에서 반복 실패가 발생하면 경고 로그만 남기고 이벤트를 과도하게 발생시키지 않습니다.
- 시작 시 fail-fast는 런타임이 한 번도 활성 상태가 되지 않았으므로 저하 이벤트를 발생시키지 않습니다.

## 명령 경로 해석

명령 경로는 gateway snapshot RPC를 통해 지원되는 SecretRef 해석에 옵트인할 수 있습니다.

크게 두 가지 동작이 있습니다.

- 엄격한 명령 경로(예: `openclaw memory`의 원격 메모리 경로, 그리고 원격 공유 비밀 ref가 필요한 `openclaw qr --remote`)는 활성 스냅샷에서 읽고 필요한 SecretRef를 사용할 수 없으면 fail-fast합니다.
- 읽기 전용 명령 경로(예: `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, 읽기 전용 doctor/config 복구 흐름)도 활성 스냅샷을 우선하지만, 대상 SecretRef를 그 명령 경로에서 사용할 수 없을 때는 중단 대신 저하됩니다.

읽기 전용 동작:

- gateway가 실행 중이면 이 명령들은 먼저 활성 스냅샷에서 읽습니다.
- gateway 해석이 불완전하거나 gateway를 사용할 수 없으면, 특정 명령 표면에 대해 대상화된 로컬 폴백을 시도합니다.
- 대상 SecretRef를 여전히 사용할 수 없으면 명령은 “구성되어 있지만 이 명령 경로에서는 사용할 수 없음” 같은 명시적 진단과 함께 저하된 읽기 전용 출력으로 계속 진행됩니다.
- 이런 저하 동작은 명령 로컬에만 적용됩니다. 런타임 시작, 다시 로드, 전송/인증 경로를 약화시키지 않습니다.

기타 참고:

- 백엔드 비밀 순환 후 스냅샷 새로고침은 `openclaw secrets reload`로 처리합니다.
- 이 명령 경로가 사용하는 Gateway RPC 메서드: `secrets.resolve`.

## 감사 및 구성 워크플로

기본 운영자 흐름:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

결과에는 다음이 포함됩니다.

- 저장 시점 일반 텍스트 값(`openclaw.json`, `auth-profiles.json`, `.env`, 생성된 `agents/*/agent/models.json`)
- 생성된 `models.json` 항목에 남아 있는 일반 텍스트 민감 provider 헤더 잔여물
- 해석되지 않은 ref
- 우선순위 shadowing(`openclaw.json` ref보다 `auth-profiles.json`이 우선하는 경우)
- 레거시 잔여물(`auth.json`, OAuth 리마인더)

Exec 참고:

- 기본적으로 audit는 명령 부작용을 피하기 위해 exec SecretRef 해석 가능성 검사를 건너뜁니다.
- 감사 중 exec provider를 실행하려면 `openclaw secrets audit --allow-exec`를 사용하세요.

헤더 잔여물 참고:

- 민감 provider 헤더 감지는 이름 휴리스틱 기반입니다(일반적인 인증/자격 증명 헤더 이름 및 `authorization`, `x-api-key`, `token`, `secret`, `password`, `credential` 같은 조각).

### `secrets configure`

다음을 수행하는 대화형 도우미입니다.

- 먼저 `secrets.providers`를 구성(`env`/`file`/`exec`, 추가/편집/삭제)
- 하나의 에이전트 범위에 대해 `openclaw.json`과 `auth-profiles.json`에서 지원되는 비밀 보유 필드를 선택할 수 있게 함
- 대상 선택기에서 새 `auth-profiles.json` 매핑을 직접 생성할 수 있음
- SecretRef 세부 정보(`source`, `provider`, `id`)를 수집
- 사전 점검 해석 실행
- 즉시 적용 가능

Exec 참고:

- `--allow-exec`가 설정되지 않으면 사전 점검은 exec SecretRef 검사를 건너뜁니다.
- `configure --apply`에서 직접 적용하고 계획에 exec ref/provider가 포함되어 있다면, 적용 단계에도 `--allow-exec`를 계속 설정해 두세요.

유용한 모드:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

`configure` 적용 기본값:

- 대상 provider에 대해 `auth-profiles.json`에서 일치하는 정적 자격 증명을 스크럽
- `auth.json`에서 레거시 정적 `api_key` 항목을 스크럽
- `<config-dir>/.env`에서 일치하는 알려진 비밀 줄을 스크럽

### `secrets apply`

저장된 계획 적용:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Exec 참고:

- dry-run은 `--allow-exec`가 설정되지 않으면 exec 검사를 건너뜁니다.
- write 모드는 `--allow-exec`가 설정되지 않으면 exec SecretRef/provider를 포함하는 계획을 거부합니다.

엄격한 대상/경로 계약 세부 사항과 정확한 거부 규칙은 다음을 참조하세요.

- [Secrets Apply Plan Contract](/ko/gateway/secrets-plan-contract)

## 단방향 안전 정책

OpenClaw는 과거 일반 텍스트 비밀 값을 포함하는 롤백 백업을 의도적으로 기록하지 않습니다.

안전 모델:

- 쓰기 모드 전에 사전 점검이 반드시 성공해야 함
- 커밋 전에 런타임 활성화가 검증됨
- apply는 원자적 파일 교체와 실패 시 best-effort 복원을 사용해 파일을 업데이트함

## 레거시 인증 호환성 참고

정적 자격 증명의 경우 런타임은 더 이상 일반 텍스트 레거시 인증 저장소에 의존하지 않습니다.

- 런타임 자격 증명 소스는 해석된 메모리 내 스냅샷입니다.
- 발견된 레거시 정적 `api_key` 항목은 스크럽됩니다.
- OAuth 관련 호환 동작은 별도로 유지됩니다.

## 웹 UI 참고

일부 SecretInput union은 폼 모드보다 raw editor 모드에서 구성하기 더 쉽습니다.

## 관련 문서

- CLI 명령: [secrets](/ko/cli/secrets)
- 계획 계약 세부 사항: [Secrets Apply Plan Contract](/ko/gateway/secrets-plan-contract)
- 자격 증명 표면: [SecretRef Credential Surface](/ko/reference/secretref-credential-surface)
- 인증 설정: [Authentication](/ko/gateway/authentication)
- 보안 태세: [Security](/ko/gateway/security)
- 환경 우선순위: [Environment Variables](/ko/help/environment)
