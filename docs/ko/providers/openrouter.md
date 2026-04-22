---
read_when:
    - 여러 LLM에 대해 하나의 API 키를 원합니다
    - OpenClaw에서 OpenRouter를 통해 모델을 실행하려고 합니다
summary: OpenClaw에서 OpenRouter의 통합 API를 사용해 다양한 모델에 접근하기
title: OpenRouter
x-i18n:
    generated_at: "2026-04-22T04:27:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a8d1e6191d98e3f5284ebc77e0b8b855a04f3fbed09786d6125b622333ac807
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter는 단일
endpoint와 API 키 뒤에서 많은 모델로 요청을 라우팅하는 **통합 API**를 제공합니다. OpenAI 호환이므로, 대부분의 OpenAI SDK는 base URL만 바꾸면 동작합니다.

## 시작하기

<Steps>
  <Step title="API 키 받기">
    [openrouter.ai/keys](https://openrouter.ai/keys)에서 API 키를 생성하세요.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(선택 사항) 특정 모델로 전환">
    온보딩은 기본적으로 `openrouter/auto`를 사용합니다. 나중에 구체적인 모델을 선택할 수 있습니다:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## 구성 예시

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## 모델 참조

<Note>
모델 ref는 `openrouter/<provider>/<model>` 패턴을 따릅니다. 사용 가능한
provider 및 모델의 전체 목록은 [/concepts/model-providers](/ko/concepts/model-providers)를 참조하세요.
</Note>

번들된 fallback 예시:

| Model ref                            | 참고                          |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto`                    | OpenRouter 자동 라우팅        |
| `openrouter/moonshotai/kimi-k2.6`    | MoonshotAI를 통한 Kimi K2.6   |
| `openrouter/openrouter/healer-alpha` | OpenRouter Healer Alpha 경로  |
| `openrouter/openrouter/hunter-alpha` | OpenRouter Hunter Alpha 경로  |

## 인증 및 헤더

OpenRouter는 내부적으로 API 키와 함께 Bearer token을 사용합니다.

실제 OpenRouter 요청(`https://openrouter.ai/api/v1`)에서는 OpenClaw가
OpenRouter 문서에 명시된 앱 attribution 헤더도 추가합니다:

| 헤더                      | 값                    |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
OpenRouter provider를 다른 프록시나 base URL로 다시 지정하면, OpenClaw는
해당 OpenRouter 전용 헤더나 Anthropic cache marker를 **주입하지 않습니다**.
</Warning>

## 고급 참고 사항

<AccordionGroup>
  <Accordion title="Anthropic cache marker">
    확인된 OpenRouter 경로에서는 Anthropic 모델 ref가
    system/developer prompt 블록에서 더 나은 prompt-cache 재사용을 위해 OpenClaw가 사용하는
    OpenRouter 전용 Anthropic `cache_control` marker를 유지합니다.
  </Accordion>

  <Accordion title="Thinking / reasoning 주입">
    지원되는 non-`auto` 경로에서는 OpenClaw가 선택된 thinking 수준을
    OpenRouter 프록시 reasoning payload로 매핑합니다. 지원되지 않는 모델 힌트와
    `openrouter/auto`는 해당 reasoning 주입을 건너뜁니다.
  </Accordion>

  <Accordion title="OpenAI 전용 요청 shaping">
    OpenRouter는 여전히 프록시 방식의 OpenAI 호환 경로를 통해 실행되므로,
    `serviceTier`, Responses `store`,
    OpenAI reasoning-compat payload, prompt-cache 힌트 같은 기본 OpenAI 전용 요청 shaping은 전달되지 않습니다.
  </Accordion>

  <Accordion title="Gemini 기반 경로">
    Gemini 기반 OpenRouter ref는 프록시-Gemini 경로에 그대로 남습니다. OpenClaw는
    그 경로에서 Gemini thought-signature 정리를 유지하지만, 기본 Gemini
    replay validation 또는 bootstrap rewrite는 활성화하지 않습니다.
  </Accordion>

  <Accordion title="Provider 라우팅 메타데이터">
    모델 params 아래에 OpenRouter provider 라우팅을 전달하면, OpenClaw는
    공통 스트림 래퍼가 실행되기 전에 이를 OpenRouter 라우팅 메타데이터로 전달합니다.
  </Accordion>
</AccordionGroup>

## 관련

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, fallback 동작 선택.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    agent, 모델, provider에 대한 전체 config 참조.
  </Card>
</CardGroup>
