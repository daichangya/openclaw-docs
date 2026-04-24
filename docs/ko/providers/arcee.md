---
read_when:
    - OpenClaw에서 Arcee AI를 사용하려고 합니다
    - API 키 환경 변수 또는 CLI 인증 선택이 필요합니다
summary: Arcee AI 설정(인증 + 모델 선택)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-24T06:29:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54989e1706901fedc8a0c816ca7ee7f877fa4b973697540dd90cb9182420043f
    source_path: providers/arcee.md
    workflow: 15
---

[Arcee AI](https://arcee.ai)는 OpenAI 호환 API를 통해 Trinity 계열 mixture-of-experts 모델에 대한 접근을 제공합니다. 모든 Trinity 모델은 Apache 2.0 라이선스를 사용합니다.

Arcee AI 모델은 Arcee 플랫폼을 통해 직접 접근하거나 [OpenRouter](/ko/providers/openrouter)를 통해 접근할 수 있습니다.

| Property | Value                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Provider | `arcee`                                                                               |
| Auth     | `ARCEEAI_API_KEY` (직접) 또는 `OPENROUTER_API_KEY` (OpenRouter 경유)                  |
| API      | OpenAI 호환                                                                           |
| Base URL | `https://api.arcee.ai/api/v1` (직접) 또는 `https://openrouter.ai/api/v1` (OpenRouter) |

## 시작하기

<Tabs>
  <Tab title="직접(Arcee 플랫폼)">
    <Steps>
      <Step title="API 키 받기">
        [Arcee AI](https://chat.arcee.ai/)에서 API 키를 생성합니다.
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="기본 모델 설정">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="OpenRouter 경유">
    <Steps>
      <Step title="API 키 받기">
        [OpenRouter](https://openrouter.ai/keys)에서 API 키를 생성합니다.
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="기본 모델 설정">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        동일한 모델 ref를 직접 설정과 OpenRouter 설정 모두에 사용할 수 있습니다(예: `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 비대화형 설정

<Tabs>
  <Tab title="직접(Arcee 플랫폼)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="OpenRouter 경유">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## 내장 카탈로그

현재 OpenClaw는 다음 번들 Arcee 카탈로그를 제공합니다.

| Model ref                      | Name                   | Input | Context | Cost (in/out per 1M) | Notes                                    |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ---------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | 기본 모델; reasoning 활성화              |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | 범용 목적; 400B params, 13B active       |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | 빠르고 비용 효율적; function calling 지원 |

<Tip>
온보딩 프리셋은 `arcee/trinity-large-thinking`을 기본 모델로 설정합니다.
</Tip>

## 지원 기능

| Feature                                       | Supported                    |
| --------------------------------------------- | ---------------------------- |
| Streaming                                     | 예                           |
| Tool use / function calling                   | 예                           |
| Structured output (JSON mode and JSON schema) | 예                           |
| Extended thinking                             | 예 (Trinity Large Thinking)  |

<AccordionGroup>
  <Accordion title="환경 참고">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우, 해당 프로세스에서
    `ARCEEAI_API_KEY`(또는 `OPENROUTER_API_KEY`)를 사용할 수 있어야 합니다(예:
    `~/.openclaw/.env` 또는 `env.shellEnv`).
  </Accordion>

  <Accordion title="OpenRouter 라우팅">
    OpenRouter를 통해 Arcee 모델을 사용할 때도 동일한 `arcee/*` 모델 ref가 적용됩니다.
    OpenClaw는 선택한 인증 방식에 따라 라우팅을 투명하게 처리합니다. OpenRouter 전용
    구성 세부 사항은 [OpenRouter provider 문서](/ko/providers/openrouter)를 참조하세요.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/ko/providers/openrouter" icon="shuffle">
    단일 API 키를 통해 Arcee 모델과 그 외 여러 모델에 접근합니다.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, failover 동작 선택하기.
  </Card>
</CardGroup>
