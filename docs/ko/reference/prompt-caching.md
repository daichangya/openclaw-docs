---
read_when:
    - 캐시 유지로 프롬프트 토큰 비용을 줄이려고 합니다
    - 멀티 에이전트 설정에서 에이전트별 캐시 동작이 필요합니다
    - Heartbeat와 cache-ttl pruning을 함께 조정하고 있습니다
summary: 프롬프트 캐싱 설정 항목, 병합 순서, provider 동작, 튜닝 패턴
title: 프롬프트 캐싱
x-i18n:
    generated_at: "2026-04-24T06:34:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534a5648db39dae0979bd8b84263f83332fbaa2dc2c0675409c307fa991c7c8
    source_path: reference/prompt-caching.md
    workflow: 15
---

프롬프트 캐싱은 모델 provider가 매 턴마다 변경되지 않은 프롬프트 접두사(보통 system/developer 지침 및 기타 안정적인 컨텍스트)를 다시 처리하지 않고 재사용할 수 있게 해줍니다. OpenClaw는 업스트림 API가 이러한 카운터를 직접 노출할 때 provider 사용량을 `cacheRead` 및 `cacheWrite`로 정규화합니다.

상태 표면은 라이브 세션 스냅샷에 캐시 카운터가 없을 때 가장 최근 transcript
usage 로그에서 해당 카운터를 복구할 수도 있으므로, `/status`는 부분적인 세션 메타데이터 손실 후에도 캐시 줄을 계속 표시할 수 있습니다. 기존의 0이 아닌 라이브 캐시 값은 여전히 transcript 폴백 값보다 우선합니다.

이것이 중요한 이유: 토큰 비용 절감, 더 빠른 응답, 장시간 실행 세션에서의 더 예측 가능한 성능. 캐싱이 없으면 대부분의 입력이 바뀌지 않았더라도 반복되는 프롬프트는 매 턴 전체 프롬프트 비용을 지불하게 됩니다.

이 페이지는 프롬프트 재사용과 토큰 비용에 영향을 주는 모든 캐시 관련 설정 항목을 다룹니다.

Provider 참조:

- Anthropic 프롬프트 캐싱: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI 프롬프트 캐싱: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API 헤더 및 요청 ID: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic 요청 ID 및 오류: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## 주요 설정 항목

### `cacheRetention`(전역 기본값, 모델별, 에이전트별)

모든 모델에 대한 전역 기본값으로 캐시 보존을 설정합니다.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

모델별 재정의:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

에이전트별 재정의:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

config 병합 순서:

1. `agents.defaults.params` (전역 기본값 — 모든 모델에 적용)
2. `agents.defaults.models["provider/model"].params` (모델별 재정의)
3. `agents.list[].params` (일치하는 에이전트 id; 키별로 재정의)

### `contextPruning.mode: "cache-ttl"`

유휴 시간 이후 요청이 과도하게 큰 기록을 다시 캐시하지 않도록 캐시 TTL 기간 이후 오래된 tool-result 컨텍스트를 정리합니다.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

전체 동작은 [세션 정리](/ko/concepts/session-pruning)를 참조하세요.

### Heartbeat keep-warm

Heartbeat는 캐시 기간을 따뜻하게 유지하고 유휴 구간 이후 반복적인 캐시 쓰기를 줄일 수 있습니다.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

에이전트별 Heartbeat는 `agents.list[].heartbeat`에서 지원됩니다.

## Provider 동작

### Anthropic(직접 API)

- `cacheRetention`이 지원됩니다.
- Anthropic API 키 인증 프로필에서는 설정되지 않은 경우 Anthropic 모델 ref에 `cacheRetention: "short"`가 기본으로 적용됩니다.
- Anthropic 네이티브 Messages 응답은 `cache_read_input_tokens`와 `cache_creation_input_tokens`를 모두 노출하므로 OpenClaw는 `cacheRead`와 `cacheWrite`를 모두 표시할 수 있습니다.
- 네이티브 Anthropic 요청에서 `cacheRetention: "short"`는 기본 5분 ephemeral cache로 매핑되고, `cacheRetention: "long"`은 직접 `api.anthropic.com` 호스트에서만 1시간 TTL로 승격됩니다.

### OpenAI(직접 API)

