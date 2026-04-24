---
read_when:
    - OpenClaw와 함께 Cloudflare AI Gateway를 사용하려고 합니다.
    - 계정 ID, Gateway ID 또는 API key env var가 필요합니다.
summary: Cloudflare AI Gateway 설정(인증 + 모델 선택)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-24T06:30:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb10ef4bd92db88b2b3dac1773439ab2ba37916a72d1925995d74ef787fa1c8b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

Cloudflare AI Gateway는 provider API 앞단에 위치하며 분석, 캐싱, 제어 기능을 추가할 수 있게 합니다. Anthropic의 경우 OpenClaw는 Gateway 엔드포인트를 통해 Anthropic Messages API를 사용합니다.

| Property      | Value                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------- |
| Provider      | `cloudflare-ai-gateway`                                                                   |
| Base URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Default model | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                 |
| API key       | `CLOUDFLARE_AI_GATEWAY_API_KEY` (Gateway를 통한 요청에 사용하는 provider API key)         |

<Note>
Cloudflare AI Gateway를 통해 라우팅되는 Anthropic 모델에는 provider key로 **Anthropic API key**를 사용하세요.
</Note>

## 시작하기

<Steps>
  <Step title="provider API key와 Gateway 세부 정보 설정">
    온보딩을 실행하고 Cloudflare AI Gateway 인증 옵션을 선택하세요.

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    그러면 계정 ID, gateway ID, API key를 입력하라는 프롬프트가 나타납니다.

  </Step>
  <Step title="기본 모델 설정">
    OpenClaw config에 모델을 추가하세요.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
        },
      },
    }
    ```

  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## 비대화형 예시

스크립트나 CI 설정에서는 모든 값을 명령줄로 전달하세요.

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## 고급 구성

<AccordionGroup>
  <Accordion title="인증된 Gateway">
    Cloudflare에서 Gateway 인증을 활성화했다면 `cf-aig-authorization` 헤더를 추가하세요. 이는 provider API key와 **별도로 추가**되는 것입니다.

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    `cf-aig-authorization` 헤더는 Cloudflare Gateway 자체에 인증하고, provider API key(예: Anthropic key)는 업스트림 provider에 인증합니다.
    </Tip>

  </Accordion>

  <Accordion title="환경 참고">
    Gateway가 daemon(launchd/systemd)으로 실행된다면 `CLOUDFLARE_AI_GATEWAY_API_KEY`가 해당 프로세스에서 사용 가능해야 합니다.

    <Warning>
    키가 `~/.profile`에만 있으면 launchd/systemd daemon에는 도움이 되지 않습니다. 해당 환경도 거기에 가져와야 하기 때문입니다. gateway 프로세스가 읽을 수 있도록 키를 `~/.openclaw/.env` 또는 `env.shellEnv`에 설정하세요.
    </Warning>

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, failover 동작 선택.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반 문제 해결 및 FAQ.
  </Card>
</CardGroup>
