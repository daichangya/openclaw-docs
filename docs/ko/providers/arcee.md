---
read_when:
    - OpenClaw에서 Arcee AI를 사용하려는 경우
    - API 키 환경 변수 또는 CLI 인증 선택이 필요한 경우
summary: Arcee AI 설정(인증 + 모델 선택)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-07T05:59:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb04909a708fec08dd2c8c863501b178f098bc4818eaebad38aea264157969d8
    source_path: providers/arcee.md
    workflow: 15
---

# Arcee AI

[Arcee AI](https://arcee.ai)는 OpenAI 호환 API를 통해 Trinity 계열 mixture-of-experts 모델에 대한 액세스를 제공합니다. 모든 Trinity 모델은 Apache 2.0 라이선스를 사용합니다.

Arcee AI 모델은 Arcee 플랫폼에서 직접 또는 [OpenRouter](/ko/providers/openrouter)를 통해 액세스할 수 있습니다.

- Provider: `arcee`
- 인증: `ARCEEAI_API_KEY`(직접) 또는 `OPENROUTER_API_KEY`(OpenRouter 경유)
- API: OpenAI 호환
- Base URL: `https://api.arcee.ai/api/v1`(직접) 또는 `https://openrouter.ai/api/v1`(OpenRouter)

## 빠른 시작

1. [Arcee AI](https://chat.arcee.ai/) 또는 [OpenRouter](https://openrouter.ai/keys)에서 API 키를 받습니다.

2. API 키를 설정합니다(권장: Gateway용으로 저장):

```bash
# Direct (Arcee platform)
openclaw onboard --auth-choice arceeai-api-key

# Via OpenRouter
openclaw onboard --auth-choice arceeai-openrouter
```

3. 기본 모델을 설정합니다:

```json5
{
  agents: {
    defaults: {
      model: { primary: "arcee/trinity-large-thinking" },
    },
  },
}
```

## 비대화형 예시

```bash
# Direct (Arcee platform)
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice arceeai-api-key \
  --arceeai-api-key "$ARCEEAI_API_KEY"

# Via OpenRouter
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice arceeai-openrouter \
  --openrouter-api-key "$OPENROUTER_API_KEY"
```

## 환경 참고

Gateway가 데몬(launchd/systemd)으로 실행되는 경우, `ARCEEAI_API_KEY`
(또는 `OPENROUTER_API_KEY`)를 해당 프로세스에서 사용할 수 있어야 합니다(예:
`~/.openclaw/.env` 또는 `env.shellEnv`).

## 내장 카탈로그

OpenClaw는 현재 다음 번들 Arcee 카탈로그를 제공합니다:

| Model ref                      | 이름                   | 입력 | 컨텍스트 | 비용(입력/출력, 100만당) | 참고                                      |
| ------------------------------ | ---------------------- | ---- | -------- | ------------------------ | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text | 256K     | $0.25 / $0.90            | 기본 모델; reasoning 활성화됨             |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text | 128K     | $0.25 / $1.00            | 범용; 400B params, 13B active             |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text | 128K     | $0.045 / $0.15           | 빠르고 비용 효율적임; function calling 지원 |

동일한 model ref는 직접 설정과 OpenRouter 설정 모두에서 작동합니다(예: `arcee/trinity-large-thinking`).

온보딩 프리셋은 `arcee/trinity-large-thinking`을 기본 모델로 설정합니다.

## 지원 기능

- 스트리밍
- 도구 사용 / function calling
- 구조화된 출력(JSON mode 및 JSON schema)
- 확장 thinking(Trinity Large Thinking)
