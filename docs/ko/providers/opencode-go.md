---
read_when:
    - OpenCode Go 카탈로그가 필요합니다
    - Go 호스팅 모델용 런타임 모델 ref가 필요합니다
summary: 공유 OpenCode 설정으로 OpenCode Go 카탈로그를 사용합니다
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-22T04:27:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb03bc609f0dfff2981eac13b67cbcae066184f4606ce54ba24ca6a5737fdae8
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go는 [OpenCode](/ko/providers/opencode) 내부의 Go 카탈로그입니다.
Zen 카탈로그와 동일한 `OPENCODE_API_KEY`를 사용하지만, 업스트림 모델별 라우팅이 올바르게 유지되도록 런타임
provider ID는 `opencode-go`를 유지합니다.

| 속성 | 값 |
| ---------------- | ------------------------------- |
| 런타임 provider | `opencode-go`                   |
| 인증             | `OPENCODE_API_KEY`              |
| 상위 설정     | [OpenCode](/ko/providers/opencode) |

## 지원되는 모델

OpenClaw는 번들 pi 모델 레지스트리에서 Go 카탈로그를 가져옵니다. 현재 모델 목록은
`openclaw models list --provider opencode-go`를 실행하세요.

번들 pi 카탈로그 기준으로 현재 provider에는 다음이 포함됩니다:

| 모델 ref | 이름 |
| -------------------------- | --------------------- |
| `opencode-go/glm-5`        | GLM-5                 |
| `opencode-go/glm-5.1`      | GLM-5.1               |
| `opencode-go/kimi-k2.5`    | Kimi K2.5             |
| `opencode-go/kimi-k2.6`    | Kimi K2.6 (한도 3배) |
| `opencode-go/mimo-v2-omni` | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`  | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5` | MiniMax M2.5          |
| `opencode-go/minimax-m2.7` | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus          |

## 시작하기

<Tabs>
  <Tab title="대화형">
    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice opencode-go
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

  <Tab title="비대화형">
    <Steps>
      <Step title="키 직접 전달">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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

## config 예제

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## 고급 참고

<AccordionGroup>
  <Accordion title="라우팅 동작">
    모델 ref가 `opencode-go/...`를 사용할 때 OpenClaw는 모델별 라우팅을 자동으로 처리합니다.
    추가 provider config는 필요하지 않습니다.
  </Accordion>

  <Accordion title="런타임 ref 규칙">
    런타임 ref는 명시적으로 유지됩니다. Zen은 `opencode/...`, Go는 `opencode-go/...`를 사용합니다.
    이렇게 하면 두 카탈로그 모두에서 업스트림 모델별 라우팅이 올바르게 유지됩니다.
  </Accordion>

  <Accordion title="공유 자격 증명">
    Zen 및 Go 카탈로그 모두 동일한 `OPENCODE_API_KEY`를 사용합니다. 설정 중
    키를 입력하면 두 런타임 provider 모두에 대한 자격 증명이 저장됩니다.
  </Accordion>
</AccordionGroup>

<Tip>
공통 온보딩 개요와 전체
Zen + Go 카탈로그 참조는 [OpenCode](/ko/providers/opencode)를 참고하세요.
</Tip>

## 관련 항목

<CardGroup cols={2}>
  <Card title="OpenCode (상위)" href="/ko/providers/opencode" icon="server">
    공통 온보딩, 카탈로그 개요, 고급 참고입니다.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, 장애 조치 동작 선택.
  </Card>
</CardGroup>
