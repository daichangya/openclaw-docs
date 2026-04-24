---
read_when:
    - models CLI 추가 또는 수정하기(list/set/scan/aliases/fallbacks)
    - 모델 대체 동작 또는 선택 UX 변경하기
    - 모델 스캔 프로브(tools/images) 업데이트하기
summary: 'Models CLI: 목록, 설정, 별칭, 대체, 스캔, 상태'
title: Models CLI
x-i18n:
    generated_at: "2026-04-24T06:11:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12f784984c87b33e645ec296f7f93ec3acc2a91efa3b63d3a912a6b09b90e048
    source_path: concepts/models.md
    workflow: 15
---

[모델 장애 조치](/ko/concepts/model-failover)에서 인증 프로필
순환, 쿨다운, 그리고 이것이 대체 모델과 어떻게 상호작용하는지 확인하세요.
빠른 provider 개요 + 예시는 [/concepts/model-providers](/ko/concepts/model-providers)를 참조하세요.

## 모델 선택 방식

OpenClaw는 다음 순서로 모델을 선택합니다.

1. **기본** 모델(`agents.defaults.model.primary` 또는 `agents.defaults.model`).
2. `agents.defaults.model.fallbacks`의 **대체 모델**(순서대로).
3. **Provider 인증 장애 조치**는 다음 모델로 이동하기 전에 provider 내부에서 발생합니다.

관련 항목:

- `agents.defaults.models`는 OpenClaw가 사용할 수 있는 모델의 허용 목록/카탈로그입니다(별칭 포함).
- `agents.defaults.imageModel`은 **기본 모델이 이미지를 받을 수 없을 때만** 사용됩니다.
- `agents.defaults.pdfModel`은 `pdf` 도구에서 사용됩니다. 설정하지 않으면 이 도구는
  `agents.defaults.imageModel`, 그다음 확인된 세션/기본
  모델 순서로 대체합니다.
- `agents.defaults.imageGenerationModel`은 공용 이미지 생성 기능에서 사용됩니다. 설정하지 않아도 `image_generate`는 인증 기반 provider 기본값을 추론할 수 있습니다. 현재 기본 provider를 먼저 시도한 뒤, 남은 등록된 이미지 생성 provider를 provider-id 순서로 시도합니다. 특정 provider/model을 설정한다면 해당 provider의 인증/API 키도 함께 구성하세요.
- `agents.defaults.musicGenerationModel`은 공용 음악 생성 기능에서 사용됩니다. 설정하지 않아도 `music_generate`는 인증 기반 provider 기본값을 추론할 수 있습니다. 현재 기본 provider를 먼저 시도한 뒤, 남은 등록된 음악 생성 provider를 provider-id 순서로 시도합니다. 특정 provider/model을 설정한다면 해당 provider의 인증/API 키도 함께 구성하세요.
- `agents.defaults.videoGenerationModel`은 공용 비디오 생성 기능에서 사용됩니다. 설정하지 않아도 `video_generate`는 인증 기반 provider 기본값을 추론할 수 있습니다. 현재 기본 provider를 먼저 시도한 뒤, 남은 등록된 비디오 생성 provider를 provider-id 순서로 시도합니다. 특정 provider/model을 설정한다면 해당 provider의 인증/API 키도 함께 구성하세요.
- 에이전트별 기본값은 `agents.list[].model`과 바인딩을 통해 `agents.defaults.model`을 재정의할 수 있습니다([/concepts/multi-agent](/ko/concepts/multi-agent) 참조).

## 빠른 모델 정책

- 기본 모델은 사용할 수 있는 가장 강력한 최신 세대 모델로 설정하세요.
- 비용/지연 시간에 민감한 작업과 중요도가 낮은 채팅에는 대체 모델을 사용하세요.
- 도구가 활성화된 에이전트나 신뢰할 수 없는 입력의 경우 오래되었거나 약한 모델 계층은 피하세요.

## 온보딩(권장)

