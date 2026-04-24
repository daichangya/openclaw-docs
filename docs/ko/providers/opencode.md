---
read_when:
    - OpenCode 호스팅 모델 접근을 원합니다
    - Zen과 Go 카탈로그 중에서 선택하려고 합니다
summary: OpenClaw에서 OpenCode Zen 및 Go 카탈로그 사용하기
title: OpenCode
x-i18n:
    generated_at: "2026-04-24T06:31:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: d59c82a46988ef7dbbc98895af34441a5b378e5110ea636104df5f9c3672e3f0
    source_path: providers/opencode.md
    workflow: 15
---

OpenCode는 OpenClaw에서 두 가지 호스팅 카탈로그를 노출합니다:

| 카탈로그 | 접두사 | 런타임 Provider |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...` | `opencode` |
| **Go** | `opencode-go/...` | `opencode-go` |

두 카탈로그 모두 동일한 OpenCode API 키를 사용합니다. OpenClaw는 업스트림 모델별 라우팅이 올바르게 유지되도록 런타임 Provider id를 분리하지만, 온보딩과 문서에서는 이를 하나의 OpenCode 설정으로 다룹니다.

## 시작하기

<Tabs>
  <Tab title="Zen 카탈로그">
    **적합한 경우:** 선별된 OpenCode 멀티모델 프록시(Claude, GPT, Gemini).

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        또는 키를 직접 전달:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Zen 모델을 기본값으로 설정">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go 카탈로그">
    **적합한 경우:** OpenCode가 호스팅하는 Kimi, GLM, MiniMax 라인업.

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        또는 키를 직접 전달:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Go 모델을 기본값으로 설정">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 구성 예시

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## 내장 카탈로그

### Zen

| 속성 | 값 |
| ---------------- | ----------------------------------------------------------------------- |
| 런타임 Provider | `opencode` |
| 예시 모델 | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| 속성 | 값 |
| ---------------- | ------------------------------------------------------------------------ |
| 런타임 Provider | `opencode-go` |
| 예시 모델 | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## 고급 구성

<AccordionGroup>
  <Accordion title="API 키 별칭">
    `OPENCODE_ZEN_API_KEY`도 `OPENCODE_API_KEY`의 별칭으로 지원됩니다.
  </Accordion>

  <Accordion title="공유 자격 증명">
    설정 중 OpenCode 키 하나를 입력하면 두 런타임 Provider 모두에 대한 자격 증명이 저장됩니다. 각 카탈로그를 따로 온보딩할 필요는 없습니다.
  </Accordion>

  <Accordion title="과금 및 대시보드">
    OpenCode에 로그인하고, 과금 정보를 추가하고, API 키를 복사합니다. 과금 및 카탈로그 제공 여부는 OpenCode 대시보드에서 관리됩니다.
  </Accordion>

  <Accordion title="Gemini replay 동작">
    Gemini 기반 OpenCode ref는 프록시 Gemini 경로에 남아 있으므로, OpenClaw는 네이티브 Gemini replay 검증이나 bootstrap 재작성은 활성화하지 않으면서 해당 경로에서 Gemini thought-signature 정리를 유지합니다.
  </Accordion>

  <Accordion title="비-Gemini replay 동작">
    비-Gemini OpenCode ref는 최소 OpenAI 호환 replay 정책을 유지합니다.
  </Accordion>
</AccordionGroup>

<Tip>
설정 중 OpenCode 키 하나를 입력하면 Zen과 Go 런타임 Provider 모두의 자격 증명이 저장되므로 한 번만 온보딩하면 됩니다.
</Tip>

## 관련 문서

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    Provider, 모델 ref, failover 동작 선택.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    에이전트, 모델, Provider에 대한 전체 구성 참조.
  </Card>
</CardGroup>
