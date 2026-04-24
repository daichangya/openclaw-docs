---
read_when:
    - LM Studio를 통해 오픈 소스 모델과 함께 OpenClaw를 실행하려는 경우
    - LM Studio를 설정하고 구성하려는 경우
summary: LM Studio와 함께 OpenClaw 실행하기
title: LM Studio
x-i18n:
    generated_at: "2026-04-24T06:31:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2077790173a8cb660409b64e199d2027dda7b5b55226a00eadb0cdc45061e3ce
    source_path: providers/lmstudio.md
    workflow: 15
---

LM Studio는 자체 하드웨어에서 오픈 웨이트 모델을 실행하기 위한 친숙하면서도 강력한 앱입니다. llama.cpp (GGUF) 또는 MLX 모델(Apple Silicon)을 실행할 수 있습니다. GUI 패키지와 헤드리스 daemon(`llmster`) 형태로 제공됩니다. 제품 및 설정 문서는 [lmstudio.ai](https://lmstudio.ai/)를 참조하세요.

## 빠른 시작

1. LM Studio(데스크톱) 또는 `llmster`(헤드리스)를 설치한 뒤, 로컬 서버를 시작하세요.

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. 서버 시작

데스크톱 앱을 시작하거나 다음 명령으로 daemon을 실행했는지 확인하세요.

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

앱을 사용하는 경우 원활한 사용을 위해 JIT가 활성화되어 있는지 확인하세요. 자세한 내용은 [LM Studio JIT and TTL guide](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)를 참조하세요.

3. OpenClaw는 LM Studio token 값이 필요합니다. `LM_API_TOKEN`을 설정하세요.

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

LM Studio 인증이 비활성화되어 있다면 비어 있지 않은 아무 token 값이나 사용하세요.

```bash
export LM_API_TOKEN="placeholder-key"
```

LM Studio 인증 설정 세부 사항은 [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication)을 참조하세요.

4. 온보딩을 실행하고 `LM Studio`를 선택하세요.

```bash
openclaw onboard
```

5. 온보딩에서 `Default model` 프롬프트를 사용해 LM Studio 모델을 선택하세요.

나중에 설정하거나 변경할 수도 있습니다.

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio 모델 키는 `author/model-name` 형식(예: `qwen/qwen3.5-9b`)을 따릅니다. OpenClaw
모델 ref는 여기에 provider 이름을 붙여 `lmstudio/qwen/qwen3.5-9b` 형식이 됩니다. 모델의 정확한 키는
`curl http://localhost:1234/api/v1/models`를 실행한 뒤 `key` 필드를 보면 확인할 수 있습니다.

## 비대화형 온보딩

설정을 스크립트화하려는 경우(CI, 프로비저닝, 원격 부트스트랩) 비대화형 온보딩을 사용하세요.

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

또는 base URL이나 모델을 API 키와 함께 지정하세요.

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id`는 provider 접두사 `lmstudio/` 없이, LM Studio가 반환한 모델 키(예:
`qwen/qwen3.5-9b`)를 받습니다.

비대화형 온보딩에는 `--lmstudio-api-key`(또는 환경 변수의 `LM_API_TOKEN`)가 필요합니다.
인증이 없는 LM Studio 서버의 경우 비어 있지 않은 어떤 token 값이든 동작합니다.

`--custom-api-key`도 호환성을 위해 계속 지원되지만, LM Studio에는 `--lmstudio-api-key`를 권장합니다.

이 명령은 `models.providers.lmstudio`를 기록하고, 기본 모델을
`lmstudio/<custom-model-id>`로 설정하며, `lmstudio:default` auth profile을 기록합니다.

대화형 설정에서는 선택적으로 선호하는 load context length를 묻고, 저장하는 발견된 LM Studio 모델 전반에 이를 적용할 수 있습니다.

## 설정

### 스트리밍 사용량 호환성

LM Studio는 스트리밍 사용량과 호환됩니다. OpenAI 형식의
`usage` 객체를 내보내지 않을 때 OpenClaw는 대신 llama.cpp 스타일의
`timings.prompt_n` / `timings.predicted_n` 메타데이터에서 토큰 수를 복구합니다.

같은 동작은 다음 OpenAI 호환 로컬 백엔드에도 적용됩니다.

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### 명시적 설정

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 문제 해결

### LM Studio가 감지되지 않음

LM Studio가 실행 중인지, 그리고 `LM_API_TOKEN`을 설정했는지 확인하세요(인증이 없는 서버의 경우 비어 있지 않은 어떤 token 값이든 동작합니다).

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

API 접근 가능 여부 확인:

```bash
curl http://localhost:1234/api/v1/models
```

### 인증 오류 (HTTP 401)

설정 중 HTTP 401이 보고되면 API 키를 확인하세요.

- `LM_API_TOKEN`이 LM Studio에 구성된 키와 일치하는지 확인하세요.
- LM Studio 인증 설정 세부 사항은 [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication)을 참조하세요.
- 서버에 인증이 필요 없다면 `LM_API_TOKEN`에는 비어 있지 않은 어떤 token 값이든 사용하세요.

### Just-in-time 모델 로딩

LM Studio는 모델을 첫 요청 시 로드하는 just-in-time (JIT) 모델 로딩을 지원합니다. 'Model not loaded' 오류를 피하려면 이것이 활성화되어 있는지 확인하세요.

## 관련 항목

- [Model selection](/ko/concepts/model-providers)
- [Ollama](/ko/providers/ollama)
- [Local models](/ko/gateway/local-models)
