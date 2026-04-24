---
read_when:
    - OpenClaw와 함께 Vercel AI Gateway를 사용하고 싶으신 것입니다
    - API 키 env var 또는 CLI 인증 선택지가 필요합니다
summary: Vercel AI Gateway 설정(인증 + 모델 선택)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-24T06:33:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1fa1c3c6e44e40d7a1fc89d93ee268c19124b746d4644d58014157be7cceeb9
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

[Vercel AI Gateway](https://vercel.com/ai-gateway)는
단일 엔드포인트를 통해 수백 개의 모델에 접근할 수 있는 통합 API를 제공합니다.

| 속성 | 값 |
| ------------- | -------------------------------- |
| Provider | `vercel-ai-gateway` |
| 인증 | `AI_GATEWAY_API_KEY` |
| API | Anthropic Messages 호환 |
| 모델 카탈로그 | `/v1/models`를 통해 자동 검색 |

<Tip>
OpenClaw는 Gateway `/v1/models` 카탈로그를 자동 검색하므로
`/models vercel-ai-gateway`에는
`vercel-ai-gateway/openai/gpt-5.5` 및
`vercel-ai-gateway/moonshotai/kimi-k2.6` 같은 현재 모델 참조가 포함됩니다.
</Tip>

## 시작하기

<Steps>
  <Step title="API 키 설정">
    온보딩을 실행하고 AI Gateway 인증 옵션을 선택하세요:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="기본 모델 설정">
    OpenClaw 구성에 모델을 추가하세요:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="모델이 사용 가능한지 확인">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## 비대화형 예시

스크립트 또는 CI 설정에서는 모든 값을 명령줄로 전달하세요:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## 모델 ID 축약형

OpenClaw는 Vercel Claude 축약형 모델 참조를 받아 런타임에 정규화합니다:

| 축약 입력 | 정규화된 모델 참조 |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
구성에서는 축약형이나 완전한 모델 참조 중 어느 쪽이든 사용할 수 있습니다. OpenClaw가 정식 형태를 자동으로 확인합니다.
</Tip>

## 고급 구성

<AccordionGroup>
  <Accordion title="데몬 프로세스용 환경 변수">
    OpenClaw Gateway가 데몬(launchd/systemd)으로 실행되는 경우
    `AI_GATEWAY_API_KEY`가 해당 프로세스에서 사용 가능해야 합니다.

    <Warning>
    `~/.profile`에만 설정된 키는 해당 환경이 명시적으로 import되지 않는 한 launchd/systemd
    데몬에서 보이지 않습니다. Gateway 프로세스가 이를
    읽을 수 있도록 `~/.openclaw/.env` 또는 `env.shellEnv`를 통해 키를 설정하세요.
    </Warning>

  </Accordion>

  <Accordion title="Provider 라우팅">
    Vercel AI Gateway는 모델
    참조 접두사에 따라 업스트림 provider로 요청을 라우팅합니다. 예를 들어 `vercel-ai-gateway/anthropic/claude-opus-4.6`은
    Anthropic을 통해 라우팅되고, `vercel-ai-gateway/openai/gpt-5.5`는
    OpenAI로, `vercel-ai-gateway/moonshotai/kimi-k2.6`는
    MoonshotAI로 라우팅됩니다. 단일 `AI_GATEWAY_API_KEY`가 모든
    업스트림 provider에 대한 인증을 처리합니다.
  </Accordion>
</AccordionGroup>

## 관련

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 참조, 페일오버 동작 선택.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제 해결 및 FAQ.
  </Card>
</CardGroup>
