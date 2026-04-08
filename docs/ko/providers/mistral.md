---
read_when:
    - OpenClaw에서 Mistral 모델을 사용하고 싶을 때
    - Mistral API 키 온보딩과 모델 ref가 필요할 때
summary: OpenClaw에서 Mistral 모델과 Voxtral 전사를 사용합니다
title: Mistral
x-i18n:
    generated_at: "2026-04-08T02:17:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e32a0eb2a37dba6383ba338b06a8d0be600e7443aa916225794ccb0fdf46aee
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw는 텍스트/이미지 모델 라우팅(`mistral/...`)과
미디어 이해에서 Voxtral을 통한 오디오 전사 모두에 대해 Mistral을 지원합니다.
Mistral은 메모리 임베딩에도 사용할 수 있습니다(`memorySearch.provider = "mistral"`).

## CLI 설정

```bash
openclaw onboard --auth-choice mistral-api-key
# or non-interactive
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## Config 스니펫 (LLM 제공자)

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## 내장 LLM 카탈로그

현재 OpenClaw는 다음과 같은 번들 Mistral 카탈로그를 제공합니다:

| Model ref                        | 입력        | 컨텍스트 | 최대 출력 | 참고                                                              |
| -------------------------------- | ----------- | -------- | --------- | ----------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | 텍스트, 이미지 | 262,144 | 16,384    | 기본 모델                                                         |
| `mistral/mistral-medium-2508`    | 텍스트, 이미지 | 262,144 | 8,192     | Mistral Medium 3.1                                                |
| `mistral/mistral-small-latest`   | 텍스트, 이미지 | 128,000 | 16,384    | Mistral Small 4; API `reasoning_effort`를 통한 조정 가능한 추론 지원 |
| `mistral/pixtral-large-latest`   | 텍스트, 이미지 | 128,000 | 32,768    | Pixtral                                                           |
| `mistral/codestral-latest`       | 텍스트      | 256,000 | 4,096     | 코딩                                                              |
| `mistral/devstral-medium-latest` | 텍스트      | 262,144 | 32,768    | Devstral 2                                                        |
| `mistral/magistral-small`        | 텍스트      | 128,000 | 40,000    | 추론 지원                                                         |

## Config 스니펫 (Voxtral을 사용한 오디오 전사)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

## 조정 가능한 추론 (`mistral-small-latest`)

`mistral/mistral-small-latest`는 Mistral Small 4에 매핑되며, Chat Completions API에서 `reasoning_effort`를 통해 [조정 가능한 추론](https://docs.mistral.ai/capabilities/reasoning/adjustable)을 지원합니다(`none`은 출력의 추가 사고를 최소화하고, `high`는 최종 답변 전에 전체 사고 추적을 노출합니다).

OpenClaw는 세션 **thinking** 수준을 Mistral API에 다음과 같이 매핑합니다:

- **off** / **minimal** → `none`
- **low** / **medium** / **high** / **xhigh** / **adaptive** → `high`

다른 번들 Mistral 카탈로그 모델은 이 파라미터를 사용하지 않습니다. Mistral의 네이티브 추론 우선 동작이 필요할 때는 계속 `magistral-*` 모델을 사용하세요.

## 참고

- Mistral 인증은 `MISTRAL_API_KEY`를 사용합니다.
- 제공자 기본 URL은 `https://api.mistral.ai/v1`입니다.
- 온보딩 기본 모델은 `mistral/mistral-large-latest`입니다.
- Mistral의 미디어 이해 기본 오디오 모델은 `voxtral-mini-latest`입니다.
- 미디어 전사 경로는 `/v1/audio/transcriptions`를 사용합니다.
- 메모리 임베딩 경로는 `/v1/embeddings`를 사용합니다(기본 모델: `mistral-embed`).
