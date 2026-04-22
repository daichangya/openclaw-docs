---
read_when:
    - OpenClaw와 함께 Vercel AI Gateway를 사용하려고 합니다
    - API 키 env var 또는 CLI 인증 방식을 알아야 합니다
summary: Vercel AI Gateway 설정(인증 + 모델 선택)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-22T04:27:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11c0f764d4c35633d0fbfc189bae0fc451dc799002fc1a6d0c84fc73842bbe31
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway)는 단일 엔드포인트를 통해 수백 개의 모델에 접근할 수 있는 통합 API를 제공합니다.

| 속성          | 값                               |
| ------------- | -------------------------------- |
| Provider      | `vercel-ai-gateway`              |
| 인증          | `AI_GATEWAY_API_KEY`             |
| API           | Anthropic Messages 호환          |
| 모델 카탈로그 | `/v1/models`를 통해 자동 발견됨 |

<Tip>
OpenClaw는 Gateway `/v1/models` 카탈로그를 자동으로 탐색하므로
`/models vercel-ai-gateway`에는
`vercel-ai-gateway/openai/gpt-5.4` 및
`vercel-ai-gateway/moonshotai/kimi-k2.6` 같은 최신 모델 ref가 포함됩니다.
</Tip>

## 시작하기

<Steps>
  <Step title="API 키 설정">
    온보딩을 실행하고 AI Gateway 인증 옵션을 선택하세요.

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="기본 모델 설정">
    OpenClaw config에 모델을 추가하세요.

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
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## 비대화형 예시

스크립트나 CI 설정의 경우, 모든 값을 명령줄에서 전달하세요.

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## 모델 ID 축약형

OpenClaw는 Vercel Claude 축약형 모델 ref를 받아들이며 runtime에서 이를 정규화합니다.

| 축약형 입력                        | 정규화된 모델 ref                            |
| ---------------------------------- | -------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
config에서는 축약형 또는 완전한 모델 ref 중 어느 쪽이든 사용할 수 있습니다.
OpenClaw가 표준 형식을 자동으로 확인합니다.
</Tip>

## 고급 참고

<AccordionGroup>
  <Accordion title="daemon 프로세스용 환경 변수">
    OpenClaw Gateway가 daemon(launchd/systemd)으로 실행되는 경우
    `AI_GATEWAY_API_KEY`를 해당 프로세스에서 사용할 수 있어야 합니다.

    <Warning>
    `~/.profile`에만 설정된 키는 해당 환경을 명시적으로 가져오지 않는 한
    launchd/systemd daemon에서는 보이지 않습니다. gateway 프로세스가
    이를 읽을 수 있도록 `~/.openclaw/.env` 또는 `env.shellEnv`에 키를 설정하세요.
    </Warning>

  </Accordion>

  <Accordion title="Provider 라우팅">
    Vercel AI Gateway는 모델 ref 접두사를 기준으로 요청을 업스트림 provider로 라우팅합니다.
    예를 들어 `vercel-ai-gateway/anthropic/claude-opus-4.6`은
    Anthropic을 통해 라우팅되고, `vercel-ai-gateway/openai/gpt-5.4`는
    OpenAI를 통해, `vercel-ai-gateway/moonshotai/kimi-k2.6`는
    MoonshotAI를 통해 라우팅됩니다. 단일 `AI_GATEWAY_API_KEY`가 모든
    업스트림 provider에 대한 인증을 처리합니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref 및 failover 동작 선택.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제 해결 및 FAQ.
  </Card>
</CardGroup>