- 프롬프트 캐싱은 지원되는 최신 모델에서 자동입니다. OpenClaw는 블록 수준 캐시 마커를 주입할 필요가 없습니다.
- OpenClaw는 턴 간 캐시 라우팅을 안정적으로 유지하기 위해 `prompt_cache_key`를 사용하며, 직접 OpenAI 호스트에서 `cacheRetention: "long"`이 선택된 경우에만 `prompt_cache_retention: "24h"`를 사용합니다.
- OpenAI 응답은 `usage.prompt_tokens_details.cached_tokens`(또는 Responses API 이벤트의 `input_tokens_details.cached_tokens`)를 통해 캐시된 프롬프트 토큰을 노출합니다. OpenClaw는 이를 `cacheRead`로 매핑합니다.
- OpenAI는 별도의 cache-write 토큰 카운터를 노출하지 않으므로, provider가 캐시를 워밍 중이어도 OpenAI 경로에서는 `cacheWrite`가 `0`으로 유지됩니다.
- OpenAI는 `x-request-id`, `openai-processing-ms`, `x-ratelimit-*` 같은 유용한 추적 및 rate-limit 헤더를 반환하지만, 캐시 적중 회계는 헤더가 아니라 usage 페이로드에서 가져와야 합니다.
- 실제로 OpenAI는 Anthropic 스타일의 이동하는 전체 기록 재사용보다 초기 접두사 캐시에 더 가깝게 동작하는 경우가 많습니다. 안정적인 긴 접두사 텍스트 턴은 현재 라이브 프로브에서 `4864` cached token 부근의 plateau에 도달할 수 있고, tool-heavy 또는 MCP 스타일 transcript는 정확히 반복하더라도 `4608` cached token 부근에서 plateau에 도달하는 경우가 많습니다.

### Anthropic Vertex

- Vertex AI의 Anthropic 모델(`anthropic-vertex/*`)은 직접 Anthropic과 동일한 방식으로 `cacheRetention`을 지원합니다.
- `cacheRetention: "long"`은 Vertex AI 엔드포인트에서 실제 1시간 프롬프트 캐시 TTL로 매핑됩니다.
- `anthropic-vertex`의 기본 캐시 보존은 직접 Anthropic 기본값과 일치합니다.
- Vertex 요청은 boundary-aware 캐시 shaping을 통해 라우팅되므로 캐시 재사용이 provider가 실제로 받는 내용과 일치하도록 유지됩니다.

### Amazon Bedrock

- Anthropic Claude 모델 ref(`amazon-bedrock/*anthropic.claude*`)는 명시적 `cacheRetention` 전달을 지원합니다.
- Anthropic이 아닌 Bedrock 모델은 런타임에 `cacheRetention: "none"`으로 강제됩니다.

### OpenRouter Anthropic 모델

`openrouter/anthropic/*` 모델 ref의 경우 OpenClaw는
요청이 검증된 OpenRouter 경로를 계속 대상으로 할 때만
(`openrouter`의 기본 엔드포인트, 또는 `openrouter.ai`로 해석되는 provider/base URL)
프롬프트 캐시 재사용을 개선하기 위해 system/developer 프롬프트 블록에 Anthropic
`cache_control`을 주입합니다.

모델을 임의의 OpenAI 호환 프록시 URL로 다시 지정하면 OpenClaw는
이러한 OpenRouter 전용 Anthropic 캐시 마커 주입을 중단합니다.

### 기타 provider

provider가 이 캐시 모드를 지원하지 않으면 `cacheRetention`은 아무 효과가 없습니다.

### Google Gemini 직접 API

- 직접 Gemini transport(`api: "google-generative-ai"`)는 업스트림 `cachedContentTokenCount`를 통해 캐시 적중을 보고하며, OpenClaw는 이를 `cacheRead`로 매핑합니다.
- 직접 Gemini 모델에 `cacheRetention`이 설정되면 OpenClaw는 Google AI Studio 실행에서 system prompt용 `cachedContents` 리소스를 자동으로 생성, 재사용, 갱신합니다. 즉, 더 이상 cached-content handle을 수동으로 미리 만들 필요가 없습니다.
- 구성된 모델에서 `params.cachedContent`(또는 레거시 `params.cached_content`)를 통해 기존 Gemini cached-content handle을 계속 전달할 수 있습니다.
- 이는 Anthropic/OpenAI 프롬프트 접두사 캐싱과는 별개입니다. Gemini의 경우 OpenClaw는 요청에 캐시 마커를 주입하는 대신 provider 네이티브 `cachedContents` 리소스를 관리합니다.

### Gemini CLI JSON usage

- Gemini CLI JSON 출력도 `stats.cached`를 통해 캐시 적중을 표시할 수 있으며, OpenClaw는 이를 `cacheRead`로 매핑합니다.
- CLI가 직접적인 `stats.input` 값을 생략하면 OpenClaw는 `stats.input_tokens - stats.cached`에서 입력 토큰을 계산합니다.
- 이는 usage 정규화일 뿐입니다. OpenClaw가 Gemini CLI에 대해 Anthropic/OpenAI 스타일 프롬프트 캐시 마커를 생성한다는 의미는 아닙니다.

## 시스템 프롬프트 캐시 경계

