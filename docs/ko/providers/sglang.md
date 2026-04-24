---
read_when:
    - 로컬 SGLang 서버에 대해 OpenClaw를 실행하고 싶으신 것입니다
    - 자체 모델과 함께 OpenAI 호환 `/v1` 엔드포인트를 원하시는 것입니다
summary: SGLang(OpenAI 호환 자체 호스팅 서버)으로 OpenClaw 실행하기
title: SGLang
x-i18n:
    generated_at: "2026-04-24T06:32:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8ed6767f85bcf099fb25dfe72a48b8a09e04ba13212125651616d2d93607beba
    source_path: providers/sglang.md
    workflow: 15
---

SGLang는 **OpenAI 호환** HTTP API를 통해 오픈소스 모델을 제공할 수 있습니다.
OpenClaw는 `openai-completions` API를 사용해 SGLang에 연결할 수 있습니다.

OpenClaw는 `SGLANG_API_KEY`로 옵트인하면(서버가 인증을 강제하지 않는 경우 어떤 값이든 가능)
사용 가능한 SGLang 모델도 **자동 검색**할 수 있으며,
이때 명시적인 `models.providers.sglang` 항목이 없어야 합니다.

OpenClaw는 `sglang`을 스트리밍 사용량 집계를 지원하는 로컬 OpenAI 호환 provider로 취급하므로, 상태/컨텍스트 토큰 수는
`stream_options.include_usage` 응답에서 업데이트될 수 있습니다.

## 시작하기

<Steps>
  <Step title="SGLang 시작">
    OpenAI 호환 서버로 SGLang를 실행하세요. base URL은
    `/v1` 엔드포인트(예: `/v1/models`, `/v1/chat/completions`)를 노출해야 합니다. SGLang는 보통 다음에서 실행됩니다:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="API 키 설정">
    서버에 인증이 구성되지 않은 경우 어떤 값이든 동작합니다:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="온보딩 실행 또는 모델 직접 설정">
    ```bash
    openclaw onboard
    ```

    또는 모델을 수동으로 구성하세요:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## 모델 검색(암시적 provider)

`SGLANG_API_KEY`가 설정되어 있거나(auth profile이 있거나) **그리고**
`models.providers.sglang`을 정의하지 않은 경우 OpenClaw는 다음을 쿼리합니다:

- `GET http://127.0.0.1:30000/v1/models`

그리고 반환된 ID를 모델 항목으로 변환합니다.

<Note>
`models.providers.sglang`을 명시적으로 설정하면 자동 검색은 건너뛰며,
모델을 수동으로 정의해야 합니다.
</Note>

## 명시적 구성(수동 모델)

다음 경우에는 명시적 구성을 사용하세요:

- SGLang가 다른 호스트/포트에서 실행되는 경우
- `contextWindow`/`maxTokens` 값을 고정하고 싶은 경우
- 서버에 실제 API 키가 필요하거나(또는 헤더를 직접 제어하고 싶은 경우)

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 고급 구성

<AccordionGroup>
  <Accordion title="프록시 스타일 동작">
    SGLang는 네이티브 OpenAI 엔드포인트가 아니라 프록시 스타일 OpenAI 호환 `/v1` 백엔드로 취급됩니다.

    | 동작 | SGLang |
    |----------|--------|
    | OpenAI 전용 요청 shaping | 적용되지 않음 |
    | `service_tier`, Responses `store`, prompt-cache 힌트 | 전송되지 않음 |
    | Reasoning 호환 페이로드 shaping | 적용되지 않음 |
    | 숨겨진 attribution 헤더 (`originator`, `version`, `User-Agent`) | 사용자 정의 SGLang base URL에는 주입되지 않음 |

  </Accordion>

  <Accordion title="문제 해결">
    **서버에 도달할 수 없음**

    서버가 실행 중이고 응답하는지 확인하세요:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **인증 오류**

    요청이 인증 오류와 함께 실패하면 서버 구성과 일치하는 실제 `SGLANG_API_KEY`를 설정하거나
    `models.providers.sglang` 아래에 provider를 명시적으로 구성하세요.

    <Tip>
    인증 없이 SGLang를 실행하는 경우,
    비어 있지 않은 `SGLANG_API_KEY` 값이면 모델 검색에 옵트인하기에 충분합니다.
    </Tip>

  </Accordion>
</AccordionGroup>

## 관련

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 참조, 페일오버 동작 선택.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    provider 항목을 포함한 전체 구성 스키마.
  </Card>
</CardGroup>
