---
read_when:
    - 자체 GPU 머신에서 모델을 제공하려고 합니다.
    - LM Studio 또는 OpenAI 호환 프록시를 연결하고 있습니다.
    - 가장 안전한 로컬 모델 가이드가 필요합니다.
summary: 로컬 LLM에서 OpenClaw 실행하기(LM Studio, vLLM, LiteLLM, 사용자 지정 OpenAI 엔드포인트)
title: 로컬 모델
x-i18n:
    generated_at: "2026-04-14T06:00:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1544c522357ba4b18dfa6d05ea8d60c7c6262281b53863d9aee7002464703ca7
    source_path: gateway/local-models.md
    workflow: 15
---

# 로컬 모델

로컬에서도 가능하지만, OpenClaw는 **큰 컨텍스트**와 **프롬프트 인젝션에 대한 강력한 방어**를 기대합니다. 성능이 낮은 GPU는 컨텍스트를 잘라내고 안전성을 약화시킵니다. 높은 사양을 목표로 하세요: **최소 2대의 풀사양 Mac Studio 또는 이에 준하는 GPU 장비(약 $30k 이상)**. 단일 **24GB** GPU는 더 가벼운 프롬프트에서만 동작하며 지연 시간도 더 높습니다. 실행 가능한 범위에서 **가장 크고 완전한 모델 변형**을 사용하세요. 과도하게 양자화된 체크포인트나 “small” 체크포인트는 프롬프트 인젝션 위험을 높입니다([보안](/ko/gateway/security) 참고).

가장 마찰이 적은 로컬 설정을 원한다면 [LM Studio](/ko/providers/lmstudio) 또는 [Ollama](/ko/providers/ollama)로 시작하고 `openclaw onboard`를 실행하세요. 이 페이지는 더 고급 로컬 스택과 사용자 지정 OpenAI 호환 로컬 서버를 위한 권장 가이드입니다.

## 권장: LM Studio + 대형 로컬 모델(Responses API)

현재 기준으로 가장 좋은 로컬 스택입니다. LM Studio에 대형 모델(예: 풀사이즈 Qwen, DeepSeek, 또는 Llama 빌드)을 로드하고, 로컬 서버(기본값 `http://127.0.0.1:1234`)를 활성화한 다음, Responses API를 사용해 추론과 최종 텍스트를 분리하세요.

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Local Model”,
            reasoning: false,
            input: [“text”],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**설정 체크리스트**