OpenClaw는 시스템 프롬프트를 내부 캐시 접두사 경계로 구분된 **안정적인 접두사**와 **가변적인 접미사**로 나눕니다. 경계 위의 콘텐츠(도구 정의, Skills 메타데이터, workspace 파일, 기타 상대적으로 정적인 컨텍스트)는 턴 간 바이트 단위로 동일하게 유지되도록 정렬됩니다. 경계 아래의 콘텐츠(예: `HEARTBEAT.md`, 런타임 타임스탬프, 기타 턴별 메타데이터)는 캐시된 접두사를 무효화하지 않고 변경될 수 있습니다.

주요 설계 선택:

- 안정적인 workspace 프로젝트 컨텍스트 파일은 `HEARTBEAT.md`보다 먼저 정렬되어 Heartbeat 변경이 안정적인 접두사를 깨뜨리지 않도록 합니다.
- 이 경계는 Anthropic 계열, OpenAI 계열, Google, CLI transport shaping 전반에 적용되어 지원되는 모든 provider가 동일한 접두사 안정성의 이점을 누리도록 합니다.
- Codex Responses 및 Anthropic Vertex 요청은 boundary-aware 캐시 shaping을 통해 라우팅되므로 캐시 재사용이 provider가 실제로 받는 내용과 일치하도록 유지됩니다.
- 시스템 프롬프트 fingerprint는 의미상 바뀌지 않은 프롬프트가 턴 간 KV/cache를 공유하도록 정규화됩니다(공백, 줄 끝, hook이 추가한 컨텍스트, 런타임 capability 순서).

config 또는 workspace 변경 후 예상치 못한 `cacheWrite` 급증이 보인다면, 해당 변경이 캐시 경계 위에 있는지 아래에 있는지 확인하세요. 가변적인 콘텐츠를 경계 아래로 내리거나(또는 안정화하면) 문제를 해결하는 경우가 많습니다.

## OpenClaw 캐시 안정성 가드

OpenClaw는 요청이 provider에 도달하기 전에 여러 캐시 민감 페이로드 형태도 결정적으로 유지합니다.

- 번들 MCP 도구 카탈로그는 도구 등록 전에 결정적으로 정렬되므로 `listTools()` 순서 변경이 도구 블록을 흔들어 프롬프트 캐시 접두사를 깨뜨리지 않습니다.
- 이미지 블록이 저장된 레거시 세션은 **가장 최근의 완료된 3개 턴**을 그대로 유지합니다. 더 오래된 이미 처리된 이미지 블록은 marker로 대체될 수 있으므로, 이미지가 많은 후속 요청이 크고 오래된 페이로드를 계속 다시 보내지 않게 됩니다.

## 튜닝 패턴

### 혼합 트래픽(권장 기본값)

주요 에이전트에는 오래 유지되는 기준선을 유지하고, 급증형 notifier 에이전트에는 캐싱을 비활성화합니다.

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### 비용 우선 기준선

- 기준선 `cacheRetention: "short"`를 설정
- `contextPruning.mode: "cache-ttl"` 활성화
- 따뜻한 캐시의 이점이 있는 에이전트에 대해서만 TTL 아래로 Heartbeat 유지

## 캐시 진단

OpenClaw는 임베디드 에이전트 실행을 위한 전용 캐시 추적 진단을 노출합니다.

일반 사용자 대상 진단의 경우 `/status` 및 기타 usage 요약은
라이브 세션 엔트리에 해당 카운터가 없을 때 `cacheRead` /
`cacheWrite`의 폴백 소스로 최신 transcript usage 엔트리를 사용할 수 있습니다.

## 라이브 회귀 테스트

OpenClaw는 반복 접두사, tool turn, image turn, MCP 스타일 tool transcript, Anthropic no-cache control에 대한 하나의 결합된 라이브 캐시 회귀 게이트를 유지합니다.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

좁은 라이브 게이트는 다음과 같이 실행합니다.

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

baseline 파일은 가장 최근에 관찰된 라이브 수치와 테스트에서 사용하는 provider별 회귀 하한선을 저장합니다.
러너는 또한 이전 캐시 상태가 현재 회귀 샘플을 오염시키지 않도록 실행마다 새로운 세션 ID와 프롬프트 네임스페이스를 사용합니다.

이 테스트들은 의도적으로 provider 간에 동일한 성공 기준을 사용하지 않습니다.

### Anthropic 라이브 기대값

- `cacheWrite`를 통한 명시적 워밍업 쓰기를 기대
- Anthropic 캐시 제어가 대화 전반에 걸쳐 캐시 breakpoint를 이동시키기 때문에 반복 턴에서 거의 전체 기록 재사용을 기대
- 현재 라이브 단언은 여전히 안정적, tool, image 경로에 대해 높은 적중률 임계값을 사용

### OpenAI 라이브 기대값

