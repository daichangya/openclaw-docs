---
read_when:
    - OpenClaw를 LiteLLM 프록시를 통해 라우팅하고 싶습니다
    - LiteLLM을 통한 비용 추적, 로깅 또는 모델 라우팅이 필요합니다
summary: LiteLLM Proxy를 통해 OpenClaw를 실행하여 통합 모델 접근 및 비용 추적 사용하기
title: LiteLLM
x-i18n:
    generated_at: "2026-04-24T06:31:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9da14e6ded4c9e0b54989898a982987c0a60f6f6170d10b6cd2eddcd5106630f
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai)은 100개 이상의 모델 provider에 대한 통합 API를 제공하는 오픈소스 LLM Gateway입니다. OpenClaw를 LiteLLM을 통해 라우팅하면 비용 추적과 로깅을 중앙화하고, OpenClaw config를 바꾸지 않고도 백엔드를 유연하게 전환할 수 있습니다.

<Tip>
**OpenClaw와 함께 LiteLLM을 사용하는 이유는?**

- **비용 추적** — 모든 모델에서 OpenClaw가 정확히 얼마를 쓰는지 확인
- **모델 라우팅** — config 변경 없이 Claude, GPT-4, Gemini, Bedrock 간 전환
- **가상 키** — OpenClaw용 지출 한도가 있는 키 생성
- **로깅** — 디버깅을 위한 전체 요청/응답 로그
- **폴백** — 기본 provider가 다운되었을 때 자동 페일오버

</Tip>

## 빠른 시작

<Tabs>
  <Tab title="온보딩(권장)">
    **적합한 경우:** LiteLLM을 가장 빠르게 작동시키고 싶을 때

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="수동 설정">
    **적합한 경우:** 설치와 config를 완전히 직접 제어하고 싶을 때

    <Steps>
      <Step title="LiteLLM Proxy 시작">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="OpenClaw를 LiteLLM에 연결">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        이것으로 끝입니다. 이제 OpenClaw는 LiteLLM을 통해 라우팅됩니다.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 구성

### 환경 변수

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### config 파일

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## 고급 구성

<AccordionGroup>
  <Accordion title="가상 키">
    지출 한도가 있는 OpenClaw 전용 키를 생성하세요.

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    생성된 키를 `LITELLM_API_KEY`로 사용하세요.

  </Accordion>

  <Accordion title="모델 라우팅">
    LiteLLM은 모델 요청을 다른 백엔드로 라우팅할 수 있습니다. LiteLLM의 `config.yaml`에서 구성하세요.

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw는 계속 `claude-opus-4-6`을 요청하고, 라우팅은 LiteLLM이 처리합니다.

  </Accordion>

  <Accordion title="사용량 보기">
    LiteLLM의 대시보드나 API를 확인하세요.

    ```bash
    # 키 정보
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # 지출 로그
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="프록시 동작 참고">
    - LiteLLM은 기본적으로 `http://localhost:4000`에서 실행됩니다
    - OpenClaw는 LiteLLM의 프록시 스타일 OpenAI 호환 `/v1`
      엔드포인트를 통해 연결합니다
    - 네이티브 OpenAI 전용 요청 형식 조정은 LiteLLM 경유 시 적용되지 않습니다:
      `service_tier` 없음, Responses `store` 없음, prompt-cache 힌트 없음,
      OpenAI reasoning 호환 페이로드 형식 조정 없음
    - 숨겨진 OpenClaw attribution 헤더(`originator`, `version`, `User-Agent`)는
      사용자 지정 LiteLLM base URL에는 주입되지 않습니다
  </Accordion>
</AccordionGroup>

<Note>
일반적인 provider 구성과 페일오버 동작은 [Model Providers](/ko/concepts/model-providers)를 참조하세요.
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="LiteLLM 문서" href="https://docs.litellm.ai" icon="book">
    공식 LiteLLM 문서 및 API 참조
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    모든 provider, 모델 ref, 페일오버 동작 개요
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    전체 config 참조
  </Card>
  <Card title="모델 선택" href="/ko/concepts/models" icon="brain">
    모델을 선택하고 구성하는 방법
  </Card>
</CardGroup>
