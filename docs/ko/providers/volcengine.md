---
read_when:
    - OpenClaw에서 Volcano Engine 또는 Doubao 모델을 사용하고 싶습니다
    - Volcengine API 키 설정이 필요합니다
summary: Volcano Engine 설정(Doubao 모델, 범용 + 코딩 엔드포인트)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-24T06:33:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6091da50fbab3a01cdc4337a496f361987f1991a2e2b7764e7a9c8c464e9757a
    source_path: providers/volcengine.md
    workflow: 15
---

Volcengine provider는 Volcano Engine에 호스팅된 Doubao 모델과 서드파티 모델에 접근할 수 있게 하며, 범용 워크로드와 코딩 워크로드에 대해 별도의 엔드포인트를 제공합니다.

| 세부 정보 | 값                                                    |
| --------- | ----------------------------------------------------- |
| Provider  | `volcengine` (범용) + `volcengine-plan` (코딩)       |
| 인증      | `VOLCANO_ENGINE_API_KEY`                              |
| API       | OpenAI 호환                                           |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    대화형 온보딩 실행:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    이렇게 하면 하나의 API 키로 범용(`volcengine`)과 코딩(`volcengine-plan`) provider를 모두 등록합니다.

  </Step>
  <Step title="기본 모델 설정">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
비대화형 설정(CI, 스크립팅)에는 키를 직접 전달하세요:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Provider 및 엔드포인트

| Provider           | 엔드포인트                                 | 사용 사례     |
| ------------------ | ------------------------------------------ | ------------- |
| `volcengine`       | `ark.cn-beijing.volces.com/api/v3`         | 범용 모델     |
| `volcengine-plan`  | `ark.cn-beijing.volces.com/api/coding/v3`  | 코딩 모델     |

<Note>
두 provider 모두 하나의 API 키로 구성됩니다. 설정 시 둘 다 자동으로 등록됩니다.
</Note>

## 내장 카탈로그

<Tabs>
  <Tab title="범용 (volcengine)">
    | 모델 참조                                     | 이름                              | 입력        | 컨텍스트 |
    | --------------------------------------------- | --------------------------------- | ----------- | -------- |
    | `volcengine/doubao-seed-1-8-251228`           | Doubao Seed 1.8                   | text, image | 256,000  |
    | `volcengine/doubao-seed-code-preview-251028`  | doubao-seed-code-preview-251028   | text, image | 256,000  |
    | `volcengine/kimi-k2-5-260127`                 | Kimi K2.5                         | text, image | 256,000  |
    | `volcengine/glm-4-7-251222`                   | GLM 4.7                           | text, image | 200,000  |
    | `volcengine/deepseek-v3-2-251201`             | DeepSeek V3.2                     | text, image | 128,000  |
  </Tab>
  <Tab title="코딩 (volcengine-plan)">
    | 모델 참조                                          | 이름                       | 입력 | 컨텍스트 |
    | -------------------------------------------------- | -------------------------- | ---- | -------- |
    | `volcengine-plan/ark-code-latest`                  | Ark Coding Plan            | text | 256,000  |
    | `volcengine-plan/doubao-seed-code`                 | Doubao Seed Code           | text | 256,000  |
    | `volcengine-plan/glm-4.7`                          | GLM 4.7 Coding             | text | 200,000  |
    | `volcengine-plan/kimi-k2-thinking`                 | Kimi K2 Thinking           | text | 256,000  |
    | `volcengine-plan/kimi-k2.5`                        | Kimi K2.5 Coding           | text | 256,000  |
    | `volcengine-plan/doubao-seed-code-preview-251028`  | Doubao Seed Code Preview   | text | 256,000  |
  </Tab>
</Tabs>

## 고급 구성

<AccordionGroup>
  <Accordion title="온보딩 후 기본 모델">
    `openclaw onboard --auth-choice volcengine-api-key`는 현재
    일반 `volcengine` 카탈로그도 등록하면서 기본 모델로
    `volcengine-plan/ark-code-latest`를 설정합니다.
  </Accordion>

  <Accordion title="모델 선택기 폴백 동작">
    온보딩/구성 모델 선택 중 Volcengine 인증 선택은
    `volcengine/*`와 `volcengine-plan/*` 행을 모두 우선합니다. 해당 모델이
    아직 로드되지 않았다면 OpenClaw는 빈 provider 범위 선택기를 보여주는 대신
    필터링되지 않은 카탈로그로 폴백합니다.
  </Accordion>

  <Accordion title="데몬 프로세스용 환경 변수">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우,
    `VOLCANO_ENGINE_API_KEY`가 해당 프로세스에서 사용 가능해야 합니다(예:
    `~/.openclaw/.env` 또는 `env.shellEnv` 사용).
  </Accordion>
</AccordionGroup>

<Warning>
OpenClaw를 백그라운드 서비스로 실행할 때, 대화형 셸에 설정한 환경 변수는
자동으로 상속되지 않습니다. 위의 데몬 참고를 보세요.
</Warning>

## 관련

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 참조, failover 동작 선택하기.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    에이전트, 모델, provider에 대한 전체 구성 참조.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 디버깅 단계.
  </Card>
  <Card title="FAQ" href="/ko/help/faq" icon="circle-question">
    OpenClaw 설정에 대한 자주 묻는 질문.
  </Card>
</CardGroup>