- LM Studio 설치: [https://lmstudio.ai](https://lmstudio.ai)
- LM Studio에서 **사용 가능한 가장 큰 모델 빌드**를 다운로드하고(“small” 또는 심하게 양자화된 변형은 피하세요), 서버를 시작한 뒤 `http://127.0.0.1:1234/v1/models`에 해당 모델이 표시되는지 확인하세요.
- `my-local-model`을 LM Studio에 표시되는 실제 모델 ID로 바꾸세요.
- 모델을 계속 로드된 상태로 유지하세요. 콜드 로드는 시작 지연을 추가합니다.
- LM Studio 빌드가 다르다면 `contextWindow`와 `maxTokens`를 조정하세요.
- WhatsApp에서는 최종 텍스트만 전송되도록 Responses API를 사용하세요.

로컬로 실행하더라도 호스팅 모델 설정은 유지하세요. `models.mode: "merge"`를 사용하면 폴백을 계속 사용할 수 있습니다.

### 하이브리드 구성: 호스팅 모델을 기본으로, 로컬 모델을 폴백으로

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### 로컬 우선, 호스팅 모델을 안전망으로 사용

기본 모델과 폴백 순서를 바꾸면 됩니다. 같은 providers 블록과 `models.mode: "merge"`를 유지하면 로컬 장비가 다운되었을 때 Sonnet 또는 Opus로 폴백할 수 있습니다.

### 지역별 호스팅 / 데이터 라우팅

- 호스팅된 MiniMax/Kimi/GLM 변형도 지역 고정 엔드포인트(예: 미국 호스팅)를 통해 OpenRouter에서 사용할 수 있습니다. 트래픽을 원하는 관할 구역 내에 유지하려면 해당 지역 변형을 선택하고, Anthropic/OpenAI 폴백을 계속 사용할 수 있도록 `models.mode: "merge"`를 유지하세요.
- 로컬 전용이 가장 강력한 개인정보 보호 경로입니다. 호스팅 지역 라우팅은 공급자 기능이 필요하지만 데이터 흐름도 통제하고 싶을 때의 중간 지점입니다.

## 기타 OpenAI 호환 로컬 프록시

vLLM, LiteLLM, OAI-proxy, 또는 사용자 지정 Gateway도 OpenAI 스타일 `/v1` 엔드포인트를 제공하면 사용할 수 있습니다. 위 provider 블록을 자신의 엔드포인트와 모델 ID로 바꾸세요.

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

호스팅 모델을 폴백으로 계속 사용할 수 있도록 `models.mode: "merge"`를 유지하세요.

로컬/프록시 `/v1` 백엔드에 대한 동작 참고 사항:

- OpenClaw는 이를 네이티브 OpenAI 엔드포인트가 아니라 프록시 스타일의 OpenAI 호환 라우트로 처리합니다.
- 네이티브 OpenAI 전용 요청 구성은 여기에는 적용되지 않습니다. 즉, `service_tier`, Responses `store`, OpenAI 추론 호환 페이로드 구성, 프롬프트 캐시 힌트는 사용되지 않습니다.
- 숨겨진 OpenClaw attribution 헤더(`originator`, `version`, `User-Agent`)는 이러한 사용자 지정 프록시 URL에 주입되지 않습니다.

더 엄격한 OpenAI 호환 백엔드에 대한 호환성 참고 사항:

- 일부 서버는 Chat Completions에서 구조화된 content-part 배열이 아니라 문자열 `messages[].content`만 허용합니다. 이런 엔드포인트에는 `models.providers.<provider>.models[].compat.requiresStringContent: true`를 설정하세요.
- 일부 더 작거나 더 엄격한 로컬 백엔드는 OpenClaw의 전체 에이전트 런타임 프롬프트 형태, 특히 tool 스키마가 포함된 경우에 불안정할 수 있습니다. 백엔드가 작은 직접 `/v1/chat/completions` 호출에서는 동작하지만 일반적인 OpenClaw 에이전트 턴에서는 실패한다면, 먼저 `models.providers.<provider>.models[].compat.supportsTools: false`를 시도하세요.
- 더 큰 OpenClaw 실행에서만 백엔드가 계속 실패한다면, 남은 문제는 대개 OpenClaw의 전송 계층이 아니라 업스트림 모델/서버 용량 또는 백엔드 버그입니다.

## 문제 해결

- Gateway가 프록시에 연결할 수 있나요? `curl http://127.0.0.1:1234/v1/models`
- LM Studio 모델이 언로드되었나요? 다시 로드하세요. 콜드 스타트는 “멈춘 것처럼 보이는” 흔한 원인입니다.
- OpenClaw는 감지된 컨텍스트 윈도우가 **32k** 미만이면 경고하고 **16k** 미만이면 차단합니다. 이 사전 점검에 걸린다면 서버/모델의 컨텍스트 한도를 늘리거나 더 큰 모델을 선택하세요.
- 컨텍스트 오류가 발생하나요? `contextWindow`를 낮추거나 서버 한도를 높이세요.
- OpenAI 호환 서버가 `messages[].content ... expected a string`을 반환하나요? 해당 모델 항목에 `compat.requiresStringContent: true`를 추가하세요.
- 작은 직접 `/v1/chat/completions` 호출은 동작하지만 `openclaw infer model run`이 Gemma 또는 다른 로컬 모델에서 실패하나요? 먼저 `compat.supportsTools: false`로 tool 스키마를 비활성화한 뒤 다시 테스트하세요. 이후에도 더 큰 OpenClaw 프롬프트에서만 서버가 크래시한다면, 업스트림 서버/모델의 한계로 간주하세요.
- 안전성: 로컬 모델은 공급자 측 필터를 건너뜁니다. 프롬프트 인젝션 영향 범위를 제한하려면 에이전트 범위를 좁게 유지하고 Compaction을 켜 두세요.