설정을 직접 편집하고 싶지 않다면 온보딩을 실행하세요.

```bash
openclaw onboard
```

이 명령은 일반적인 provider에 대한 모델 + 인증 설정을 도와주며, **OpenAI Code (Codex)
구독**(OAuth)과 **Anthropic**(API 키 또는 Claude CLI)도 포함합니다.

## 설정 키(개요)

- `agents.defaults.model.primary` 및 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` 및 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` 및 `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` 및 `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` 및 `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (허용 목록 + 별칭 + provider 매개변수)
- `models.providers` (`models.json`에 기록되는 사용자 정의 provider)

모델 ref는 소문자로 정규화됩니다. `z.ai/*` 같은 provider 별칭은
`zai/*`로 정규화됩니다.

OpenCode를 포함한 provider 구성 예시는
[/providers/opencode](/ko/providers/opencode)에 있습니다.

### 안전한 허용 목록 편집

`agents.defaults.models`를 수동으로 업데이트할 때는 추가 방식 쓰기를 사용하세요.

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set`은 모델/provider 맵이 실수로 덮어써지는 것을 방지합니다.
`agents.defaults.models`, `models.providers`, 또는
`models.providers.<id>.models`에 대한 일반 객체 할당은 기존
항목을 제거하게 될 경우 거부됩니다. 추가 변경에는 `--merge`를 사용하고,
제공한 값이 전체 대상 값이 되어야 할 때만 `--replace`를 사용하세요.

대화형 provider 설정과 `openclaw configure --section model`도
provider 범위 선택을 기존 허용 목록에 병합하므로, Codex,
Ollama 또는 다른 provider를 추가해도 관련 없는 모델 항목이 삭제되지 않습니다.

## "Model is not allowed"가 뜨는 경우(그리고 왜 응답이 멈추는지)

`agents.defaults.models`가 설정되어 있으면, 이것이 `/model`과
세션 재정의에 대한 **허용 목록**이 됩니다. 사용자가 해당 허용 목록에 없는 모델을 선택하면,
OpenClaw는 다음을 반환합니다.

```
Model "provider/model" is not allowed. Use /model to list available models.
```

이 동작은 일반 응답이 생성되기 **전**에 발생하므로 메시지에
“응답하지 않은 것처럼” 느껴질 수 있습니다. 해결 방법은 다음 중 하나입니다.

- 모델을 `agents.defaults.models`에 추가하거나
- 허용 목록을 비우거나(`agents.defaults.models` 제거)
- `/model list`에서 모델을 선택합니다

허용 목록 설정 예시:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## 채팅에서 모델 전환하기(`/model`)

재시작 없이 현재 세션의 모델을 전환할 수 있습니다.

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

참고:

- `/model`(및 `/model list`)은 간결한 번호 기반 선택기입니다(모델 패밀리 + 사용 가능한 provider).
- Discord에서는 `/model`과 `/models`가 provider 및 모델 드롭다운과 Submit 단계를 갖춘 대화형 선택기를 엽니다.
- `/models add`는 기본적으로 사용할 수 있으며 `commands.modelsWrite=false`로 비활성화할 수 있습니다.
- 활성화된 경우 `/models add <provider> <modelId>`가 가장 빠른 경로이며, 접두사 없는 `/models add`는 지원되는 경우 provider 우선 안내 흐름을 시작합니다.
- `/models add` 이후 새 모델은 gateway 재시작 없이 `/models`와 `/model`에서 사용할 수 있습니다.
- `/model <#>`은 해당 선택기에서 모델을 선택합니다.
- `/model`은 새 세션 선택을 즉시 저장합니다.
- 에이전트가 유휴 상태라면 다음 실행에서 바로 새 모델을 사용합니다.
- 이미 실행이 진행 중이라면 OpenClaw는 라이브 전환을 보류 상태로 표시하고, 깔끔한 재시도 시점에서만 새 모델로 재시작합니다.
- 도구 활동이나 응답 출력이 이미 시작되었다면 보류 중인 전환은 이후 재시도 기회나 다음 사용자 턴까지 대기할 수 있습니다.
- `/model status`는 상세 보기입니다(인증 후보 및, 설정된 경우, provider 엔드포인트 `baseUrl` + `api` 모드).
- 모델 ref는 **첫 번째** `/`에서 분할하여 파싱됩니다. `/model <ref>`를 입력할 때는 `provider/model` 형식을 사용하세요.
- 모델 ID 자체에 `/`가 포함된 경우(OpenRouter 스타일) provider 접두사를 반드시 포함해야 합니다(예: `/model openrouter/moonshotai/kimi-k2`).
- provider를 생략하면 OpenClaw는 입력을 다음 순서로 확인합니다.
  1. 별칭 일치
  2. 해당 접두사 없는 정확한 모델 id에 대한 고유한 구성된 provider 일치
  3. 구성된 기본 provider로의 deprecated 대체
     해당 provider가 더 이상 구성된 기본 모델을 제공하지 않으면 OpenClaw는
     오래된 제거된 provider 기본값을 노출하지 않도록 대신 첫 번째 구성된 provider/model으로 대체합니다.

전체 명령 동작/설정: [Slash commands](/ko/tools/slash-commands).

예시:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

## CLI 명령어

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models`(하위 명령어 없음)는 `models status`의 바로가기입니다.

### `models list`

기본적으로 구성된 모델을 표시합니다. 유용한 플래그:

- `--all`: 전체 카탈로그
- `--local`: 로컬 provider만
- `--provider <id>`: provider id로 필터링(예: `moonshot`), 대화형 선택기의 표시
  레이블은 허용되지 않음
- `--plain`: 줄당 모델 하나
- `--json`: 기계가 읽을 수 있는 출력

`--all`은 인증이 구성되기 전에도 번들된 provider 소유 정적 카탈로그 행을 포함하므로,
검색 전용 보기에서는 일치하는 provider 자격 증명을 추가하기 전까지 사용할 수 없는 모델도 표시할 수 있습니다.

### `models status`

확인된 기본 모델, 대체 모델, 이미지 모델, 그리고 구성된 provider의 인증 개요를
표시합니다. 또한 인증 저장소에서 발견된 프로필의 OAuth 만료 상태도 표시합니다
(기본적으로 24시간 이내 만료 시 경고). `--plain`은 확인된
기본 모델만 출력합니다.
OAuth 상태는 항상 표시되며(`--json` 출력에도 포함됨), 구성된
provider에 자격 증명이 없으면 `models status`는 **Missing auth** 섹션을 출력합니다.
JSON에는 `auth.oauth`(경고 창 + 프로필)와 `auth.providers`
(provider별 유효 인증, env 기반 자격 증명 포함)가 포함됩니다. `auth.oauth`는
인증 저장소 프로필 상태만 의미하며, env 전용 provider는 여기에 나타나지 않습니다.
자동화에는 `--check`를 사용하세요(누락/만료 시 종료 코드 `1`, 곧 만료 시 `2`).
라이브 인증 확인에는 `--probe`를 사용하세요. probe 행은 인증 프로필, env
자격 증명 또는 `models.json`에서 올 수 있습니다.
명시적 `auth.order.<provider>`가 저장된 프로필을 생략하면 probe는 이를 시도하는 대신
`excluded_by_auth_order`를 보고합니다. 인증은 있지만 해당 provider에 대해 probe 가능한
모델을 확인할 수 없으면 probe는 `status: no_model`을 보고합니다.

인증 선택은 provider/계정에 따라 달라집니다. 항상 켜져 있는 Gateway 호스트에서는 API
키가 일반적으로 가장 예측 가능하며, Claude CLI 재사용 및 기존 Anthropic
OAuth/토큰 프로필도 지원됩니다.

예시(Claude CLI):

```bash
claude auth login
openclaw models status
```

## 스캔(OpenRouter 무료 모델)

`openclaw models scan`은 OpenRouter의 **무료 모델 카탈로그**를 검사하고,
선택적으로 모델의 도구 및 이미지 지원 여부를 probe할 수 있습니다.

주요 플래그:

- `--no-probe`: 라이브 probe 건너뛰기(메타데이터만)
- `--min-params <b>`: 최소 매개변수 크기(십억 단위)
- `--max-age-days <days>`: 오래된 모델 건너뛰기
- `--provider <name>`: provider 접두사 필터
- `--max-candidates <n>`: 대체 목록 크기
- `--set-default`: 첫 번째 선택 항목을 `agents.defaults.model.primary`로 설정
- `--set-image`: 첫 번째 이미지 선택 항목을 `agents.defaults.imageModel.primary`로 설정

Probing에는 OpenRouter API 키(인증 프로필 또는
`OPENROUTER_API_KEY`에서 제공)가 필요합니다. 키가 없으면 `--no-probe`를 사용해 후보만 나열하세요.

스캔 결과는 다음 기준으로 순위가 매겨집니다.

1. 이미지 지원
2. 도구 지연 시간
3. 컨텍스트 크기
4. 매개변수 수

입력

- OpenRouter `/models` 목록(`:free` 필터)
- 인증 프로필 또는 `OPENROUTER_API_KEY`의 OpenRouter API 키 필요([/environment](/ko/help/environment) 참조)
- 선택적 필터: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- probe 제어: `--timeout`, `--concurrency`

TTY에서 실행하면 대체 모델을 대화형으로 선택할 수 있습니다. 비대화형
모드에서는 기본값을 수락하려면 `--yes`를 전달하세요.

## 모델 레지스트리(`models.json`)

`models.providers`의 사용자 정의 provider는 에이전트 디렉터리 아래의
`models.json`(기본값 `~/.openclaw/agents/<agentId>/agent/models.json`)에 기록됩니다. 이 파일은
`models.mode`가 `replace`로 설정되지 않은 한 기본적으로 병합됩니다.

일치하는 provider ID에 대한 병합 모드 우선순위:

- 에이전트 `models.json`에 이미 존재하는 비어 있지 않은 `baseUrl`이 우선합니다.
- 에이전트 `models.json`의 비어 있지 않은 `apiKey`는 현재 설정/인증 프로필 컨텍스트에서 해당 provider가 SecretRef로 관리되지 않는 경우에만 우선합니다.
- SecretRef로 관리되는 provider `apiKey` 값은 확인된 비밀을 저장하는 대신 소스 마커(`ENV_VAR_NAME`은 env ref용, `secretref-managed`는 file/exec ref용)에서 새로 고쳐집니다.
- SecretRef로 관리되는 provider 헤더 값은 소스 마커(`secretref-env:ENV_VAR_NAME`은 env ref용, `secretref-managed`는 file/exec ref용)에서 새로 고쳐집니다.
- 비어 있거나 누락된 에이전트 `apiKey`/`baseUrl`은 설정의 `models.providers`로 대체됩니다.
- 다른 provider 필드는 설정과 정규화된 카탈로그 데이터에서 새로 고쳐집니다.

마커 저장은 소스 권위적입니다. OpenClaw는 확인된 런타임 비밀 값이 아니라 활성 소스 설정 스냅샷(확인 전)에서 마커를 기록합니다.
이는 `openclaw agent` 같은 명령 기반 경로를 포함해 OpenClaw가 `models.json`을 다시 생성할 때마다 적용됩니다.

## 관련 항목

- [Model Providers](/ko/concepts/model-providers) — provider 라우팅 및 인증
- [Model Failover](/ko/concepts/model-failover) — 대체 체인
- [Image Generation](/ko/tools/image-generation) — 이미지 모델 설정
- [Music Generation](/ko/tools/music-generation) — 음악 모델 설정
- [Video Generation](/ko/tools/video-generation) — 비디오 모델 설정
- [Configuration Reference](/ko/gateway/config-agents#agent-defaults) — 모델 설정 키
