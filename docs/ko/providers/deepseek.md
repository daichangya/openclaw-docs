---
read_when:
    - OpenClaw와 함께 DeepSeek를 사용하려고 합니다
    - API 키 env var 또는 CLI auth choice가 필요합니다
summary: DeepSeek 설정(인증 + 모델 선택)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T06:30:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: ead407c67c05bd8700db1cba36defdd9d47bdc9a071c76a07c4b4fb82f6b80e2
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com)는 OpenAI 호환 API를 갖춘 강력한 AI 모델을 제공합니다.

| 속성 | 값 |
| -------- | -------------------------- |
| Provider | `deepseek` |
| 인증 | `DEEPSEEK_API_KEY` |
| API | OpenAI 호환 |
| Base URL | `https://api.deepseek.com` |

## 시작하기

<Steps>
  <Step title="API 키 받기">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys)에서 API 키를 생성하세요.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    그러면 API 키 입력을 요청하고 `deepseek/deepseek-chat`을 기본 모델로 설정합니다.

  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="비대화형 설정">
    스크립트형 또는 헤드리스 설치의 경우 모든 플래그를 직접 전달하세요:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Gateway가 데몬(launchd/systemd)으로 실행되는 경우 `DEEPSEEK_API_KEY`가 해당 프로세스에서 사용 가능해야 합니다(예: `~/.openclaw/.env` 또는 `env.shellEnv`를 통해).
</Warning>

## 내장 카탈로그

| 모델 ref | 이름 | 입력 | 컨텍스트 | 최대 출력 | 참고 |
| ---------------------------- | ----------------- | ----- | ------- | ---------- | ------------------------------------------------- |
| `deepseek/deepseek-chat` | DeepSeek Chat | text | 131,072 | 8,192 | 기본 모델; DeepSeek V3.2 비추론 표면 |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text | 131,072 | 65,536 | 추론 활성화된 V3.2 표면 |

<Tip>
현재 두 번들 모델 모두 소스에서 스트리밍 사용량 호환성을 광고합니다.
</Tip>

## 구성 예시

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-chat" },
    },
  },
}
```

## 관련 문서

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    Provider, 모델 ref, failover 동작 선택.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    에이전트, 모델, Provider에 대한 전체 구성 참조.
  </Card>
</CardGroup>
