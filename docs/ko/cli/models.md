---
read_when:
    - 기본 모델을 변경하거나 provider 인증 상태를 확인하려는 것입니다.
    - 사용 가능한 모델/provider를 스캔하고 인증 프로필을 디버그하려는 것입니다.
summary: '`openclaw models`에 대한 CLI 참조(`status`/`list`/`set`/`scan`, 별칭, fallback, 인증)'
title: Models
x-i18n:
    generated_at: "2026-04-24T06:08:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08e04342ef240bf7a1f60c4d4e2667d17c9a97e985c1b170db8538c890dc8119
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

모델 검색, 스캔 및 구성(기본 모델, fallback, 인증 프로필).

관련 항목:

- Provider + 모델: [Models](/ko/providers/models)
- 모델 선택 개념 + `/models` 슬래시 명령: [Models concept](/ko/concepts/models)
- Provider 인증 설정: [Getting started](/ko/start/getting-started)

## 일반 명령

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status`는 해석된 기본값/fallback과 인증 개요를 표시합니다.
provider 사용량 스냅샷을 사용할 수 있으면 OAuth/API 키 상태 섹션에
provider 사용량 윈도우와 quota 스냅샷이 포함됩니다.
현재 사용량 윈도우 provider: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi, z.ai. 사용량 인증은 가능할 때 provider별 훅에서
가져오며, 그렇지 않으면 OpenClaw는 auth 프로필, env 또는 config의
일치하는 OAuth/API 키 자격 증명으로 fallback합니다.
`--json` 출력에서 `auth.providers`는 env/config/store를 인식하는 provider
개요이고, `auth.oauth`는 auth-store 프로필 상태만 나타냅니다.
각 구성된 provider 프로필에 대해 실제 인증 probe를 실행하려면 `--probe`를 추가하세요.
probe는 실제 요청입니다(토큰을 소비하거나 속도 제한을 유발할 수 있음).
구성된 에이전트의 모델/인증 상태를 검사하려면 `--agent <id>`를 사용하세요. 생략하면
이 명령은 설정된 경우 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`을 사용하고,
그렇지 않으면 구성된 기본 에이전트를 사용합니다.
probe 행은 auth 프로필, env 자격 증명 또는 `models.json`에서 올 수 있습니다.

참고:

- `models set <model-or-alias>`는 `provider/model` 또는 별칭을 받습니다.
- `models list`는 읽기 전용입니다. config, auth 프로필, 기존 카탈로그
  상태 및 provider 소유 카탈로그 행을 읽지만 `models.json`을 다시
  쓰지는 않습니다.
- `models list --all`은 아직 해당 provider에 인증하지 않았더라도 번들된
  provider 소유 정적 카탈로그 행을 포함합니다. 해당 행은 일치하는 인증이
  구성될 때까지 여전히 사용 불가로 표시됩니다.
- `models list --provider <id>`는 `moonshot` 또는 `openai-codex` 같은 provider id로 필터링합니다. `Moonshot AI` 같은 대화형 provider 선택기의 표시 레이블은 받지 않습니다.
- 모델 ref는 **첫 번째** `/`를 기준으로 분할하여 파싱합니다. 모델 ID에 `/`가 포함되어 있으면(OpenRouter 스타일) provider 접두사를 포함하세요(예: `openrouter/moonshotai/kimi-k2`).
- provider를 생략하면 OpenClaw는 먼저 입력을 별칭으로 해석하고, 그다음
  해당 정확한 모델 id에 대한 고유한 configured-provider 일치 항목으로
  해석하며, 마지막으로만 사용 중단 경고와 함께 구성된 기본 provider로
  fallback합니다. 해당 provider가 더 이상 구성된 기본 모델을 제공하지 않으면,
  오래된 제거된-provider 기본값을 표시하는 대신 첫 번째 구성된
  provider/model로 fallback합니다.
- `models status`는 비밀이 아닌 플레이스홀더(예: `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`)를 비밀처럼 마스킹하는 대신 인증 출력에 `marker(<value>)`로 표시할 수 있습니다.

### `models status`

옵션:

- `--json`
- `--plain`
- `--check` (종료 코드 1=만료됨/누락됨, 2=곧 만료됨)
- `--probe` (구성된 auth 프로필의 실제 probe)
- `--probe-provider <name>` (하나의 provider probe)
- `--probe-profile <id>` (반복 가능 또는 쉼표 구분 profile id)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (구성된 에이전트 id; `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`보다 우선)

probe 상태 버킷:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

예상 가능한 probe 세부 정보/이유 코드 사례:

- `excluded_by_auth_order`: 저장된 프로필은 존재하지만 명시적인
  `auth.order.<provider>`가 이를 생략했으므로, probe는 이를 시도하는 대신
  제외 사실을 보고합니다.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  프로필은 존재하지만 적격하지 않거나 해석할 수 없습니다.
- `no_model`: provider 인증은 존재하지만 OpenClaw가 해당 provider에 대해
  probe 가능한 모델 후보를 해석할 수 없었습니다.

## 별칭 + fallback

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

`models auth add`는 대화형 인증 헬퍼입니다. 선택한 provider에 따라
provider 인증 흐름(OAuth/API 키)을 시작하거나 수동 토큰 붙여넣기로
안내할 수 있습니다.

`models auth login`은 provider Plugin의 인증 흐름(OAuth/API 키)을 실행합니다.
설치된 provider를 확인하려면 `openclaw plugins list`를 사용하세요.

예시:

```bash
openclaw models auth login --provider openai-codex --set-default
```

참고:

- `setup-token`과 `paste-token`은 토큰 인증 방식을 제공하는 provider를 위한 일반 토큰 명령으로 계속 유지됩니다.
- `setup-token`은 대화형 TTY가 필요하며, provider의 토큰 인증 방식을 실행합니다(해당 provider가 이를 제공하면 기본적으로 그 provider의 `setup-token` 방식을 사용).
- `paste-token`은 다른 곳이나 자동화에서 생성된 토큰 문자열을 받습니다.
- `paste-token`은 `--provider`가 필요하고, 토큰 값을 입력하라는 프롬프트를 표시하며, `--profile-id`를 지정하지 않으면 기본 프로필 id `<provider>:manual`에 기록합니다.
- `paste-token --expires-in <duration>`은 `365d` 또는 `12h` 같은 상대 기간으로부터 절대 토큰 만료 시각을 저장합니다.
- Anthropic 참고: Anthropic 직원이 OpenClaw 스타일 Claude CLI 사용이 다시 허용된다고 알려왔으므로, Anthropic이 새 정책을 게시하지 않는 한 OpenClaw는 이 통합에 대해 Claude CLI 재사용과 `claude -p` 사용을 허용된 방식으로 취급합니다.
- Anthropic `setup-token` / `paste-token`도 지원되는 OpenClaw 토큰 경로로 계속 제공되지만, 이제 OpenClaw는 가능할 때 Claude CLI 재사용과 `claude -p`를 우선합니다.

## 관련

- [CLI reference](/ko/cli)
- [Model selection](/ko/concepts/model-providers)
- [Model failover](/ko/concepts/model-failover)
