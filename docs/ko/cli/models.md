---
read_when:
    - 기본 모델을 변경하거나 provider 인증 상태를 보려고 합니다
    - 사용 가능한 모델/provider를 스캔하고 인증 프로필을 디버그하려고 합니다
summary: '`openclaw models`에 대한 CLI 참조(status/list/set/scan, aliases, fallbacks, auth)'
title: 모델
x-i18n:
    generated_at: "2026-04-25T12:24:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c8040159e23789221357dd60232012759ee540ebfd3e5d192a0a09419d40c9a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

모델 검색, 스캔 및 구성(기본 모델, fallback, 인증 프로필).

관련 항목:

- provider + 모델: [모델](/ko/providers/models)
- 모델 선택 개념 + `/models` 슬래시 명령: [모델 개념](/ko/concepts/models)
- provider 인증 설정: [시작하기](/ko/start/getting-started)

## 일반 명령어

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status`는 확인된 기본값/fallback과 인증 개요를 표시합니다.
provider 사용량 스냅샷을 사용할 수 있는 경우 OAuth/API 키 상태 섹션에는
provider 사용량 윈도우와 할당량 스냅샷이 포함됩니다.
현재 사용량 윈도우를 지원하는 provider: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi, z.ai. 사용량 인증은 가능한 경우 provider별 훅에서 가져오며,
그렇지 않으면 OpenClaw는 인증 프로필, env 또는 config의 일치하는 OAuth/API 키
자격 증명으로 fallback합니다.
`--json` 출력에서 `auth.providers`는 env/config/store를 인식하는 provider
개요이고, `auth.oauth`는 인증 저장소의 프로필 상태만 나타냅니다.
`--probe`를 추가하면 구성된 각 provider 프로필에 대해 라이브 인증 프로브를 실행합니다.
프로브는 실제 요청이므로(토큰을 소비하고 속도 제한을 유발할 수 있음).
`--agent <id>`를 사용하면 구성된 에이전트의 모델/인증 상태를 검사할 수 있습니다. 생략하면
이 명령은 설정된 경우 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`을 사용하고, 그렇지 않으면
구성된 기본 에이전트를 사용합니다.
프로브 행은 인증 프로필, env 자격 증명 또는 `models.json`에서 올 수 있습니다.

참고:

- `models set <model-or-alias>`는 `provider/model` 또는 alias를 허용합니다.
- `models list`는 읽기 전용입니다. config, 인증 프로필, 기존 카탈로그
  상태 및 provider 소유 카탈로그 행을 읽지만 `models.json`을
  다시 쓰지는 않습니다.
- `models list --all`은 아직 해당 provider로 인증하지 않았더라도 번들된 provider 소유 정적 카탈로그 행을
  포함합니다. 해당 행은 일치하는 인증이 구성될 때까지 여전히 사용할 수 없음으로 표시됩니다.
- `models list`는 기본 모델 메타데이터와 런타임 cap을 구분해서 유지합니다. 테이블
  출력에서 유효한 런타임 cap이 기본 컨텍스트 윈도우와 다를 경우 `Ctx`는 `contextTokens/contextWindow`를
  표시합니다. JSON 행에는 provider가 해당 cap을 노출할 때 `contextTokens`가 포함됩니다.
- `models list --provider <id>`는 `moonshot` 또는
  `openai-codex` 같은 provider id로 필터링합니다. `Moonshot AI` 같은 대화형 provider
  선택기의 표시 레이블은 허용하지 않습니다.
- 모델 ref는 **첫 번째** `/`를 기준으로 분할하여 파싱됩니다. 모델 ID에 `/`가 포함되는 경우(OpenRouter 스타일),
  provider 접두사를 포함하세요(예: `openrouter/moonshotai/kimi-k2`).
- provider를 생략하면 OpenClaw는 먼저 입력을 alias로 확인한 다음,
  정확한 모델 id에 대한 고유한 configured-provider 일치 항목으로 확인하고, 그 후에야
  지원 중단 경고와 함께 구성된 기본 provider로 fallback합니다.
  해당 provider가 더 이상 구성된 기본 모델을 노출하지 않으면 OpenClaw는
  오래된 제거된 provider 기본값을 표시하는 대신 첫 번째 구성된 provider/모델로 fallback합니다.