- `cacheRead`만 기대. `cacheWrite`는 `0`으로 유지
- 반복 턴 캐시 재사용은 Anthropic 스타일의 이동하는 전체 기록 재사용이 아니라 provider별 plateau로 취급
- 현재 라이브 단언은 `gpt-5.4-mini`에서 관찰된 라이브 동작으로부터 도출된 보수적인 하한 검사 사용:
  - 안정적인 접두사: `cacheRead >= 4608`, 적중률 `>= 0.90`
  - tool transcript: `cacheRead >= 4096`, 적중률 `>= 0.85`
  - image transcript: `cacheRead >= 3840`, 적중률 `>= 0.82`
  - MCP 스타일 transcript: `cacheRead >= 4096`, 적중률 `>= 0.85`

2026-04-04의 최신 결합 라이브 검증 결과:

- 안정적인 접두사: `cacheRead=4864`, 적중률 `0.966`
- tool transcript: `cacheRead=4608`, 적중률 `0.896`
- image transcript: `cacheRead=4864`, 적중률 `0.954`
- MCP 스타일 transcript: `cacheRead=4608`, 적중률 `0.891`

결합 게이트의 최근 로컬 wall-clock 시간은 약 `88s`였습니다.

단언이 다른 이유:

- Anthropic은 명시적인 캐시 breakpoint와 이동하는 대화 기록 재사용을 노출합니다.
- OpenAI 프롬프트 캐싱도 여전히 정확한 접두사에 민감하지만, 실제 Responses 트래픽에서 효과적으로 재사용 가능한 접두사는 전체 프롬프트보다 더 일찍 plateau에 도달할 수 있습니다.
- 따라서 Anthropic과 OpenAI를 하나의 provider 공통 백분율 임계값으로 비교하면 잘못된 회귀가 발생합니다.

### `diagnostics.cacheTrace` config

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

기본값:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### env 토글(일회성 디버깅)

- `OPENCLAW_CACHE_TRACE=1`은 캐시 추적을 활성화합니다.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl`은 출력 경로를 재정의합니다.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1`은 전체 메시지 페이로드 캡처를 전환합니다.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1`은 프롬프트 텍스트 캡처를 전환합니다.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1`은 시스템 프롬프트 캡처를 전환합니다.

### 확인할 항목

- 캐시 추적 이벤트는 JSONL 형식이며 `session:loaded`, `prompt:before`, `stream:context`, `session:after` 같은 단계별 스냅샷을 포함합니다.
- 턴별 캐시 토큰 영향은 일반 usage 표면의 `cacheRead` 및 `cacheWrite`를 통해 확인할 수 있습니다(예: `/usage full` 및 세션 usage 요약).
- Anthropic의 경우 캐싱이 활성화되어 있으면 `cacheRead`와 `cacheWrite`가 모두 나타나야 합니다.
- OpenAI의 경우 캐시 적중 시 `cacheRead`가 나타나고 `cacheWrite`는 `0`으로 유지되어야 합니다. OpenAI는 별도의 cache-write 토큰 필드를 공개하지 않습니다.
- 요청 추적이 필요하면, 캐시 메트릭과는 별도로 요청 ID와 rate-limit 헤더를 기록하세요. OpenClaw의 현재 cache-trace 출력은 원시 provider 응답 헤더보다 프롬프트/세션 형태와 정규화된 토큰 usage에 초점을 맞춥니다.

## 빠른 문제 해결

- 대부분의 턴에서 `cacheWrite`가 높음: 가변적인 시스템 프롬프트 입력을 확인하고 모델/provider가 현재 캐시 설정을 지원하는지 검증하세요.
- Anthropic에서 `cacheWrite`가 높음: 보통은 캐시 breakpoint가 매 요청마다 바뀌는 콘텐츠에 걸린다는 뜻입니다.
- OpenAI에서 `cacheRead`가 낮음: 안정적인 접두사가 앞부분에 있는지, 반복 접두사가 최소 1024 토큰인지, 캐시를 공유해야 하는 턴에 동일한 `prompt_cache_key`가 재사용되는지 확인하세요.
- `cacheRetention`이 효과가 없음: 모델 키가 `agents.defaults.models["provider/model"]`와 일치하는지 확인하세요.
- 캐시 설정이 있는 Bedrock Nova/Mistral 요청: 런타임에서 `none`으로 강제되는 것이 정상입니다.

관련 문서:

- [Anthropic](/ko/providers/anthropic)
- [토큰 사용량 및 비용](/ko/reference/token-use)
- [세션 정리](/ko/concepts/session-pruning)
- [Gateway 구성 참조](/ko/gateway/configuration-reference)

## 관련 항목

- [토큰 사용량 및 비용](/ko/reference/token-use)
- [API 사용량 및 비용](/ko/reference/api-usage-costs)
