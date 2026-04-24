---
read_when:
    - 로컬 inferrs 서버에 대해 OpenClaw를 실행하고 싶습니다
    - inferrs를 통해 Gemma 또는 다른 모델을 서빙하고 있습니다
    - inferrs용 정확한 OpenClaw 호환 플래그가 필요합니다
summary: inferrs(OpenAI 호환 로컬 서버)를 통해 OpenClaw 실행하기
title: Inferrs
x-i18n:
    generated_at: "2026-04-24T06:31:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53547c48febe584cf818507b0bf879db0471c575fa8a3ebfec64c658a7090675
    source_path: providers/inferrs.md
    workflow: 15
---

[inferrs](https://github.com/ericcurtin/inferrs)는
OpenAI 호환 `/v1` API 뒤에서 로컬 모델을 서빙할 수 있습니다. OpenClaw는 일반적인
`openai-completions` 경로를 통해 `inferrs`와 동작합니다.

현재 `inferrs`는 전용 OpenClaw provider Plugin이 아니라,
커스텀 셀프 호스팅 OpenAI 호환 백엔드로 취급하는 것이 가장 좋습니다.

## 시작하기

<Steps>
  <Step title="모델과 함께 inferrs 시작">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="서버 접근 가능 여부 확인">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="OpenClaw provider 항목 추가">
    명시적인 provider 항목을 추가하고 기본 모델을 여기에 맞추세요. 전체 구성 예시는 아래를 참조하세요.
  </Step>
</Steps>

## 전체 구성 예시

이 예시는 로컬 `inferrs` 서버에서 Gemma 4를 사용합니다.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## 고급 구성

<AccordionGroup>
  <Accordion title="requiresStringContent가 중요한 이유">
    일부 `inferrs` Chat Completions 경로는 구조화된 content-part 배열이 아니라 문자열
    `messages[].content`만 허용합니다.

    <Warning>
    OpenClaw 실행이 다음과 같은 오류로 실패한다면:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    모델 항목에 `compat.requiresStringContent: true`를 설정하세요.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    그러면 OpenClaw는 요청을 보내기 전에 순수 텍스트 content part를 일반 문자열로 평탄화합니다.

  </Accordion>

  <Accordion title="Gemma와 tool-schema 주의 사항">
    현재 일부 `inferrs` + Gemma 조합은 작은 직접
    `/v1/chat/completions` 요청은 받아들이지만, 전체 OpenClaw 에이전트 런타임
    턴에서는 여전히 실패할 수 있습니다.

    이런 경우 먼저 다음을 시도하세요:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    이렇게 하면 해당 모델에 대한 OpenClaw의 도구 스키마 표면이 비활성화되어,
    더 엄격한 로컬 백엔드에서 프롬프트 압박을 줄일 수 있습니다.

    작은 직접 요청은 계속 동작하지만 일반 OpenClaw 에이전트 턴이 계속
    `inferrs` 내부에서 충돌한다면, 남은 문제는 보통 OpenClaw 전송 계층이 아니라
    업스트림 모델/서버 동작입니다.

  </Accordion>

  <Accordion title="수동 스모크 테스트">
    구성이 끝나면 두 계층을 모두 테스트하세요:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    첫 번째 명령은 동작하지만 두 번째가 실패한다면 아래 문제 해결 섹션을 확인하세요.

  </Accordion>

  <Accordion title="프록시 스타일 동작">
    `inferrs`는 네이티브 OpenAI 엔드포인트가 아니라,
    프록시 스타일 OpenAI 호환 `/v1` 백엔드로 취급됩니다.

    - 네이티브 OpenAI 전용 요청 형상화는 여기에 적용되지 않음
    - `service_tier`, Responses `store`, 프롬프트 캐시 힌트, OpenAI 추론 호환 payload 형상화 없음
    - 숨겨진 OpenClaw attribution 헤더(`originator`, `version`, `User-Agent`)는
      커스텀 `inferrs` base URL에 주입되지 않음

  </Accordion>
</AccordionGroup>

## 문제 해결

<AccordionGroup>
  <Accordion title="curl /v1/models가 실패함">
    `inferrs`가 실행 중이 아니거나, 접근할 수 없거나, 예상한
    host/port에 바인드되지 않았습니다. 서버가 시작되었고 구성한 주소에서
    수신 중인지 확인하세요.
  </Accordion>

  <Accordion title="messages[].content는 문자열이어야 함">
    모델 항목에 `compat.requiresStringContent: true`를 설정하세요. 자세한 내용은 위의
    `requiresStringContent` 섹션을 참조하세요.
  </Accordion>

  <Accordion title="직접 /v1/chat/completions 호출은 통과하지만 openclaw infer model run은 실패함">
    도구 스키마 표면을 비활성화하려면 `compat.supportsTools: false`를 설정해 보세요.
    위의 Gemma tool-schema 주의 사항을 참조하세요.
  </Accordion>

  <Accordion title="inferrs가 더 큰 에이전트 턴에서 계속 충돌함">
    OpenClaw에서 더 이상 스키마 오류가 나지 않는데도 `inferrs`가 더 큰
    에이전트 턴에서 계속 충돌한다면, 이를 업스트림 `inferrs` 또는 모델 제한으로 취급하세요.
    프롬프트 압박을 줄이거나 다른 로컬 백엔드 또는 모델로 전환하세요.
  </Accordion>
</AccordionGroup>

<Tip>
일반적인 도움말은 [문제 해결](/ko/help/troubleshooting) 및 [FAQ](/ko/help/faq)를 참조하세요.
</Tip>

## 관련

<CardGroup cols={2}>
  <Card title="로컬 모델" href="/ko/gateway/local-models" icon="server">
    로컬 모델 서버에 대해 OpenClaw 실행하기.
  </Card>
  <Card title="Gateway 문제 해결" href="/ko/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    프로브는 통과하지만 에이전트 실행은 실패하는 로컬 OpenAI 호환 백엔드 디버깅.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    모든 provider, 모델 참조, failover 동작 개요.
  </Card>
</CardGroup>
