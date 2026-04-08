---
read_when:
    - 로컬 inferrs 서버에 대해 OpenClaw를 실행하려는 경우
    - inferrs를 통해 Gemma 또는 다른 모델을 서빙하는 경우
    - inferrs에 필요한 정확한 OpenClaw compat 플래그가 필요한 경우
summary: inferrs(OpenAI 호환 로컬 서버)를 통해 OpenClaw 실행
title: inferrs
x-i18n:
    generated_at: "2026-04-08T02:17:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: d84f660d49a682d0c0878707eebe1bc1e83dd115850687076ea3938b9f9c86c6
    source_path: providers/inferrs.md
    workflow: 15
---

# inferrs

[inferrs](https://github.com/ericcurtin/inferrs)는
OpenAI 호환 `/v1` API 뒤에서 로컬 모델을 서빙할 수 있습니다. OpenClaw는 일반적인
`openai-completions` 경로를 통해 `inferrs`와 함께 동작합니다.

현재 `inferrs`는 전용 OpenClaw provider plugin이라기보다
사용자 지정 self-hosted OpenAI 호환
백엔드로 취급하는 것이 가장 적절합니다.

## 빠른 시작

1. 모델과 함께 `inferrs`를 시작합니다.

예시:

```bash
inferrs serve gg-hf-gg/gemma-4-E2B-it \
  --host 127.0.0.1 \
  --port 8080 \
  --device metal
```

2. 서버에 연결 가능한지 확인합니다.

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/v1/models
```

3. 명시적인 OpenClaw provider 항목을 추가하고 기본 모델이 이를 가리키도록 설정합니다.

## 전체 구성 예시

이 예시는 로컬 `inferrs` 서버에서 Gemma 4를 사용합니다.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/gg-hf-gg/gemma-4-E2B-it" },
      models: {
        "inferrs/gg-hf-gg/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "gg-hf-gg/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## `requiresStringContent`가 중요한 이유

일부 `inferrs` Chat Completions 경로는 구조화된 content-part 배열이 아니라
문자열 형태의 `messages[].content`만 허용합니다.

OpenClaw 실행이 다음과 같은 오류로 실패한다면:

```text
messages[1].content: invalid type: sequence, expected a string
```

다음을 설정하세요:

```json5
compat: {
  requiresStringContent: true
}
```

OpenClaw는 요청을 보내기 전에 순수 텍스트 content part를
일반 문자열로 평탄화합니다.

## Gemma 및 도구 스키마 주의 사항

현재의 일부 `inferrs` + Gemma 조합은 작은 직접
`/v1/chat/completions` 요청은 허용하지만 전체 OpenClaw 에이전트 런타임
턴에서는 여전히 실패합니다.

이 경우 먼저 다음을 시도하세요:

```json5
compat: {
  requiresStringContent: true,
  supportsTools: false
}
```

이렇게 하면 해당 모델에 대해 OpenClaw의 도구 스키마 표면이 비활성화되며,
더 엄격한 로컬 백엔드에서 프롬프트 부담을 줄일 수 있습니다.

작은 직접 요청은 계속 동작하지만 일반적인 OpenClaw 에이전트 턴이 계속
`inferrs` 내부에서 크래시한다면, 남은 문제는 보통 OpenClaw의 전송 계층보다는
업스트림 모델/서버 동작입니다.

## 수동 스모크 테스트

구성한 뒤에는 두 계층을 모두 테스트하세요.

```bash
curl http://127.0.0.1:8080/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"gg-hf-gg/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'

openclaw infer model run \
  --model inferrs/gg-hf-gg/gemma-4-E2B-it \
  --prompt "What is 2 + 2? Reply with one short sentence." \
  --json
```

첫 번째 명령은 동작하지만 두 번째가 실패한다면, 아래의 문제 해결 참고 사항을 사용하세요.

## 문제 해결

- `curl /v1/models`가 실패함: `inferrs`가 실행 중이 아니거나, 연결할 수 없거나,
  예상한 호스트/포트에 바인딩되지 않았습니다.
- `messages[].content ... expected a string`: `compat.requiresStringContent: true`를 설정하세요.
- 작은 직접 `/v1/chat/completions` 호출은 통과하지만 `openclaw infer model run`이
  실패함: `compat.supportsTools: false`를 시도하세요.
- OpenClaw에서 더 이상 스키마 오류는 나지 않지만 `inferrs`가 더 큰
  에이전트 턴에서 여전히 크래시함: 이를 업스트림 `inferrs` 또는 모델 한계로 보고
  프롬프트 부담을 줄이거나 로컬 백엔드/모델을 바꾸세요.

## 프록시 스타일 동작

`inferrs`는 네이티브
OpenAI 엔드포인트가 아니라 프록시 스타일 OpenAI 호환 `/v1` 백엔드로 취급됩니다.

- 네이티브 OpenAI 전용 요청 셰이핑은 여기에 적용되지 않습니다
- `service_tier`, Responses `store`, 프롬프트 캐시 힌트, OpenAI 추론 호환 페이로드 셰이핑이 없습니다
- 숨겨진 OpenClaw attribution 헤더(`originator`, `version`, `User-Agent`)는
  사용자 지정 `inferrs` base URL에 주입되지 않습니다

## 함께 보기

- [로컬 모델](/ko/gateway/local-models)
- [게이트웨이 문제 해결](/ko/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)
- [모델 프로바이더](/ko/concepts/model-providers)
