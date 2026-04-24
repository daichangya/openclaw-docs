---
read_when:
    - OpenClaw와 함께 Groq를 사용하고 싶으신 것입니다
    - API 키 env var 또는 CLI 인증 선택지가 필요합니다
summary: Groq 설정(인증 + 모델 선택)
title: Groq
x-i18n:
    generated_at: "2026-04-24T06:30:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c711297d42dea7fabe8ba941f75ef9dc82bd9b838f78d5dc4385210d9f65ade
    source_path: providers/groq.md
    workflow: 15
---

[Groq](https://groq.com)는 맞춤형 LPU 하드웨어를 사용해 오픈소스 모델
(Llama, Gemma, Mistral 등)에 대한 초고속 추론을 제공합니다. OpenClaw는
Groq의 OpenAI 호환 API를 통해 Groq에 연결합니다.

| 속성 | 값 |
| -------- | ----------------- |
| Provider | `groq` |
| 인증 | `GROQ_API_KEY` |
| API | OpenAI 호환 |

## 시작하기

<Steps>
  <Step title="API 키 받기">
    [console.groq.com/keys](https://console.groq.com/keys)에서 API 키를 생성하세요.
  </Step>
  <Step title="API 키 설정">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="기본 모델 설정">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
</Steps>

### 구성 파일 예시

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## 내장 카탈로그

Groq의 모델 카탈로그는 자주 변경됩니다. 현재 사용 가능한 모델을 보려면 `openclaw models list | grep groq`를 실행하거나
[console.groq.com/docs/models](https://console.groq.com/docs/models)를 확인하세요.

| 모델 | 참고 |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | 범용, 큰 컨텍스트 |
| **Llama 3.1 8B Instant** | 빠르고 가벼움 |
| **Gemma 2 9B** | 소형, 효율적 |
| **Mixtral 8x7B** | MoE 아키텍처, 강한 추론 |

<Tip>
계정에서 사용 가능한 최신 모델 목록은
`openclaw models list --provider groq`를 사용하세요.
</Tip>

## 오디오 전사

Groq는 빠른 Whisper 기반 오디오 전사도 제공합니다. 미디어 이해 provider로 구성되면 OpenClaw는 공유 `tools.media.audio`
표면을 통해 Groq의 `whisper-large-v3-turbo`
모델을 사용해 음성 메시지를 전사합니다.

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="오디오 전사 세부 정보">
    | 속성 | 값 |
    |----------|-------|
    | 공유 구성 경로 | `tools.media.audio` |
    | 기본 base URL | `https://api.groq.com/openai/v1` |
    | 기본 모델 | `whisper-large-v3-turbo` |
    | API 엔드포인트 | OpenAI 호환 `/audio/transcriptions` |
  </Accordion>

  <Accordion title="환경 참고">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우 `GROQ_API_KEY`가 해당 프로세스에서
    사용 가능하도록 하세요(예: `~/.openclaw/.env` 또는
    `env.shellEnv`를 통해).

    <Warning>
    대화형 셸에만 설정된 키는 데몬이 관리하는
    Gateway 프로세스에서 보이지 않습니다. 지속적인 사용 가능성을 위해 `~/.openclaw/.env` 또는 `env.shellEnv` 구성을 사용하세요.
    </Warning>

  </Accordion>
</AccordionGroup>

## 관련

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 참조, 페일오버 동작 선택.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    provider 및 오디오 설정을 포함한 전체 구성 스키마.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 대시보드, API 문서, 가격.
  </Card>
  <Card title="Groq 모델 목록" href="https://console.groq.com/docs/models" icon="list">
    공식 Groq 모델 카탈로그.
  </Card>
</CardGroup>
