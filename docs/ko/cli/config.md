---
read_when:
    - 비대화형으로 config를 읽거나 편집하려는 것입니다.
summary: '`openclaw config`에 대한 CLI 참조(`get`/`set`/`unset`/`file`/`schema`/`validate`)'
title: Config
x-i18n:
    generated_at: "2026-04-24T06:07:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15e2eb75cc415df52ddcd104d8e5295d8d7b84baca65b4368deb3f06259f6bcd
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

`openclaw.json`을 비대화형으로 편집하기 위한 config 헬퍼입니다. 경로 기준으로 값을 `get`/`set`/`unset`/`file`/`schema`/`validate`하고, 현재 활성 config 파일을 출력합니다. 하위 명령 없이 실행하면 구성 마법사(`openclaw configure`와 동일)를 엽니다.

루트 옵션:

- `--section <section>`: `openclaw config`를 하위 명령 없이 실행할 때 반복 가능한 안내형 설정 섹션 필터

지원되는 안내형 섹션:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## 예시

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

`openclaw.json`용 생성된 JSON schema를 JSON 형식으로 stdout에 출력합니다.

포함 내용:

- 현재 루트 config schema와 편집기 도구용 루트 `$schema` 문자열 필드
- Control UI가 사용하는 필드 `title` 및 `description` 문서 메타데이터
- 중첩 객체, 와일드카드(`*`), 배열 항목(`[]`) 노드는 일치하는 필드 문서가 있으면 동일한 `title` / `description` 메타데이터를 상속합니다
- `anyOf` / `oneOf` / `allOf` 분기도 일치하는 필드 문서가 있으면 동일한 문서 메타데이터를 상속합니다
- 런타임 manifest를 로드할 수 있을 때의 최선 노력 기반 live Plugin + channel schema 메타데이터
- 현재 config가 유효하지 않아도 깨끗한 fallback schema

관련 런타임 RPC:

- `config.schema.lookup`은 정규화된 하나의 config 경로와 얕은 schema 노드(`title`, `description`, `type`, `enum`, `const`, 일반적인 경계값), 일치하는 UI 힌트 메타데이터, 즉시 하위 항목 요약을 반환합니다. Control UI나 사용자 지정 클라이언트에서 경로 범위 drill-down에 사용하세요.

```bash
openclaw config schema
```

다른 도구로 검사하거나 검증하려면 파일로 파이프하세요.

```bash
openclaw config schema > openclaw.schema.json
```

### 경로

경로는 점 표기법 또는 대괄호 표기법을 사용합니다.

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

특정 에이전트를 지정하려면 에이전트 목록 인덱스를 사용하세요.

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## 값

값은 가능하면 JSON5로 파싱되고, 그렇지 않으면 문자열로 처리됩니다.
JSON5 파싱을 강제하려면 `--strict-json`을 사용하세요. `--json`도 레거시 별칭으로 계속 지원됩니다.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json`은 터미널용 형식화된 텍스트 대신 원시 값을 JSON으로 출력합니다.

객체 할당은 기본적으로 대상 경로를 대체합니다. `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries`, `auth.profiles`처럼 사용자가 추가한 항목을 자주 담는 보호된 map/list 경로는 `--replace`를 지정하지 않으면 기존 항목을 제거하는 대체를 거부합니다.

이러한 map에 항목을 추가할 때는 `--merge`를 사용하세요.

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

제공한 값이 전체 대상 값이 되어야 할 때만 `--replace`를 사용하세요.

## `config set` 모드

`openclaw config set`은 네 가지 할당 스타일을 지원합니다.

1. 값 모드: `openclaw config set <path> <value>`
2. SecretRef 빌더 모드:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Provider 빌더 모드(`secrets.providers.<alias>` 경로에서만):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. 배치 모드(`--batch-json` 또는 `--batch-file`):

```bash
openclaw config set --batch-json '[
  {
    "path": "secrets.providers.default",
    "provider": { "source": "env" }
  },
  {
    "path": "channels.discord.token",
    "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
  }
]'
```

```bash
openclaw config set --batch-file ./config-set.batch.json --dry-run
```

정책 참고:

- SecretRef 할당은 지원되지 않는 런타임 변경 가능 표면에서는 거부됩니다(예: `hooks.token`, `commands.ownerDisplaySecret`, Discord 스레드 바인딩 Webhook 토큰, WhatsApp creds JSON). [SecretRef Credential Surface](/ko/reference/secretref-credential-surface)를 참고하세요.

배치 파싱은 항상 배치 payload(`--batch-json`/`--batch-file`)를 기준값으로 사용합니다.
`--strict-json` / `--json`은 배치 파싱 동작을 바꾸지 않습니다.

JSON 경로/값 모드는 SecretRef와 provider 모두에 대해 계속 지원됩니다.

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Provider 빌더 플래그

Provider 빌더 대상은 경로로 `secrets.providers.<alias>`를 사용해야 합니다.

공통 플래그:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Env provider (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (반복 가능)

File provider (`--provider-source file`):

- `--provider-path <path>` (필수)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Exec provider (`--provider-source exec`):

- `--provider-command <path>` (필수)
- `--provider-arg <arg>` (반복 가능)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (반복 가능)
- `--provider-pass-env <ENV_VAR>` (반복 가능)
- `--provider-trusted-dir <path>` (반복 가능)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

강화된 exec provider 예시:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## 드라이런

`openclaw.json`에 쓰지 않고 변경 사항을 검증하려면 `--dry-run`을 사용하세요.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

드라이런 동작:

- 빌더 모드: 변경된 ref/provider에 대해 SecretRef 확인 가능성 검사를 실행합니다.
- JSON 모드(`--strict-json`, `--json`, 또는 배치 모드): schema 검증과 SecretRef 확인 가능성 검사를 실행합니다.
- 알려진 미지원 SecretRef 대상 표면에 대한 정책 검증도 실행됩니다.
- 정책 검사는 변경 후 전체 config를 기준으로 평가하므로, 상위 객체 쓰기(예: `hooks`를 객체로 설정)가 미지원 표면 검증을 우회할 수 없습니다.
- exec SecretRef 검사는 기본적으로 드라이런 중 건너뜁니다. 명령 부작용을 피하기 위해서입니다.
- exec SecretRef 검사를 명시적으로 허용하려면 `--dry-run`과 함께 `--allow-exec`를 사용하세요(이 경우 provider 명령이 실행될 수 있음).
- `--allow-exec`는 드라이런 전용이며 `--dry-run` 없이 사용하면 오류가 납니다.

`--dry-run --json`은 기계 판독 가능한 보고서를 출력합니다.

- `ok`: 드라이런 통과 여부
- `operations`: 평가된 할당 수
- `checks`: schema/확인 가능성 검사가 실행되었는지 여부
- `checks.resolvabilityComplete`: 확인 가능성 검사가 끝까지 실행되었는지 여부(exec ref를 건너뛰면 false)
- `refsChecked`: 드라이런 중 실제로 해석된 ref 수
- `skippedExecRefs`: `--allow-exec`가 설정되지 않아 건너뛴 exec ref 수
- `errors`: `ok=false`일 때의 구조화된 schema/확인 가능성 실패

### JSON 출력 형태

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // 확인 가능성 오류에 있을 때만 포함
    },
  ],
}
```