- `models status`는 인증 출력에서 비밀이 아닌 플레이스홀더에 대해 비밀로 마스킹하는 대신 `marker(<value>)`를
  표시할 수 있습니다(예: `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`).

### `models scan`

`models scan`은 OpenRouter의 공개 `:free` 카탈로그를 읽고 fallback 용도로
후보를 순위화합니다. 카탈로그 자체는 공개이므로 메타데이터 전용 스캔에는 OpenRouter 키가 필요하지 않습니다.

기본적으로 OpenClaw는 라이브 모델 호출로 도구 및 이미지 지원을 프로브하려고 시도합니다.
OpenRouter 키가 구성되어 있지 않으면 이 명령은 메타데이터 전용 출력으로 fallback하고,
프로브와 추론에는 `:free` 모델에도 여전히 `OPENROUTER_API_KEY`가 필요하다고 설명합니다.

옵션:

- `--no-probe` (메타데이터만; config/secret 조회 없음)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (카탈로그 요청 및 프로브별 타임아웃)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` 및 `--set-image`는 라이브 프로브가 필요합니다. 메타데이터 전용 스캔
결과는 정보 제공용이며 config에 적용되지 않습니다.

### `models status`

옵션:

- `--json`
- `--plain`
- `--check` (종료 1=만료/누락, 2=곧 만료)
- `--probe` (구성된 인증 프로필의 라이브 프로브)
- `--probe-provider <name>` (하나의 provider 프로브)
- `--probe-profile <id>` (반복 또는 쉼표로 구분된 프로필 id)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (구성된 에이전트 id, `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` 재정의)

프로브 상태 버킷:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

예상할 수 있는 프로브 세부 정보/이유 코드 사례:

- `excluded_by_auth_order`: 저장된 프로필이 있지만 명시적
  `auth.order.<provider>`에서 이를 생략했으므로 프로브는 시도하는 대신
  제외를 보고합니다.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  프로필은 존재하지만 적격하지 않거나 확인할 수 없습니다.
- `no_model`: provider 인증은 존재하지만 OpenClaw가 해당 provider에 대해
  프로브 가능한 모델 후보를 확인할 수 없었습니다.

## alias + fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 인증 프로필

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add`는 대화형 인증 도우미입니다. 선택한 provider에 따라
provider 인증 흐름(OAuth/API 키)을 시작하거나 수동 토큰 붙여넣기를 안내할 수 있습니다.

`models auth login`은 provider Plugin의 인증 흐름(OAuth/API 키)을 실행합니다.
설치된 provider를 보려면 `openclaw plugins list`를 사용하세요.

예시:

```bash
openclaw models auth login --provider openai-codex --set-default
```

참고:

- `setup-token` 및 `paste-token`은 토큰 인증 메서드를 노출하는 provider를 위한
  일반 토큰 명령으로 유지됩니다.
- `setup-token`은 대화형 TTY가 필요하며 provider의 토큰 인증
  메서드를 실행합니다(해당 provider가 이를 노출하는 경우 기본적으로 `setup-token`
  메서드 사용).
- `paste-token`은 다른 곳이나 자동화에서 생성된 토큰 문자열을 허용합니다.
- `paste-token`은 `--provider`가 필요하고, 토큰 값을 묻고,
  `--profile-id`를 전달하지 않으면 기본 프로필 id `<provider>:manual`에 기록합니다.
- `paste-token --expires-in <duration>`은 `365d` 또는 `12h` 같은
  상대 기간으로부터 절대 토큰 만료 시간을 저장합니다.
- Anthropic 참고: Anthropic 직원이 OpenClaw 스타일 Claude CLI 사용이 다시 허용된다고 알려왔으므로, Anthropic이 새로운 정책을 게시하지 않는 한 OpenClaw는 이 통합에 대해 Claude CLI 재사용과 `claude -p` 사용을 허용된 것으로 취급합니다.
- Anthropic `setup-token` / `paste-token`은 지원되는 OpenClaw 토큰 경로로 계속 제공되지만, OpenClaw는 이제 가능한 경우 Claude CLI 재사용과 `claude -p`를 선호합니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [모델 선택](/ko/concepts/model-providers)
- [모델 장애 조치](/ko/concepts/model-failover)
