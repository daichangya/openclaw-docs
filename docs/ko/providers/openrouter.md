---
read_when:
    - 여러 LLM에 대해 하나의 API key를 사용하려고 합니다.
    - OpenClaw에서 OpenRouter를 통해 모델을 실행하려고 합니다.
    - OpenRouter를 이미지 생성에 사용하려고 합니다.
summary: OpenClaw에서 OpenRouter의 통합 API를 사용해 다양한 모델에 액세스하기
title: OpenRouter
x-i18n:
    generated_at: "2026-04-24T06:32:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7516910f67a8adfb107d07cadd73c34ddd110422ecb90278025d4d6344937aac
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter는 단일 엔드포인트와 API key 뒤에서 많은 모델로 요청을 라우팅하는 **통합 API**를 제공합니다. OpenAI 호환이므로 대부분의 OpenAI SDK는 base URL만 바꾸면 동작합니다.

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
    온보딩은 기본적으로 `openrouter/auto`를 사용합니다. 나중에 구체적인 모델을 선택할 수 있습니다.

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## config 예시

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

## 모델 ref

<Note>
모델 ref는 `openrouter/<provider>/<model>` 패턴을 따릅니다. 사용 가능한 provider와 모델의 전체 목록은 [/concepts/model-providers](/ko/concepts/model-providers)를 참조하세요.
</Note>

번들 fallback 예시:

| Model ref                            | Notes                          |
| ------------------------------------ | ------------------------------ |
| `openrouter/auto`                    | OpenRouter 자동 라우팅         |
| `openrouter/moonshotai/kimi-k2.6`    | MoonshotAI를 통한 Kimi K2.6    |
| `openrouter/openrouter/healer-alpha` | OpenRouter Healer Alpha 경로   |
| `openrouter/openrouter/hunter-alpha` | OpenRouter Hunter Alpha 경로   |

## 이미지 생성

OpenRouter는 `image_generate` 도구의 백엔드로도 사용할 수 있습니다. `agents.defaults.imageGenerationModel` 아래에 OpenRouter 이미지 모델을 사용하세요.

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw는 이미지 요청을 OpenRouter의 chat completions 이미지 API로 `modalities: ["image", "text"]`와 함께 보냅니다. Gemini 이미지 모델에는 OpenRouter의 `image_config`를 통해 지원되는 `aspectRatio` 및 `resolution` 힌트가 전달됩니다.

## 인증 및 헤더

OpenRouter는 내부적으로 API key를 사용하는 Bearer token을 사용합니다.

실제 OpenRouter 요청(`https://openrouter.ai/api/v1`)에서는 OpenClaw가
OpenRouter 문서에 나온 앱 attribution 헤더도 추가합니다.

| Header                    | Value                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
OpenRouter provider의 base URL을 다른 프록시나 URL로 바꾸면, OpenClaw는
이러한 OpenRouter 전용 헤더나 Anthropic 캐시 마커를 **주입하지 않습니다**.
</Warning>

## 고급 구성

<AccordionGroup>
  <Accordion title="Anthropic 캐시 마커">
    확인된 OpenRouter 경로에서는 Anthropic 모델 ref가
    OpenClaw가 시스템/개발자 프롬프트 블록의 더 나은 프롬프트 캐시 재사용을 위해 사용하는
    OpenRouter 전용 Anthropic `cache_control` 마커를 유지합니다.
  </Accordion>

  <Accordion title="Thinking / reasoning 주입">
    지원되는 non-`auto` 경로에서는 OpenClaw가 선택된 thinking 수준을
    OpenRouter 프록시 reasoning 페이로드에 매핑합니다. 지원되지 않는 모델 힌트와
    `openrouter/auto`는 그 reasoning 주입을 건너뜁니다.
  </Accordion>

  <Accordion title="OpenAI 전용 요청 셰이핑">
    OpenRouter는 여전히 프록시 스타일 OpenAI 호환 경로를 사용하므로,
    `serviceTier`, Responses `store`,
    OpenAI reasoning-compat 페이로드, 프롬프트 캐시 힌트 같은
    네이티브 OpenAI 전용 요청 셰이핑은 전달되지 않습니다.
  </Accordion>

  <Accordion title="Gemini 기반 경로">
    Gemini 기반 OpenRouter ref는 프록시-Gemini 경로에 그대로 남습니다. OpenClaw는
    여기에서 Gemini thought-signature 정리를 유지하지만, 네이티브 Gemini
    replay 검증이나 bootstrap 재작성은 활성화하지 않습니다.
  </Accordion>

  <Accordion title="Provider 라우팅 메타데이터">
    모델 params 아래에 OpenRouter provider 라우팅을 전달하면, OpenClaw는 공통 stream wrapper가 실행되기 전에 이를 OpenRouter 라우팅 메타데이터로 전달합니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, failover 동작 선택.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    에이전트, 모델, provider에 대한 전체 config 참조.
  </Card>
</CardGroup>