성공 예시:

```json
{
  "ok": true,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0
}
```

실패 예시:

```json
{
  "ok": false,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0,
  "errors": [
    {
      "kind": "resolvability",
      "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
      "ref": "env:default:MISSING_TEST_SECRET"
    }
  ]
}
```

드라이런이 실패하면:

- `config schema validation failed`: 변경 후 config 형태가 유효하지 않습니다. 경로/값 또는 provider/ref 객체 형태를 수정하세요.
- `Config policy validation failed: unsupported SecretRef usage`: 해당 자격 증명을 일반 텍스트/문자열 입력으로 되돌리고 SecretRef는 지원되는 표면에서만 사용하세요.
- `SecretRef assignment(s) could not be resolved`: 참조된 provider/ref가 현재 해석되지 않습니다(누락된 env var, 잘못된 파일 포인터, exec provider 실패 또는 provider/source 불일치).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: 드라이런이 exec ref를 건너뛰었습니다. exec 확인 가능성 검증이 필요하면 `--allow-exec`와 함께 다시 실행하세요.
- 배치 모드에서는 실패한 항목을 수정한 뒤 쓰기 전에 `--dry-run`을 다시 실행하세요.

## 쓰기 안전성

`openclaw config set` 및 다른 OpenClaw 소유 config 작성기는 디스크에 반영하기 전에 변경 후 전체 config를 검증합니다. 새 payload가 schema 검증에 실패하거나 파괴적인 덮어쓰기로 보이면 활성 config는 그대로 유지되고, 거부된 payload는 그 옆에 `openclaw.json.rejected.*`로 저장됩니다.
활성 config 경로는 일반 파일이어야 합니다. 심볼릭 링크된 `openclaw.json` 레이아웃은 쓰기에서 지원되지 않습니다. 대신 `OPENCLAW_CONFIG_PATH`로 실제 파일을 직접 가리키세요.

작은 수정에는 CLI 쓰기를 권장합니다.

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

쓰기 거부가 발생하면 저장된 payload를 검사하고 전체 config 형태를 수정하세요.

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

직접 편집기로 쓰는 방식도 여전히 허용되지만, 실행 중인 Gateway는 해당 변경이 검증되기 전까지 신뢰하지 않습니다. 유효하지 않은 직접 편집은 시작 시 또는 hot reload 중 마지막으로 정상 동작하던 백업에서 복원될 수 있습니다. [Gateway troubleshooting](/ko/gateway/troubleshooting#gateway-restored-last-known-good-config)을 참고하세요.

## 하위 명령

- `config file`: 활성 config 파일 경로를 출력합니다(`OPENCLAW_CONFIG_PATH` 또는 기본 위치에서 해석됨). 이 경로는 심볼릭 링크가 아닌 일반 파일을 가리켜야 합니다.

편집 후 gateway를 재시작하세요.

## Validate

gateway를 시작하지 않고 현재 config를 활성 schema에 대해 검증합니다.

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate`가 통과하면 로컬 TUI를 사용해 내장 에이전트가 활성 config를 문서와 비교하도록 하면서, 같은 터미널에서 각 변경 사항을 검증할 수 있습니다.

검증이 이미 실패하고 있다면 `openclaw configure` 또는 `openclaw doctor --fix`부터 시작하세요. `openclaw chat`은 유효하지 않은 config 가드를 우회하지 않습니다.

```bash
openclaw chat
```

그다음 TUI 내부에서:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

일반적인 복구 루프:

- 에이전트에게 현재 config를 관련 문서 페이지와 비교하고 가장 작은 수정안을 제안하도록 요청합니다.
- `openclaw config set` 또는 `openclaw configure`로 필요한 부분만 수정합니다.
- 각 변경 후 `openclaw config validate`를 다시 실행합니다.
- 검증은 통과했지만 런타임이 여전히 비정상이라면 마이그레이션 및 복구 도움을 위해 `openclaw doctor` 또는 `openclaw doctor --fix`를 실행합니다.

## 관련

- [CLI reference](/ko/cli)
- [Configuration](/ko/gateway/configuration)
