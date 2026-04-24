---
read_when:
    - OpenClaw에서 GLM 모델을 사용하려는 경우
    - 모델 이름 규칙과 설정이 필요한 경우
summary: GLM 모델 계열 개요 및 OpenClaw에서 사용하는 방법
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-04-24T06:30:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0272f0621559c0aba2c939dc52771ac2c94a20f9f7201c1f71d80a9c2197c7e7
    source_path: providers/glm.md
    workflow: 15
---

# GLM 모델

GLM은 **모델 계열**이며(회사가 아님) Z.AI 플랫폼을 통해 제공됩니다. OpenClaw에서 GLM
모델은 `zai` provider와 `zai/glm-5` 같은 모델 ID를 통해 액세스합니다.

## 시작하기

<Steps>
  <Step title="인증 경로를 선택하고 온보딩 실행">
    Z.AI 플랜과 지역에 맞는 온보딩 선택지를 고르세요.

    | 인증 선택지 | 가장 적합한 경우 |
    | ----------- | ---------------- |
    | `zai-api-key` | 엔드포인트 자동 감지가 포함된 일반 API-key 설정 |
    | `zai-coding-global` | Coding Plan 사용자(글로벌) |
    | `zai-coding-cn` | Coding Plan 사용자(중국 지역) |
    | `zai-global` | 일반 API(글로벌) |
    | `zai-cn` | 일반 API(중국 지역) |

    ```bash
    # 예: 일반 자동 감지
    openclaw onboard --auth-choice zai-api-key

    # 예: Coding Plan 글로벌
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="GLM을 기본 모델로 설정">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Config 예시

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
`zai-api-key`를 사용하면 OpenClaw가 키에서 일치하는 Z.AI 엔드포인트를 감지하고
올바른 base URL을 자동으로 적용합니다. 특정 Coding Plan 또는 일반 API 표면을 강제로 지정하려면
명시적인 지역 선택지를 사용하세요.
</Tip>

## 내장 카탈로그

OpenClaw는 현재 번들 `zai` provider에 다음 GLM ref를 기본으로 제공합니다.

| 모델            | 모델             |
| --------------- | ---------------- |
| `glm-5.1`       | `glm-4.7`        |
| `glm-5`         | `glm-4.7-flash`  |
| `glm-5-turbo`   | `glm-4.7-flashx` |
| `glm-5v-turbo`  | `glm-4.6`        |
| `glm-4.5`       | `glm-4.6v`       |
| `glm-4.5-air`   |                  |
| `glm-4.5-flash` |                  |
| `glm-4.5v`      |                  |

<Note>
기본 번들 모델 ref는 `zai/glm-5.1`입니다. GLM 버전과 사용 가능 여부는
바뀔 수 있으므로 최신 정보는 Z.AI 문서를 확인하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="엔드포인트 자동 감지">
    `zai-api-key` 인증 선택지를 사용하면 OpenClaw가 키 형식을 검사해
    올바른 Z.AI base URL을 결정합니다. 명시적인 지역 선택지
    (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`)는
    자동 감지를 재정의하고 엔드포인트를 직접 고정합니다.
  </Accordion>

  <Accordion title="Provider 세부 정보">
    GLM 모델은 `zai` 런타임 provider를 통해 제공됩니다. 전체 provider
    구성, 지역 엔드포인트, 추가 capability는
    [Z.AI provider 문서](/ko/providers/zai)를 참조하세요.
  </Accordion>
</AccordionGroup>

## 관련

<CardGroup cols={2}>
  <Card title="Z.AI provider" href="/ko/providers/zai" icon="server">
    전체 Z.AI provider 구성 및 지역 엔드포인트.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, model ref, failover 동작 선택하기.
  </Card>
</CardGroup>
