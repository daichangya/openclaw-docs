---
read_when:
    - web_search에 Kimi를 사용하고 싶습니다
    - '`KIMI_API_KEY` 또는 `MOONSHOT_API_KEY`가 필요합니다'
summary: Moonshot 웹 검색을 통한 Kimi 웹 검색
title: Kimi 검색
x-i18n:
    generated_at: "2026-04-24T06:40:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11e9fce35ee84b433b674d0666459a830eac1a87c5091bb90792cc0cf753fd45
    source_path: tools/kimi-search.md
    workflow: 15
---

OpenClaw는 Kimi를 `web_search` provider로 지원하며, Moonshot 웹 검색을 사용해 인용이 포함된 AI 합성 답변을 생성합니다.

## API 키 받기

<Steps>
  <Step title="키 생성">
    [Moonshot AI](https://platform.moonshot.cn/)에서 API 키를 받으세요.
  </Step>
  <Step title="키 저장">
    Gateway 환경에 `KIMI_API_KEY` 또는 `MOONSHOT_API_KEY`를 설정하거나,
    다음으로 구성하세요:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

`openclaw onboard` 또는
`openclaw configure --section web` 중에 **Kimi**를 선택하면, OpenClaw는 다음도 물을 수 있습니다:

- Moonshot API 리전:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- 기본 Kimi 웹 검색 모델(기본값 `kimi-k2.6`)

## 구성

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // KIMI_API_KEY 또는 MOONSHOT_API_KEY가 설정되어 있으면 선택 사항
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

채팅에 China API 호스트(`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`)를 사용하면, `tools.web.search.kimi.baseUrl`이 생략된 경우 OpenClaw는 Kimi
`web_search`에도 같은 호스트를 재사용하므로
[platform.moonshot.cn](https://platform.moonshot.cn/)의 키가
실수로 국제 엔드포인트로 가지 않게 됩니다(이 경우 HTTP 401이 자주 발생함). 다른 검색 base URL이 필요할 때는
`tools.web.search.kimi.baseUrl`로 재정의하세요.

**환경 변수 대안:** Gateway 환경에 `KIMI_API_KEY` 또는 `MOONSHOT_API_KEY`를 설정하세요. gateway 설치의 경우 `~/.openclaw/.env`에 넣으세요.

`baseUrl`을 생략하면 OpenClaw는 기본적으로 `https://api.moonshot.ai/v1`을 사용합니다.
`model`을 생략하면 OpenClaw는 기본적으로 `kimi-k2.6`을 사용합니다.

## 작동 방식

Kimi는 Moonshot 웹 검색을 사용해 Gemini와 Grok의 grounding 응답 방식과 비슷하게 인라인 인용이 포함된 답변을 합성합니다.

## 지원되는 파라미터

Kimi 검색은 `query`를 지원합니다.

공유 `web_search` 호환성을 위해 `count`도 받지만, Kimi는 여전히
N개 결과 목록 대신 인용이 포함된 하나의 합성 답변을 반환합니다.

provider별 필터는 현재 지원되지 않습니다.

## 관련 항목

- [웹 검색 개요](/ko/tools/web) -- 모든 provider와 자동 감지
- [Moonshot AI](/ko/providers/moonshot) -- Moonshot 모델 + Kimi Coding provider 문서
- [Gemini 검색](/ko/tools/gemini-search) -- Google grounding을 통한 AI 합성 답변
- [Grok 검색](/ko/tools/grok-search) -- xAI grounding을 통한 AI 합성 답변
